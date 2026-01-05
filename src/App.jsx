import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Messages from './pages/Messages'
import Shifts from './pages/Shifts'
import Pages from './pages/Pages'

function Layout({ children }) {
  const navItems = [
    { path: '/', label: 'Dashboard', icon: '📊' },
    { path: '/messages', label: 'Messages', icon: '💬' },
    { path: '/shifts', label: 'Shifts', icon: '🕐' },
    { path: '/pages', label: 'Pages', icon: '📄' },
  ]

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-xl font-bold">Chat Analytics</h1>
            <div className="flex space-x-1">
              {navItems.map(item => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `px-4 py-2 rounded-lg transition ${
                      isActive
                        ? 'bg-white/20 font-semibold'
                        : 'hover:bg-white/10'
                    }`
                  }
                >
                  <span className="mr-2">{item.icon}</span>
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 py-6">
        {children}
      </main>
      <footer className="text-center text-gray-500 py-4 text-sm">
        Chat Analytics Dashboard - 26 Pages
      </footer>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/shifts" element={<Shifts />} />
          <Route path="/pages" element={<Pages />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}

export default App
