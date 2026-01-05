import { useState, useEffect } from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts'

function formatNumber(value) {
  if (value === null || value === undefined) return '0'
  return Number(value).toLocaleString('en-US')
}

function formatDuration(seconds) {
  if (!seconds) return 'N/A'
  if (seconds < 60) return `${Math.round(seconds)}s`
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`
  return `${(seconds / 3600).toFixed(1)}h`
}

const shiftColors = {
  Morning: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: '🌅' },
  Mid: { bg: 'bg-blue-100', text: 'text-blue-800', icon: '☀️' },
  Evening: { bg: 'bg-purple-100', text: 'text-purple-800', icon: '🌙' },
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

  const { messageStats, hourlyDistribution, messagesByTimeframe, totals } = data

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Message Analytics</h2>
        <p className="text-gray-600">Detailed message metrics and trends</p>
      </div>

      {/* Message Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center space-x-4">
            <div className="bg-blue-100 p-3 rounded-lg">
              <span className="text-2xl">💬</span>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Total Messages</p>
              <p className="text-2xl font-bold text-gray-800">
                {formatNumber(totals?.messages)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center space-x-4">
            <div className="bg-green-100 p-3 rounded-lg">
              <span className="text-2xl">📥</span>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Received</p>
              <p className="text-2xl font-bold text-gray-800">
                {formatNumber(messageStats?.incoming)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center space-x-4">
            <div className="bg-orange-100 p-3 rounded-lg">
              <span className="text-2xl">📤</span>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Sent</p>
              <p className="text-2xl font-bold text-gray-800">
                {formatNumber(messageStats?.outgoing)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center space-x-4">
            <div className="bg-purple-100 p-3 rounded-lg">
              <span className="text-2xl">⚡</span>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Avg Response</p>
              <p className="text-2xl font-bold text-gray-800">
                {formatDuration(totals?.avgResponseTime)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Received Chat by Timeframe Table */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="font-semibold text-gray-800 mb-4">Received Chat by Timeframe</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Shift</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Received</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Sent</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Avg Response</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {messagesByTimeframe?.map((row) => {
                const colors = shiftColors[row.shift] || shiftColors.Morning
                return (
                  <tr key={row.shift} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span>{colors.icon}</span>
                        <span className={`font-medium ${colors.text}`}>{row.shift}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-gray-700 font-semibold">
                      {formatNumber(row.total)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-blue-600">
                      {formatNumber(row.received)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-green-600">
                      {formatNumber(row.sent)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-purple-600">
                      {formatDuration(row.avgResponse)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
            {messagesByTimeframe && (
              <tfoot className="bg-gray-50 font-semibold">
                <tr>
                  <td className="px-4 py-3">Total</td>
                  <td className="px-4 py-3 text-right text-gray-800">
                    {formatNumber(messagesByTimeframe.reduce((sum, r) => sum + (r.total || 0), 0))}
                  </td>
                  <td className="px-4 py-3 text-right text-blue-600">
                    {formatNumber(messagesByTimeframe.reduce((sum, r) => sum + (r.received || 0), 0))}
                  </td>
                  <td className="px-4 py-3 text-right text-green-600">
                    {formatNumber(messagesByTimeframe.reduce((sum, r) => sum + (r.sent || 0), 0))}
                  </td>
                  <td className="px-4 py-3 text-right text-purple-600">
                    {formatDuration(totals?.avgResponseTime)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Timeframe Chart */}
      {messagesByTimeframe && messagesByTimeframe.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Message Volume by Shift</h3>
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
      )}

      {/* Hourly Distribution */}
      {hourlyDistribution && hourlyDistribution.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Message Volume by Hour</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={hourlyDistribution}>
              <XAxis dataKey="hour" tickFormatter={(h) => `${h}:00`} />
              <YAxis />
              <Tooltip
                labelFormatter={(h) => `${h}:00 - ${h + 1}:00`}
                formatter={(value) => formatNumber(value)}
              />
              <Area
                type="monotone"
                dataKey="messages"
                stroke="#3B82F6"
                fill="#93C5FD"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-6 mt-4 text-sm text-gray-600">
            <span className="flex items-center gap-1">
              <span className="text-yellow-500">🌅</span> Morning: 6am-2pm
            </span>
            <span className="flex items-center gap-1">
              <span className="text-blue-500">☀️</span> Mid: 2pm-10pm
            </span>
            <span className="flex items-center gap-1">
              <span className="text-purple-500">🌙</span> Evening: 10pm-6am
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
