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

const categoryColors = {
  "Juankada Hosts": { bg: "bg-blue-100", text: "text-blue-800", border: "border-blue-200", icon: "🎤" },
  "Juana Babe": { bg: "bg-pink-100", text: "text-pink-800", border: "border-pink-200", icon: "💃" },
  "Juan365": { bg: "bg-green-100", text: "text-green-800", border: "border-green-200", icon: "🎯" },
  "Others": { bg: "bg-purple-100", text: "text-purple-800", border: "border-purple-200", icon: "📺" },
}

export default function Pages() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState('messages')
  const [sortOrder, setSortOrder] = useState('desc')
  const [filterCategory, setFilterCategory] = useState('all')

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

  const { pageStats, categoryStats } = data

  // Filter by category
  const filteredPages = filterCategory === 'all'
    ? pageStats
    : pageStats?.filter(p => p.category === filterCategory)

  // Sort pages
  const sortedPages = [...(filteredPages || [])].sort((a, b) => {
    const aVal = a[sortBy] || 0
    const bVal = b[sortBy] || 0
    return sortOrder === 'desc' ? bVal - aVal : aVal - bVal
  })

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')
    } else {
      setSortBy(field)
      setSortOrder('desc')
    }
  }

  // Group pages by category for hierarchy view
  const pagesByCategory = {
    "Juankada Hosts": sortedPages.filter(p => p.category === "Juankada Hosts"),
    "Juan365": sortedPages.filter(p => p.category === "Juan365"),
    "Juana Babe": sortedPages.filter(p => p.category === "Juana Babe"),
    "Others": sortedPages.filter(p => p.category === "Others"),
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Page Analytics</h2>
        <p className="text-gray-600">Performance metrics by category and page</p>
      </div>

      {/* Category Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {categoryStats?.map(cat => {
          const colors = categoryColors[cat.category] || categoryColors.Others
          const isSelected = filterCategory === cat.category
          return (
            <div
              key={cat.category}
              className={`${colors.bg} ${colors.border} border-2 rounded-xl p-4 cursor-pointer transition hover:shadow-md ${
                isSelected ? 'ring-2 ring-offset-2 ring-blue-500' : ''
              }`}
              onClick={() => setFilterCategory(isSelected ? 'all' : cat.category)}
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{colors.icon}</span>
                    <p className={`font-semibold ${colors.text}`}>{cat.category}</p>
                  </div>
                  <p className="text-gray-600 text-sm">{cat.pageCount} pages</p>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-gray-500">Messages</p>
                  <p className={`font-bold ${colors.text}`}>{formatNumber(cat.messages)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Comments</p>
                  <p className={`font-bold ${colors.text}`}>{formatNumber(cat.comments)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Sessions</p>
                  <p className={`font-bold ${colors.text}`}>{formatNumber(cat.sessions)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Avg Resp</p>
                  <p className={`font-bold ${colors.text}`}>{formatDuration(cat.avgResponseTime)}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Category Comparison Chart */}
      {categoryStats && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Messages & Comments by Category</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={categoryStats}>
              <XAxis dataKey="category" tick={{ fontSize: 12 }} />
              <YAxis tickFormatter={(v) => formatNumber(v)} />
              <Tooltip formatter={(value) => formatNumber(value)} />
              <Legend />
              <Bar dataKey="messages" fill="#3B82F6" name="Messages" radius={[4, 4, 0, 0]} />
              <Bar dataKey="comments" fill="#10B981" name="Comments" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Filter indicator */}
      {filterCategory !== 'all' && (
        <div className="flex items-center gap-2">
          <span className="text-gray-600">Showing:</span>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${categoryColors[filterCategory]?.bg} ${categoryColors[filterCategory]?.text}`}>
            {categoryColors[filterCategory]?.icon} {filterCategory}
          </span>
          <button
            onClick={() => setFilterCategory('all')}
            className="text-blue-600 hover:underline text-sm"
          >
            Show all
          </button>
        </div>
      )}

      {/* Pages Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Page Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Category
                </th>
                <th
                  className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('messages')}
                >
                  Messages {sortBy === 'messages' && (sortOrder === 'desc' ? '↓' : '↑')}
                </th>
                <th
                  className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('comments')}
                >
                  Comments {sortBy === 'comments' && (sortOrder === 'desc' ? '↓' : '↑')}
                </th>
                <th
                  className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('sessions')}
                >
                  Sessions {sortBy === 'sessions' && (sortOrder === 'desc' ? '↓' : '↑')}
                </th>
                <th
                  className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('avgResponseTime')}
                >
                  Avg Resp {sortBy === 'avgResponseTime' && (sortOrder === 'desc' ? '↓' : '↑')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sortedPages.map((page, i) => {
                const colors = categoryColors[page.category] || categoryColors.Others
                return (
                  <tr key={page.pageId || i} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{page.name}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${colors.bg} ${colors.text}`}>
                        {colors.icon} {page.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-gray-700">
                      {formatNumber(page.messages)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-gray-700">
                      {formatNumber(page.comments)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-gray-700">
                      {formatNumber(page.sessions)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-gray-700">
                      {formatDuration(page.avgResponseTime)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
            {/* Totals footer */}
            <tfoot className="bg-gray-50 font-semibold">
              <tr>
                <td className="px-4 py-3" colSpan={2}>
                  Total ({sortedPages.length} pages)
                </td>
                <td className="px-4 py-3 text-right text-gray-800">
                  {formatNumber(sortedPages.reduce((sum, p) => sum + (p.messages || 0), 0))}
                </td>
                <td className="px-4 py-3 text-right text-gray-800">
                  {formatNumber(sortedPages.reduce((sum, p) => sum + (p.comments || 0), 0))}
                </td>
                <td className="px-4 py-3 text-right text-gray-800">
                  {formatNumber(sortedPages.reduce((sum, p) => sum + (p.sessions || 0), 0))}
                </td>
                <td className="px-4 py-3 text-right text-gray-800">-</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Top Performers Chart */}
      {sortedPages.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Top 10 Pages by Messages</h3>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={sortedPages.slice(0, 10)} layout="vertical">
              <XAxis type="number" tickFormatter={(v) => formatNumber(v)} />
              <YAxis dataKey="name" type="category" width={150} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(value) => formatNumber(value)} />
              <Bar dataKey="messages" fill="#3B82F6" name="Messages" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Category Hierarchy View (when filtered) */}
      {filterCategory === 'all' && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Pages by Category</h3>
          <div className="space-y-6">
            {Object.entries(pagesByCategory).map(([category, pages]) => {
              if (pages.length === 0) return null
              const colors = categoryColors[category]
              return (
                <div key={category}>
                  <div className={`flex items-center gap-2 mb-2 p-2 ${colors.bg} rounded-lg`}>
                    <span className="text-xl">{colors.icon}</span>
                    <h4 className={`font-semibold ${colors.text}`}>{category}</h4>
                    <span className="text-gray-500 text-sm">({pages.length} pages)</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 ml-4">
                    {pages.slice(0, 6).map((page, i) => (
                      <div key={page.pageId || i} className="flex justify-between items-center p-2 bg-gray-50 rounded text-sm">
                        <span className="font-medium truncate">{page.name}</span>
                        <span className="text-gray-600">{formatNumber(page.messages)} msgs</span>
                      </div>
                    ))}
                    {pages.length > 6 && (
                      <div className="p-2 text-gray-500 text-sm">
                        +{pages.length - 6} more pages...
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
