import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

function formatDuration(seconds) {
  if (!seconds) return 'N/A'
  if (seconds < 60) return `${Math.round(seconds)}s`
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`
  return `${(seconds / 3600).toFixed(1)}h`
}

export default function Pages() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState('messages')
  const [sortOrder, setSortOrder] = useState('desc')

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

  const { pageStats } = data

  // Sort pages
  const sortedPages = [...(pageStats || [])].sort((a, b) => {
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
        <p className="text-gray-600">Performance metrics for all 26 pages</p>
      </div>

      {/* Page Categories */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 rounded-lg p-4 text-center">
          <p className="text-blue-800 font-semibold">Juankada Hosts</p>
          <p className="text-3xl font-bold text-blue-600">14</p>
        </div>
        <div className="bg-pink-50 rounded-lg p-4 text-center">
          <p className="text-pink-800 font-semibold">Juana Babes</p>
          <p className="text-3xl font-bold text-pink-600">5</p>
        </div>
        <div className="bg-green-50 rounded-lg p-4 text-center">
          <p className="text-green-800 font-semibold">Juan365</p>
          <p className="text-3xl font-bold text-green-600">5</p>
        </div>
        <div className="bg-purple-50 rounded-lg p-4 text-center">
          <p className="text-purple-800 font-semibold">Others</p>
          <p className="text-3xl font-bold text-purple-600">2</p>
        </div>
      </div>

      {/* Pages Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Page Name
                </th>
                <th
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('messages')}
                >
                  Messages {sortBy === 'messages' && (sortOrder === 'desc' ? '↓' : '↑')}
                </th>
                <th
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('sessions')}
                >
                  Sessions {sortBy === 'sessions' && (sortOrder === 'desc' ? '↓' : '↑')}
                </th>
                <th
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('avgResponseTime')}
                >
                  Avg Response {sortBy === 'avgResponseTime' && (sortOrder === 'desc' ? '↓' : '↑')}
                </th>
                <th
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('avgDuration')}
                >
                  Avg Duration {sortBy === 'avgDuration' && (sortOrder === 'desc' ? '↓' : '↑')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sortedPages.map((page, i) => (
                <tr key={page.pageId || i} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{page.name}</div>
                    <div className="text-xs text-gray-500">{page.pageId}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-700">
                    {page.messages?.toLocaleString() || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-700">
                    {page.sessions?.toLocaleString() || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-700">
                    {formatDuration(page.avgResponseTime)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-700">
                    {formatDuration(page.avgDuration)}
                  </td>
                </tr>
              ))}
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
              <YAxis dataKey="name" type="category" width={150} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="messages" fill="#3B82F6" name="Messages" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
