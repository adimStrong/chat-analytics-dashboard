import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts'

const COLORS = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899']

function StatCard({ title, value, subtitle, icon, color = 'blue' }) {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    purple: 'from-purple-500 to-purple-600',
    orange: 'from-orange-500 to-orange-600',
  }

  return (
    <div className={`bg-gradient-to-br ${colorClasses[color]} rounded-xl p-6 text-white shadow-lg`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white/80 text-sm">{title}</p>
          <p className="text-3xl font-bold mt-1">{value}</p>
          {subtitle && <p className="text-white/70 text-sm mt-1">{subtitle}</p>}
        </div>
        <div className="text-4xl opacity-80">{icon}</div>
      </div>
    </div>
  )
}

function formatDuration(seconds) {
  if (!seconds) return 'N/A'
  if (seconds < 60) return `${Math.round(seconds)}s`
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`
  return `${(seconds / 3600).toFixed(1)}h`
}

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/data/analytics.json')
      .then(res => res.json())
      .then(setData)
      .catch(err => console.error('Error loading data:', err))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-800">
        No data available. Run the sync script first.
      </div>
    )
  }

  const { totals, shiftStats, topPages, dailyTrend } = data

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>
        <p className="text-gray-600">Chat analytics across all 26 pages</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Messages"
          value={totals?.messages?.toLocaleString() || 0}
          subtitle={`From ${totals?.conversations || 0} conversations`}
          icon="💬"
          color="blue"
        />
        <StatCard
          title="Total Sessions"
          value={totals?.sessions?.toLocaleString() || 0}
          subtitle={`Across ${totals?.pages || 0} pages`}
          icon="📊"
          color="green"
        />
        <StatCard
          title="Avg Response Time"
          value={formatDuration(totals?.avgResponseTime)}
          subtitle="Overall average"
          icon="⚡"
          color="purple"
        />
        <StatCard
          title="Avg Session Duration"
          value={formatDuration(totals?.avgSessionDuration)}
          subtitle="Per chat session"
          icon="⏱️"
          color="orange"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Shift Breakdown */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Response Time by Shift</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={shiftStats}>
              <XAxis dataKey="shift" />
              <YAxis tickFormatter={(v) => `${Math.round(v / 60)}m`} />
              <Tooltip
                formatter={(value) => formatDuration(value)}
                labelFormatter={(label) => `${label} Shift`}
              />
              <Bar dataKey="avgResponseTime" fill="#3B82F6" name="Avg Response" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top Pages */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Top Pages by Message Volume</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topPages?.slice(0, 8)} layout="vertical">
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="messages" fill="#10B981" name="Messages" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Daily Trend */}
      {dailyTrend && dailyTrend.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Messages Trend (Last 7 Days)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={dailyTrend}>
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="messages" stroke="#3B82F6" strokeWidth={2} dot={{ fill: '#3B82F6' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Last Sync */}
      {data.lastSync && (
        <div className="text-center text-gray-500 text-sm">
          Last updated: {new Date(data.lastSync).toLocaleString()}
        </div>
      )}
    </div>
  )
}
