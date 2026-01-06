import { useState, useEffect } from 'react'

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

const categoryColors = {
  "Juankada Hosts": { bg: "bg-blue-100", text: "text-blue-800", border: "border-blue-300" },
  "Juana Babe": { bg: "bg-pink-100", text: "text-pink-800", border: "border-pink-300" },
  "Juan365": { bg: "bg-green-100", text: "text-green-800", border: "border-green-300" },
  "Others": { bg: "bg-purple-100", text: "text-purple-800", border: "border-purple-300" },
}

const shiftColors = {
  "Morning": { bg: "bg-yellow-50", text: "text-yellow-700", icon: "🌅" },
  "Mid": { bg: "bg-orange-50", text: "text-orange-700", icon: "☀️" },
  "Evening": { bg: "bg-indigo-50", text: "text-indigo-700", icon: "🌙" },
}

export default function Reports() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filterCategory, setFilterCategory] = useState('all')
  const [expandedPages, setExpandedPages] = useState({})

  useEffect(() => {
    fetch('/data/analytics.json')
      .then(res => res.json())
      .then(d => setData(d))
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

  if (!data || !data.pageShiftPerformance) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-800">
        No report data available. Run the export script first.
      </div>
    )
  }

  const { pageShiftPerformance, totals, categoryStats } = data

  // Group by page name
  const pageGroups = {}
  pageShiftPerformance.forEach(item => {
    if (!pageGroups[item.name]) {
      pageGroups[item.name] = {
        name: item.name,
        pageId: item.pageId,
        category: item.category,
        shifts: {}
      }
    }
    pageGroups[item.name].shifts[item.shift] = item
  })

  // Convert to array and calculate totals per page
  const pages = Object.values(pageGroups).map(page => {
    const totals = { messages: 0, incoming: 0, outgoing: 0, sessions: 0 }
    Object.values(page.shifts).forEach(s => {
      totals.messages += s.messages || 0
      totals.incoming += s.incoming || 0
      totals.outgoing += s.outgoing || 0
      totals.sessions += s.sessions || 0
    })
    return { ...page, totals }
  })

  // Sort by total messages desc
  pages.sort((a, b) => b.totals.messages - a.totals.messages)

  // Filter by category
  const filteredPages = filterCategory === 'all'
    ? pages
    : pages.filter(p => p.category === filterCategory)

  const togglePage = (pageName) => {
    setExpandedPages(prev => ({ ...prev, [pageName]: !prev[pageName] }))
  }

  // Calculate grand totals
  const grandTotals = {
    messages: filteredPages.reduce((sum, p) => sum + p.totals.messages, 0),
    sessions: filteredPages.reduce((sum, p) => sum + p.totals.sessions, 0),
    incoming: filteredPages.reduce((sum, p) => sum + p.totals.incoming, 0),
    outgoing: filteredPages.reduce((sum, p) => sum + p.totals.outgoing, 0)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Management Report</h2>
          <p className="text-gray-600">Shift Performance by Page</p>
        </div>
        <div className="text-right text-sm text-gray-500">
          <p>Last Updated: {new Date(data.lastSync).toLocaleString('en-PH', { timeZone: 'Asia/Manila' })}</p>
          <p>Data Range: {data.dateRange?.minDate} to {data.dateRange?.maxDate}</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-lg p-4">
          <p className="text-gray-500 text-sm">Total Messages</p>
          <p className="text-2xl font-bold text-blue-600">{formatNumber(totals?.messages)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-4">
          <p className="text-gray-500 text-sm">Total Sessions</p>
          <p className="text-2xl font-bold text-green-600">{formatNumber(totals?.sessions)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-4">
          <p className="text-gray-500 text-sm">Avg Response Time</p>
          <p className="text-2xl font-bold text-orange-600">{formatDuration(totals?.avgResponseTime)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-4">
          <p className="text-gray-500 text-sm">Pages</p>
          <p className="text-2xl font-bold text-purple-600">{filteredPages.length} / {pages.length}</p>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilterCategory('all')}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            filterCategory === 'all'
              ? 'bg-gray-800 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All Categories
        </button>
        {categoryStats?.map(cat => {
          const colors = categoryColors[cat.category] || categoryColors.Others
          return (
            <button
              key={cat.category}
              onClick={() => setFilterCategory(cat.category)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filterCategory === cat.category
                  ? `${colors.bg} ${colors.text} ${colors.border} border-2`
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {cat.category} ({cat.pageCount})
            </button>
          )
        })}
      </div>

      {/* Main Report Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-800 text-white">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Page</th>
                <th className="px-4 py-3 text-left font-medium">Shift</th>
                <th className="px-4 py-3 text-right font-medium">Messages</th>
                <th className="px-4 py-3 text-right font-medium">Incoming</th>
                <th className="px-4 py-3 text-right font-medium">Outgoing</th>
                <th className="px-4 py-3 text-right font-medium">Sessions</th>
                <th className="px-4 py-3 text-right font-medium">Avg Resp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredPages.map((page, pageIndex) => {
                const colors = categoryColors[page.category] || categoryColors.Others
                const isExpanded = expandedPages[page.name]
                const shifts = ['Morning', 'Mid', 'Evening']

                return (
                  <>
                    {/* Page Header Row */}
                    <tr
                      key={page.name}
                      className={`${colors.bg} cursor-pointer hover:opacity-90`}
                      onClick={() => togglePage(page.name)}
                    >
                      <td className="px-4 py-3 font-semibold">
                        <div className="flex items-center gap-2">
                          <span className={`transform transition ${isExpanded ? 'rotate-90' : ''}`}>▶</span>
                          <span>{page.name}</span>
                          <span className={`text-xs px-2 py-0.5 rounded ${colors.text} bg-white/50`}>
                            {page.category}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-sm">All Shifts</td>
                      <td className="px-4 py-3 text-right font-bold">{formatNumber(page.totals.messages)}</td>
                      <td className="px-4 py-3 text-right">{formatNumber(page.totals.incoming)}</td>
                      <td className="px-4 py-3 text-right">{formatNumber(page.totals.outgoing)}</td>
                      <td className="px-4 py-3 text-right font-bold">{formatNumber(page.totals.sessions)}</td>
                      <td className="px-4 py-3 text-right">-</td>
                    </tr>

                    {/* Shift Detail Rows */}
                    {isExpanded && shifts.map(shift => {
                      const shiftData = page.shifts[shift] || {}
                      const sColors = shiftColors[shift]
                      return (
                        <tr key={`${page.name}-${shift}`} className={`${sColors.bg} border-l-4 border-l-gray-300`}>
                          <td className="px-4 py-2 pl-12 text-gray-600"></td>
                          <td className="px-4 py-2">
                            <span className={`${sColors.text} font-medium`}>
                              {sColors.icon} {shift}
                            </span>
                            <span className="text-gray-400 text-xs ml-2">
                              {shift === 'Morning' ? '6am-2pm' : shift === 'Mid' ? '2pm-10pm' : '10pm-6am'}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-right">{formatNumber(shiftData.messages)}</td>
                          <td className="px-4 py-2 text-right text-green-600">{formatNumber(shiftData.incoming)}</td>
                          <td className="px-4 py-2 text-right text-blue-600">{formatNumber(shiftData.outgoing)}</td>
                          <td className="px-4 py-2 text-right">{formatNumber(shiftData.sessions)}</td>
                          <td className="px-4 py-2 text-right">{formatDuration(shiftData.avgResponseTime)}</td>
                        </tr>
                      )
                    })}
                  </>
                )
              })}
            </tbody>

            {/* Grand Totals */}
            <tfoot className="bg-gray-100 font-bold">
              <tr>
                <td className="px-4 py-3" colSpan={2}>
                  Grand Total ({filteredPages.length} pages)
                </td>
                <td className="px-4 py-3 text-right text-lg">{formatNumber(grandTotals.messages)}</td>
                <td className="px-4 py-3 text-right text-green-600">{formatNumber(grandTotals.incoming)}</td>
                <td className="px-4 py-3 text-right text-blue-600">{formatNumber(grandTotals.outgoing)}</td>
                <td className="px-4 py-3 text-right text-lg">{formatNumber(grandTotals.sessions)}</td>
                <td className="px-4 py-3 text-right">-</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Shift Summary by Category */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="font-semibold text-gray-800 mb-4">Shift Summary by Category</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {['Morning', 'Mid', 'Evening'].map(shift => {
            const sColors = shiftColors[shift]
            const shiftData = filteredPages.reduce((acc, page) => {
              const s = page.shifts[shift] || {}
              acc.messages += s.messages || 0
              acc.sessions += s.sessions || 0
              return acc
            }, { messages: 0, sessions: 0 })

            return (
              <div key={shift} className={`${sColors.bg} rounded-xl p-4 border ${sColors.text.replace('text', 'border')}`}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">{sColors.icon}</span>
                  <div>
                    <h4 className={`font-bold ${sColors.text}`}>{shift} Shift</h4>
                    <p className="text-gray-500 text-xs">
                      {shift === 'Morning' ? '6:00 AM - 2:00 PM' : shift === 'Mid' ? '2:00 PM - 10:00 PM' : '10:00 PM - 6:00 AM'}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-500 text-sm">Messages</p>
                    <p className={`text-xl font-bold ${sColors.text}`}>{formatNumber(shiftData.messages)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm">Sessions</p>
                    <p className={`text-xl font-bold ${sColors.text}`}>{formatNumber(shiftData.sessions)}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Print Info */}
      <div className="text-center text-gray-400 text-sm print:hidden">
        Click on a page row to expand shift details
      </div>
    </div>
  )
}
