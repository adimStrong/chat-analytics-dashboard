import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'

function formatDuration(seconds) {
  if (!seconds) return 'N/A'
  if (seconds < 60) return `${Math.round(seconds)}s`
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`
  return `${(seconds / 3600).toFixed(1)}h`
}

export default function Messages() {
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

  const { messageStats, hourlyDistribution } = data

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Message Analytics</h2>
        <p className="text-gray-600">Detailed message metrics and trends</p>
      </div>

      {/* Message Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center space-x-4">
            <div className="bg-blue-100 p-3 rounded-lg">
              <span className="text-2xl">📥</span>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Incoming Messages</p>
              <p className="text-2xl font-bold text-gray-800">
                {messageStats?.incoming?.toLocaleString() || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center space-x-4">
            <div className="bg-green-100 p-3 rounded-lg">
              <span className="text-2xl">📤</span>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Outgoing Messages</p>
              <p className="text-2xl font-bold text-gray-800">
                {messageStats?.outgoing?.toLocaleString() || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center space-x-4">
            <div className="bg-purple-100 p-3 rounded-lg">
              <span className="text-2xl">📊</span>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Response Rate</p>
              <p className="text-2xl font-bold text-gray-800">
                {messageStats?.incoming > 0
                  ? `${Math.round((messageStats.outgoing / messageStats.incoming) * 100)}%`
                  : 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Hourly Distribution */}
      {hourlyDistribution && hourlyDistribution.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Message Volume by Hour</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={hourlyDistribution}>
              <XAxis dataKey="hour" tickFormatter={(h) => `${h}:00`} />
              <YAxis />
              <Tooltip labelFormatter={(h) => `${h}:00 - ${h + 1}:00`} />
              <Area
                type="monotone"
                dataKey="messages"
                stroke="#3B82F6"
                fill="#93C5FD"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
          <p className="text-center text-gray-500 text-sm mt-2">Philippine Time (UTC+8)</p>
        </div>
      )}

      {/* Response Time Distribution */}
      {data.responseTimeDistribution && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Response Time Distribution</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {data.responseTimeDistribution.map((bucket, i) => (
              <div key={i} className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-600 text-sm">{bucket.label}</p>
                <p className="text-2xl font-bold text-blue-600">{bucket.count}</p>
                <p className="text-gray-500 text-xs">{bucket.percentage}%</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
