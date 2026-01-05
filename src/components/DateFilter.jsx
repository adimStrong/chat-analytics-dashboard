import { useState, useMemo } from 'react'

export default function DateFilter({ dateRange, dailyStats, onFilterChange }) {
  const [startDate, setStartDate] = useState(dateRange?.minDate || '')
  const [endDate, setEndDate] = useState(dateRange?.maxDate || '')

  // Quick filter presets
  const presets = [
    { label: 'Today', days: 0 },
    { label: 'Last 7 Days', days: 7 },
    { label: 'Last 30 Days', days: 30 },
    { label: 'All Time', days: -1 },
  ]

  const handlePreset = (days) => {
    if (days === -1) {
      setStartDate(dateRange?.minDate || '')
      setEndDate(dateRange?.maxDate || '')
      onFilterChange(dateRange?.minDate, dateRange?.maxDate)
    } else if (days === 0) {
      const today = new Date().toISOString().split('T')[0]
      setStartDate(today)
      setEndDate(today)
      onFilterChange(today, today)
    } else {
      const end = new Date()
      const start = new Date()
      start.setDate(start.getDate() - days)
      const startStr = start.toISOString().split('T')[0]
      const endStr = end.toISOString().split('T')[0]
      setStartDate(startStr)
      setEndDate(endStr)
      onFilterChange(startStr, endStr)
    }
  }

  const handleApply = () => {
    onFilterChange(startDate, endDate)
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-gray-600 text-sm font-medium">From:</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            min={dateRange?.minDate}
            max={dateRange?.maxDate}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-600 text-sm font-medium">To:</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            min={dateRange?.minDate}
            max={dateRange?.maxDate}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <button
          onClick={handleApply}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
        >
          Apply
        </button>
        <div className="flex gap-2 ml-auto">
          {presets.map((preset) => (
            <button
              key={preset.label}
              onClick={() => handlePreset(preset.days)}
              className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 hover:bg-gray-50 text-gray-700 transition"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// Helper function to filter data by date range
export function filterDataByDateRange(dailyStats, startDate, endDate) {
  if (!dailyStats || !startDate || !endDate) return dailyStats

  return dailyStats.filter(d => d.date >= startDate && d.date <= endDate)
}

// Helper function to aggregate filtered daily stats
export function aggregateDailyStats(filteredStats) {
  if (!filteredStats || filteredStats.length === 0) {
    return {
      messages: 0,
      incoming: 0,
      outgoing: 0,
      comments: 0,
      hidden: 0,
      replies: 0,
      withReplies: 0,
      sessions: 0,
      avgResponseTime: null,
    }
  }

  const totals = filteredStats.reduce((acc, d) => ({
    messages: acc.messages + (d.messages || 0),
    incoming: acc.incoming + (d.incoming || 0),
    outgoing: acc.outgoing + (d.outgoing || 0),
    comments: acc.comments + (d.comments || 0),
    hidden: acc.hidden + (d.hidden || 0),
    replies: acc.replies + (d.replies || 0),
    withReplies: acc.withReplies + (d.withReplies || 0),
    sessions: acc.sessions + (d.sessions || 0),
    responseTimeSum: acc.responseTimeSum + (d.avgResponseTime ? d.avgResponseTime * d.sessions : 0),
    responseTimeCount: acc.responseTimeCount + (d.avgResponseTime ? d.sessions : 0),
  }), {
    messages: 0, incoming: 0, outgoing: 0, comments: 0, hidden: 0,
    replies: 0, withReplies: 0, sessions: 0, responseTimeSum: 0, responseTimeCount: 0
  })

  return {
    ...totals,
    avgResponseTime: totals.responseTimeCount > 0
      ? Math.round(totals.responseTimeSum / totals.responseTimeCount)
      : null
  }
}
