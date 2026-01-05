import { useState, useEffect, useMemo } from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts'
import DateFilter, { filterDataByDateRange, aggregateDailyStats } from '../components/DateFilter'

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
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  useEffect(() => {
    fetch('/data/analytics.json')
      .then(res => res.json())
      .then(d => {
        setData(d)
        // Set default to last 7 days
        if (d.dateRange?.maxDate) {
          const end = new Date(d.dateRange.maxDate)
          const start = new Date(end)
          start.setDate(start.getDate() - 7)
          setStartDate(start.toISOString().split('T')[0])
          setEndDate(d.dateRange.maxDate)
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
      total: shiftMessages[shift].total,
      received: shiftMessages[shift].received,
      sent: shiftMessages[shift].sent,
      avgResponse: null // Would need per-shift avg in daily data
    }))

    // Hourly distribution (aggregate from dailyStats if available, else use static)
    const hourlyDistribution = data.hourlyDistribution || []

    return {
      totals: aggregated,
      messagesByTimeframe,
      hourlyDistribution
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

  const totals = filteredData?.totals || {}
  const messagesByTimeframe = filteredData?.messagesByTimeframe || []
  const hourlyDistribution = filteredData?.hourlyDistribution || []

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Message Analytics</h2>
        <p className="text-gray-600">Detailed message metrics and trends</p>
      </div>

      {/* Date Filter */}
      <DateFilter
        dateRange={data.dateRange}
        dailyStats={data.dailyStats}
        onFilterChange={handleFilterChange}
      />

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
                {formatNumber(totals.messages)}
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
                {formatNumber(totals.incoming)}
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
                {formatNumber(totals.outgoing)}
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
                {formatDuration(totals.avgResponseTime)}
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
          <h3 className="font-semibold text-gray-800 mb-4">Message Volume by Hour (All Time)</h3>
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
