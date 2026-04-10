import { useCallback, useEffect, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import API from './api'
import AddOrderForm from './components/AddOrderForm'
import Dashboard from './components/Dashboard'
import Home from './components/Home'
import Login from './components/Login'
import Navbar from './components/Navbar'
import OrderHistory from './components/OrderHistory'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userRole, setUserRole] = useState(null)
  const [loading, setLoading] = useState(true)

  const handleLogin = useCallback((role) => {
    setIsAuthenticated(true)
    setUserRole(role)
  }, [])

  const handleLogout = useCallback(async () => {
    try {
      await API.post('/auth/logout')
    } catch (error) {
      console.error('Logout error:', error)
    }
    setIsAuthenticated(false)
    setUserRole(null)
  }, [])

  // Check if already logged in on app load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await API.get('/auth/me')
        if (response.data && response.data.role) {
          setIsAuthenticated(true)
          setUserRole(response.data.role)
        }
      } catch (error) {
        console.log('Not authenticated')
      } finally {
        setLoading(false)
      }
    }
    checkAuth()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-500 text-lg">Loading...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar
        userRole={userRole}
        onLogout={handleLogout}
      />
      <div className="container mx-auto px-4 py-8">
        <Routes>
          {/* Home Page - Shows summary for both roles */}
          <Route
            path="/"
            element={<Home userRole={userRole} />}
          />

          {/* Collector Full Dashboard */}
          <Route
            path="/dashboard"
            element={
              userRole === 'collector' ? (
                <Dashboard userRole={userRole} />
              ) : (
                <Navigate to="/" />
              )
            }
          />

          {/* Sender Add Order Page */}
          <Route
            path="/add-order"
            element={
              userRole === 'sender' ? <AddOrderForm /> : <Navigate to="/" />
            }
          />

          {/* History Page - Both can see */}
          <Route
            path="/history"
            element={<OrderHistory userRole={userRole} />}
          />
        </Routes>
      </div>
    </div>
  )
}

export default App
