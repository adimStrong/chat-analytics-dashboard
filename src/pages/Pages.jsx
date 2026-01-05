import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'

function formatDuration(seconds) {
  if (!seconds) return 'N/A'
  if (seconds < 60) return `${Math.round(seconds)}s`
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`
  return `${(seconds / 3600).toFixed(1)}h`
}

const categoryColors = {
  "Juankada Hosts": { bg: "bg-blue-100", text: "text-blue-800", border: "border-blue-200" },
  "Juana Babe": { bg: "bg-pink-100", text: "text-pink-800", border: "border-pink-200" },
  "Juan365": { bg: "bg-green-100", text: "text-green-800", border: "border-green-200" },
  "Others": { bg: "bg-purple-100", text: "text-purple-800", border: "border-purple-200" },
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
          return (
            <div
              key={cat.category}
              className={`${colors.bg} ${colors.border} border rounded-xl p-4 cursor-pointer transition hover:shadow-md ${
                filterCategory === cat.category ? 'ring-2 ring-offset-2 ring-blue-500' : ''
              }`}
              onClick={() => setFilterCategory(filterCategory === cat.category ? 'all' : cat.category)}
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className={`font-semibold ${colors.text}`}>{cat.category}</p>
                  <p className="text-gray-600 text-sm">{cat.pageCount} pages</p>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-gray-500">Messages</p>
                  <p className={`font-bold ${colors.text}`}>{cat.messages?.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-500">Comments</p>
                  <p className={`font-bold ${colors.text}`}>{cat.comments?.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-500">Sessions</p>
                  <p className={`font-bold ${colors.text}`}>{cat.sessions?.toLocaleString()}</p>
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
              <YAxis />
              <Tooltip />
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
            {filterCategory}
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
                        {page.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-gray-700">
                      {page.messages?.toLocaleString() || 0}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-gray-700">
                      {page.comments?.toLocaleString() || 0}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-gray-700">
                      {page.sessions?.toLocaleString() || 0}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-gray-700">
                      {formatDuration(page.avgResponseTime)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Performers Chart */}
      {sortedPages.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Top 10 Pages by Messages</h3>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={sortedPages.slice(0, 10)} layout="vertical">
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={150} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="messages" fill="#3B82F6" name="Messages" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
