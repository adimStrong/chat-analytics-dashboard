import { useState, useEffect, useMemo } from 'react'

function formatNumber(value) {
  if (value === null || value === undefined) return '0'
  return Number(value).toLocaleString('en-US')
}

function formatTimeAgo(dateString) {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString('en-PH')
}

function formatDate(dateString) {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const WATCHLIST_KEY = 'chat_analytics_watchlist'

export default function Users() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('leaderboard')
  const [searchQuery, setSearchQuery] = useState('')
  const [watchlist, setWatchlist] = useState([])
  const [selectedUser, setSelectedUser] = useState(null)

  useEffect(() => {
    // Load watchlist from localStorage
    const saved = localStorage.getItem(WATCHLIST_KEY)
    if (saved) {
      try {
        setWatchlist(JSON.parse(saved))
      } catch (e) {
        console.error('Error loading watchlist:', e)
      }
    }

    // Fetch data
    fetch('/data/analytics.json')
      .then(res => res.json())
      .then(d => setData(d))
      .catch(err => console.error('Error loading data:', err))
      .finally(() => setLoading(false))
  }, [])

  // Save watchlist to localStorage
  useEffect(() => {
    localStorage.setItem(WATCHLIST_KEY, JSON.stringify(watchlist))
  }, [watchlist])

  const isWatched = (userId) => watchlist.some(u => u.userId === userId)

  const toggleWatchlist = (user) => {
    if (isWatched(user.userId)) {
      setWatchlist(prev => prev.filter(u => u.userId !== user.userId))
    } else {
      setWatchlist(prev => [...prev, {
        userId: user.userId,
        name: user.name,
        addedAt: new Date().toISOString()
      }])
    }
  }

  // Search results
  const searchResults = useMemo(() => {
    if (!data?.allCommenters || !searchQuery.trim()) return []
    const query = searchQuery.toLowerCase()
    return data.allCommenters
      .filter(u => u.name.toLowerCase().includes(query))
      .slice(0, 50)
  }, [data?.allCommenters, searchQuery])

  // Watched users with their data
  const watchedUsers = useMemo(() => {
    if (!data?.allCommenters) return []
    return watchlist.map(w => {
      const userData = data.allCommenters.find(u => u.userId === w.userId)
      return userData ? { ...userData, addedAt: w.addedAt } : null
    }).filter(Boolean)
  }, [data?.allCommenters, watchlist])

  // Get user comments
  const getUserComments = (userId) => {
    if (!data?.userComments) return []
    return data.userComments[userId] || []
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!data || !data.topCommenters) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-800">
        No user data available. Run the export script first.
      </div>
    )
  }

  const tabs = [
    { id: 'leaderboard', label: 'Leaderboard', icon: '🏆', count: data.topCommenters?.length || 0 },
    { id: 'search', label: 'Search', icon: '🔍', count: searchResults.length },
    { id: 'watchlist', label: 'Watchlist', icon: '👁️', count: watchlist.length },
  ]

  const renderUserRow = (user, index, showRank = false) => (
    <tr
      key={user.userId}
      className="hover:bg-gray-50 cursor-pointer transition"
      onClick={() => setSelectedUser(user)}
    >
      {showRank && (
        <td className="px-4 py-3 text-center">
          {index < 3 ? (
            <span className="text-2xl">{['🥇', '🥈', '🥉'][index]}</span>
          ) : (
            <span className="text-gray-500 font-medium">{index + 1}</span>
          )}
        </td>
      )}
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-gray-800">{user.name}</p>
            <p className="text-xs text-gray-400">ID: {user.userId.slice(-8)}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-center">
        <span className="font-bold text-blue-600">{formatNumber(user.commentCount)}</span>
      </td>
      <td className="px-4 py-3 text-center">
        <span className="text-gray-600">{user.pagesCommented}</span>
      </td>
      <td className="px-4 py-3 text-center hidden md:table-cell">
        <span className="text-gray-500 text-sm">{formatDate(user.firstComment)}</span>
      </td>
      <td className="px-4 py-3 text-center">
        <span className="text-green-600 text-sm font-medium">{formatTimeAgo(user.lastComment)}</span>
      </td>
      <td className="px-4 py-3 text-center">
        <button
          onClick={(e) => {
            e.stopPropagation()
            toggleWatchlist(user)
          }}
          className={`p-2 rounded-lg transition ${
            isWatched(user.userId)
              ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
          }`}
          title={isWatched(user.userId) ? 'Remove from watchlist' : 'Add to watchlist'}
        >
          {isWatched(user.userId) ? '⭐' : '☆'}
        </button>
      </td>
    </tr>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">User Tracking</h2>
          <p className="text-gray-600">Monitor commenters across all pages</p>
        </div>
        <div className="text-right text-sm text-gray-500">
          <p>Total Commenters: {formatNumber(data.allCommenters?.length || 0)}</p>
          <p>Watching: {watchlist.length}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-3 font-medium transition border-b-2 ${
              activeTab === tab.id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.label}
            <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
              activeTab === tab.id ? 'bg-blue-100' : 'bg-gray-100'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Leaderboard Tab */}
        {activeTab === 'leaderboard' && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800 text-white">
                <tr>
                  <th className="px-4 py-3 text-center w-16">Rank</th>
                  <th className="px-4 py-3 text-left">User</th>
                  <th className="px-4 py-3 text-center">Comments</th>
                  <th className="px-4 py-3 text-center">Pages</th>
                  <th className="px-4 py-3 text-center hidden md:table-cell">First Seen</th>
                  <th className="px-4 py-3 text-center">Last Active</th>
                  <th className="px-4 py-3 text-center w-16">Watch</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data.topCommenters.map((user, index) => renderUserRow(user, index, true))}
              </tbody>
            </table>
          </div>
        )}

        {/* Search Tab */}
        {activeTab === 'search' && (
          <div>
            <div className="p-4 border-b border-gray-200">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by user name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-3 pl-10 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <span className="absolute left-3 top-3.5 text-gray-400">🔍</span>
              </div>
            </div>
            {searchQuery.trim() ? (
              searchResults.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-3 text-left">User</th>
                        <th className="px-4 py-3 text-center">Comments</th>
                        <th className="px-4 py-3 text-center">Pages</th>
                        <th className="px-4 py-3 text-center hidden md:table-cell">First Seen</th>
                        <th className="px-4 py-3 text-center">Last Active</th>
                        <th className="px-4 py-3 text-center w-16">Watch</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {searchResults.map((user, index) => renderUserRow(user, index, false))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-8 text-center text-gray-500">
                  No users found matching "{searchQuery}"
                </div>
              )
            ) : (
              <div className="p-8 text-center text-gray-400">
                <p className="text-4xl mb-4">🔍</p>
                <p>Enter a name to search for users</p>
              </div>
            )}
          </div>
        )}

        {/* Watchlist Tab */}
        {activeTab === 'watchlist' && (
          <div>
            {watchedUsers.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-yellow-50">
                    <tr>
                      <th className="px-4 py-3 text-left">User</th>
                      <th className="px-4 py-3 text-center">Comments</th>
                      <th className="px-4 py-3 text-center">Pages</th>
                      <th className="px-4 py-3 text-center hidden md:table-cell">First Seen</th>
                      <th className="px-4 py-3 text-center">Last Active</th>
                      <th className="px-4 py-3 text-center w-16">Watch</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {watchedUsers.map((user, index) => renderUserRow(user, index, false))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-gray-400">
                <p className="text-4xl mb-4">👁️</p>
                <p>No users in watchlist</p>
                <p className="text-sm mt-2">Click the ☆ icon to add users</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* User Detail Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-3xl font-bold">
                    {selectedUser.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{selectedUser.name}</h3>
                    <p className="text-blue-200 text-sm">ID: {selectedUser.userId}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="text-white/80 hover:text-white text-2xl"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-4 gap-4 p-4 bg-gray-50 border-b">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{formatNumber(selectedUser.commentCount)}</p>
                <p className="text-xs text-gray-500">Comments</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{selectedUser.pagesCommented}</p>
                <p className="text-xs text-gray-500">Pages</p>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-700">{formatDate(selectedUser.firstComment)}</p>
                <p className="text-xs text-gray-500">First Seen</p>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-700">{formatTimeAgo(selectedUser.lastComment)}</p>
                <p className="text-xs text-gray-500">Last Active</p>
              </div>
            </div>

            {/* Actions */}
            <div className="p-4 border-b flex gap-2">
              <button
                onClick={() => toggleWatchlist(selectedUser)}
                className={`flex-1 py-2 rounded-lg font-medium transition ${
                  isWatched(selectedUser.userId)
                    ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {isWatched(selectedUser.userId) ? '⭐ Remove from Watchlist' : '☆ Add to Watchlist'}
              </button>
            </div>

            {/* Comment History */}
            <div className="p-4">
              <h4 className="font-semibold text-gray-700 mb-3">Recent Comments</h4>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {getUserComments(selectedUser.userId).length > 0 ? (
                  getUserComments(selectedUser.userId).slice(0, 20).map((comment, i) => (
                    <div key={i} className="bg-gray-50 rounded-lg p-3">
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-xs font-medium text-blue-600">{comment.pageName}</span>
                        <span className="text-xs text-gray-400">{formatDate(comment.time)}</span>
                      </div>
                      <p className="text-sm text-gray-700">{comment.text}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-400 text-center py-4">
                    Comment history not available in current export
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer Hint */}
      <div className="text-center text-gray-400 text-sm">
        Click on a user row to view their full activity history
      </div>
    </div>
  )
}
