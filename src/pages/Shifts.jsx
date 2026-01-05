import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts'

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

  const { shiftStats } = data
  const shiftColors = {
    Morning: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: '🌅' },
    Mid: { bg: 'bg-blue-100', text: 'text-blue-800', icon: '☀️' },
    Evening: { bg: 'bg-purple-100', text: 'text-purple-800', icon: '🌙' },
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

      {/* Shift Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {shiftStats?.map((shift) => {
          const colors = shiftColors[shift.shift] || shiftColors.Morning
          return (
            <div key={shift.shift} className={`${colors.bg} rounded-xl shadow-lg p-6`}>
              <div className="flex items-center justify-between mb-4">
                <h4 className={`font-bold text-lg ${colors.text}`}>{shift.shift}</h4>
                <span className="text-3xl">{colors.icon}</span>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-gray-600 text-sm">Sessions</p>
                  <p className={`text-2xl font-bold ${colors.text}`}>
                    {shift.sessions?.toLocaleString() || 0}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Avg Response Time</p>
                  <p className={`text-xl font-semibold ${colors.text}`}>
                    {formatDuration(shift.avgResponseTime)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Avg Session Duration</p>
                  <p className={`text-xl font-semibold ${colors.text}`}>
                    {formatDuration(shift.avgDuration)}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Comparison Chart */}
      {shiftStats && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Shift Comparison</h3>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={shiftStats}>
              <XAxis dataKey="shift" />
              <YAxis yAxisId="left" orientation="left" stroke="#3B82F6" />
              <YAxis yAxisId="right" orientation="right" stroke="#10B981" tickFormatter={(v) => `${Math.round(v / 60)}m`} />
              <Tooltip
                formatter={(value, name) => {
                  if (name === 'sessions') return [value, 'Sessions']
                  return [formatDuration(value), name === 'avgResponseTime' ? 'Avg Response' : 'Avg Duration']
                }}
              />
              <Legend />
              <Bar yAxisId="left" dataKey="sessions" fill="#3B82F6" name="Sessions" radius={[4, 4, 0, 0]} />
              <Bar yAxisId="right" dataKey="avgResponseTime" fill="#10B981" name="Avg Response Time" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
