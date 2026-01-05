import { useState, useEffect, useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts'
import DateFilter, { filterDataByDateRange, aggregateDailyStats } from '../components/DateFilter'

// Helper to get date in Philippine time (UTC+8)
function getPhilippineDate(daysAgo = 0) {
  const now = new Date()
  const phTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Manila' }))
  phTime.setDate(phTime.getDate() - daysAgo)
  return phTime.toISOString().split('T')[0]
}

function formatNumber(value) {
  if (value === null || value === undefined) return '0'
  return Number(value).toLocaleString('en-US')
}

function StatCard({ title, value, subtitle, icon, color = 'blue' }) {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    purple: 'from-purple-500 to-purple-600',
    orange: 'from-orange-500 to-orange-600',
    pink: 'from-pink-500 to-pink-600',
    red: 'from-red-500 to-red-600',
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
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  useEffect(() => {
    fetch('/data/analytics.json')
      .then(res => res.json())
      .then(d => {
        setData(d)
        // Set default to last 7 days (Philippine time)
        if (d.dateRange?.maxDate) {
          setStartDate(getPhilippineDate(7))
          setEndDate(getPhilippineDate(0))
        }
      })
      .catch(err => console.error('Error loading data:', err))
      .finally(() => setLoading(false))
  }, [])

  const handleFilterChange = (start, end) => {
    setStartDate(start)
    setEndDate(end)
  }

  // Filter and aggregate data based on selected date range
  const filteredData = useMemo(() => {
    if (!data?.dailyStats) return null

    const filtered = filterDataByDateRange(data.dailyStats, startDate, endDate)
    const aggregated = aggregateDailyStats(filtered)

    // Format daily trend for chart
    const dailyTrend = filtered.map(d => ({
      date: d.date.slice(5), // MM-DD format
      total: d.comments,
      followups: d.withReplies,
      hidden: d.hidden
    }))

    // Calculate shift breakdown from dailyShiftStats
    let shiftMessages = { Morning: { total: 0, received: 0, sent: 0 }, Mid: { total: 0, received: 0, sent: 0 }, Evening: { total: 0, received: 0, sent: 0 } }
    if (data.dailyShiftStats) {
      Object.entries(data.dailyShiftStats).forEach(([date, shifts]) => {
        if (date >= startDate && date <= endDate) {
          Object.entries(shifts).forEach(([shift, stats]) => {
            if (shiftMessages[shift]) {
              shiftMessages[shift].total += stats.messages || 0
              shiftMessages[shift].received += stats.incoming || 0
              shiftMessages[shift].sent += stats.outgoing || 0
            }
          })
        }
      })
    }

    const messagesByTimeframe = ['Morning', 'Mid', 'Evening'].map(shift => ({
      shift,
      received: shiftMessages[shift].received,
      sent: shiftMessages[shift].sent,
      total: shiftMessages[shift].total
    }))

    return {
      totals: aggregated,
      dailyTrend,
      messagesByTimeframe
    }
  }, [data, startDate, endDate])

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

  const { shiftStats } = data
  const totals = filteredData?.totals || {}
  const dailyTrend = filteredData?.dailyTrend || []
  const messagesByTimeframe = filteredData?.messagesByTimeframe || []

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>
        <p className="text-gray-600">Chat analytics across all 26 pages</p>
      </div>

      {/* Date Filter */}
      <DateFilter
        dateRange={data.dateRange}
        dailyStats={data.dailyStats}
        onFilterChange={handleFilterChange}
      />

      {/* Stats Cards - Row 1: Messages & Response */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Messages"
          value={formatNumber(totals.messages)}
          subtitle={`${formatNumber(totals.incoming)} received`}
          icon="💬"
          color="blue"
        />
        <StatCard
          title="Chat Response Time"
          value={formatDuration(totals.avgResponseTime)}
          subtitle="Average response"
          icon="⚡"
          color="purple"
        />
        <StatCard
          title="Total Sessions"
          value={formatNumber(totals.sessions)}
          subtitle={`Across ${data.totals?.pages || 0} pages`}
          icon="📊"
          color="green"
        />
        <StatCard
          title="Total Comments"
          value={formatNumber(totals.comments)}
          subtitle="All page comments"
          icon="💭"
          color="orange"
        />
      </div>

      {/* Stats Cards - Row 2: Comment Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Follow-up Comments"
          value={formatNumber(totals.withReplies)}
          subtitle="Comments with replies"
          icon="🔄"
          color="pink"
        />
        <StatCard
          title="Reply to Comment"
          value={formatNumber(totals.replies)}
          subtitle="Total page replies"
          icon="↩️"
          color="green"
        />
        <StatCard
          title="Hidden Comments"
          value={formatNumber(totals.hidden)}
          subtitle="Moderated/hidden"
          icon="🚫"
          color="red"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Response Time by Shift */}
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
              <Bar dataKey="avgResponseTime" fill="#8B5CF6" name="Avg Response" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Received Chat by Shift */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Received Chat by Timeframe</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={messagesByTimeframe}>
              <XAxis dataKey="shift" />
              <YAxis />
              <Tooltip formatter={(value) => formatNumber(value)} />
              <Legend />
              <Bar dataKey="received" fill="#3B82F6" name="Received" radius={[4, 4, 0, 0]} />
              <Bar dataKey="sent" fill="#10B981" name="Sent" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Follow-up Trend */}
      {dailyTrend && dailyTrend.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Daily Comment Activity</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={dailyTrend}>
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(value) => formatNumber(value)} />
              <Legend />
              <Line type="monotone" dataKey="total" stroke="#3B82F6" strokeWidth={2} name="Total Comments" dot={{ fill: '#3B82F6' }} />
              <Line type="monotone" dataKey="followups" stroke="#10B981" strokeWidth={2} name="With Replies" dot={{ fill: '#10B981' }} />
              <Line type="monotone" dataKey="hidden" stroke="#EF4444" strokeWidth={2} name="Hidden" dot={{ fill: '#EF4444' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Shift Schedule Reference */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="font-semibold text-gray-800 mb-4">Shift Schedule</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-3 p-4 bg-yellow-50 rounded-lg">
            <span className="text-3xl">🌅</span>
            <div>
              <p className="font-semibold text-yellow-800">Morning Shift</p>
              <p className="text-yellow-600">6:00 AM - 2:00 PM</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg">
            <span className="text-3xl">☀️</span>
            <div>
              <p className="font-semibold text-blue-800">Mid Shift</p>
              <p className="text-blue-600">2:00 PM - 10:00 PM</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-4 bg-purple-50 rounded-lg">
            <span className="text-3xl">🌙</span>
            <div>
              <p className="font-semibold text-purple-800">Evening Shift</p>
              <p className="text-purple-600">10:00 PM - 6:00 AM</p>
            </div>
          </div>
        </div>
      </div>

      {/* Last Sync */}
      {data.lastSync && (
        <div className="text-center text-gray-500 text-sm">
          Last updated: {new Date(data.lastSync).toLocaleString('en-PH', { timeZone: 'Asia/Manila', dateStyle: 'medium', timeStyle: 'short' })}
        </div>
      )}
    </div>
  )
}
