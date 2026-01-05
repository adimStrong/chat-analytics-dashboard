import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'

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

const shiftConfig = {
  Morning: { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-800', icon: '🌅', bar: '#F59E0B', time: '6:00 AM - 2:00 PM' },
  Mid: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800', icon: '☀️', bar: '#3B82F6', time: '2:00 PM - 10:00 PM' },
  Evening: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-800', icon: '🌙', bar: '#8B5CF6', time: '10:00 PM - 6:00 AM' },
}

export default function Shifts() {
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

  const { shiftStats, shiftMessages, shiftComments, categoryShiftStats } = data

  // Combine all shift data for the cards
  const combinedShiftData = ['Morning', 'Mid', 'Evening'].map(shiftName => {
    const messages = shiftMessages?.find(s => s.shift === shiftName) || {}
    const comments = shiftComments?.find(s => s.shift === shiftName) || {}
    const stats = shiftStats?.find(s => s.shift === shiftName) || {}

    return {
      shift: shiftName,
      totalMessages: messages.messages || 0,
      incoming: messages.incoming || 0,
      outgoing: messages.outgoing || 0,
      totalComments: comments.total || 0,
      hiddenComments: comments.hidden || 0,
      commentsWithReplies: comments.withReplies || comments.replies ? Math.min(comments.replies || 0, comments.total || 0) : 0,
      replies: comments.replies || 0,
      sessions: stats.sessions || 0,
      avgResponseTime: stats.avgResponseTime,
      avgDuration: stats.avgDuration,
    }
  })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Shift Analytics</h2>
        <p className="text-gray-600">Performance breakdown by shift (Morning/Mid/Evening)</p>
      </div>

      {/* Shift Time Guide */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="font-semibold text-gray-800 mb-4">Shift Schedule</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {['Morning', 'Mid', 'Evening'].map(shift => {
            const config = shiftConfig[shift]
            return (
              <div key={shift} className={`flex items-center space-x-3 p-4 ${config.bg} rounded-lg`}>
                <span className="text-3xl">{config.icon}</span>
                <div>
                  <p className={`font-semibold ${config.text}`}>{shift} Shift</p>
                  <p className={config.text.replace('800', '600')}>{config.time}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Per-Shift Cards with All 6 Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {combinedShiftData.map((shiftData) => {
          const config = shiftConfig[shiftData.shift]
          return (
            <div key={shiftData.shift} className={`${config.bg} ${config.border} border-2 rounded-xl shadow-lg p-6`}>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h4 className={`font-bold text-xl ${config.text}`}>{shiftData.shift} Shift</h4>
                  <p className="text-gray-600 text-sm">{config.time}</p>
                </div>
                <span className="text-4xl">{config.icon}</span>
              </div>

              <div className="space-y-4">
                {/* Messages Section */}
                <div className="bg-white/60 rounded-lg p-4">
                  <h5 className="text-gray-700 font-semibold mb-2 flex items-center gap-2">
                    <span>💬</span> Messages
                  </h5>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-gray-500 text-xs">Total</p>
                      <p className={`text-lg font-bold ${config.text}`}>{formatNumber(shiftData.totalMessages)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">Incoming</p>
                      <p className="text-lg font-bold text-blue-600">{formatNumber(shiftData.incoming)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">Outgoing</p>
                      <p className="text-lg font-bold text-green-600">{formatNumber(shiftData.outgoing)}</p>
                    </div>
                  </div>
                </div>

                {/* Comments Section */}
                <div className="bg-white/60 rounded-lg p-4">
                  <h5 className="text-gray-700 font-semibold mb-2 flex items-center gap-2">
                    <span>💭</span> Comments
                  </h5>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-gray-500 text-xs">Total</p>
                      <p className={`text-lg font-bold ${config.text}`}>{formatNumber(shiftData.totalComments)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">With Replies</p>
                      <p className="text-lg font-bold text-green-600">{formatNumber(shiftData.replies)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">Hidden</p>
                      <p className="text-lg font-bold text-red-600">{formatNumber(shiftData.hiddenComments)}</p>
                    </div>
                  </div>
                </div>

                {/* Response Time Section */}
                <div className="bg-white/60 rounded-lg p-4">
                  <h5 className="text-gray-700 font-semibold mb-2 flex items-center gap-2">
                    <span>⚡</span> Response
                  </h5>
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div>
                      <p className="text-gray-500 text-xs">Avg Response</p>
                      <p className={`text-lg font-bold ${config.text}`}>{formatDuration(shiftData.avgResponseTime)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">Sessions</p>
                      <p className={`text-lg font-bold ${config.text}`}>{formatNumber(shiftData.sessions)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Session Performance Table */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="font-semibold text-gray-800 mb-4">Session Performance by Shift</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Shift</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Sessions</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Messages</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Comments</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Avg Response</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Avg Duration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {combinedShiftData.map((shift) => {
                const config = shiftConfig[shift.shift]
                return (
                  <tr key={shift.shift} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span>{config.icon}</span>
                        <span className={`font-medium ${config.text}`}>{shift.shift}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-700">
                      {formatNumber(shift.sessions)}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-700">
                      {formatNumber(shift.totalMessages)}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-700">
                      {formatNumber(shift.totalComments)}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-700">
                      {formatDuration(shift.avgResponseTime)}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-700">
                      {formatDuration(shift.avgDuration)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Category by Shift Chart */}
      {categoryShiftStats && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Messages by Category & Shift</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={categoryShiftStats}>
              <XAxis dataKey="category" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={(v) => formatNumber(v)} />
              <Tooltip formatter={(value) => formatNumber(value)} />
              <Legend />
              <Bar dataKey="Morning" fill="#F59E0B" name="Morning" stackId="a" />
              <Bar dataKey="Mid" fill="#3B82F6" name="Mid" stackId="a" />
              <Bar dataKey="Evening" fill="#8B5CF6" name="Evening" stackId="a" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Message Volume Comparison */}
      {shiftMessages && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Incoming vs Outgoing by Shift</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={shiftMessages}>
              <XAxis dataKey="shift" />
              <YAxis tickFormatter={(v) => formatNumber(v)} />
              <Tooltip formatter={(value) => formatNumber(value)} />
              <Legend />
              <Bar dataKey="incoming" fill="#3B82F6" name="Incoming" radius={[4, 4, 0, 0]} />
              <Bar dataKey="outgoing" fill="#10B981" name="Outgoing" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
