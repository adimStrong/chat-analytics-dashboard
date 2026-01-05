import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'

function formatDuration(seconds) {
  if (!seconds) return 'N/A'
  if (seconds < 60) return `${Math.round(seconds)}s`
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`
  return `${(seconds / 3600).toFixed(1)}h`
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
  const shiftColors = {
    Morning: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: '🌅', bar: '#F59E0B' },
    Mid: { bg: 'bg-blue-100', text: 'text-blue-800', icon: '☀️', bar: '#3B82F6' },
    Evening: { bg: 'bg-purple-100', text: 'text-purple-800', icon: '🌙', bar: '#8B5CF6' },
  }

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

      {/* Messages by Shift */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {shiftMessages?.map((shift) => {
          const colors = shiftColors[shift.shift] || shiftColors.Morning
          return (
            <div key={shift.shift} className={`${colors.bg} rounded-xl shadow-lg p-6`}>
              <div className="flex items-center justify-between mb-4">
                <h4 className={`font-bold text-lg ${colors.text}`}>{shift.shift}</h4>
                <span className="text-3xl">{colors.icon}</span>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-gray-600 text-sm">Total Messages</p>
                  <p className={`text-2xl font-bold ${colors.text}`}>
                    {shift.messages?.toLocaleString() || 0}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-gray-600 text-xs">Incoming</p>
                    <p className={`text-lg font-semibold ${colors.text}`}>
                      {shift.incoming?.toLocaleString() || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-xs">Outgoing</p>
                    <p className={`text-lg font-semibold ${colors.text}`}>
                      {shift.outgoing?.toLocaleString() || 0}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Comments by Shift */}
      {shiftComments && shiftComments.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Comments by Shift</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {shiftComments.map((shift) => {
              const colors = shiftColors[shift.shift] || shiftColors.Morning
              return (
                <div key={shift.shift} className={`${colors.bg} rounded-lg p-4`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`font-semibold ${colors.text}`}>{shift.shift}</span>
                    <span className="text-2xl">{colors.icon}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-gray-500 text-xs">Total</p>
                      <p className={`font-bold ${colors.text}`}>{shift.total}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">Hidden</p>
                      <p className={`font-bold ${colors.text}`}>{shift.hidden}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">Replies</p>
                      <p className={`font-bold ${colors.text}`}>{shift.replies}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Session Stats by Shift */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="font-semibold text-gray-800 mb-4">Session Performance by Shift</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Shift</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Sessions</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Avg Response</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Avg Duration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {shiftStats?.map((shift) => {
                const colors = shiftColors[shift.shift] || shiftColors.Morning
                return (
                  <tr key={shift.shift} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span>{colors.icon}</span>
                        <span className={`font-medium ${colors.text}`}>{shift.shift}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-700">
                      {shift.sessions?.toLocaleString()}
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

      {/* Category by Shift */}
      {categoryShiftStats && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Messages by Category & Shift</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={categoryShiftStats}>
              <XAxis dataKey="category" tick={{ fontSize: 11 }} />
              <YAxis />
              <Tooltip />
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
              <YAxis />
              <Tooltip />
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
