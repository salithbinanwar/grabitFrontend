import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import API from '../api'

function Login({ onLogin }) {
  const [mode, setMode] = useState('select') // 'select', 'login', 'signup'
  const [selectedRole, setSelectedRole] = useState(null) // 'sender' or 'collector'
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [existingUsers, setExistingUsers] = useState({
    sender: false,
    collector: false,
  })
  const [checking, setChecking] = useState(true)

  // Check which roles already have accounts
  useEffect(() => {
    const checkExistingUsers = async () => {
      try {
        const response = await API.get('/auth/setup-needed')
        // If setup is needed, no users exist
        if (response.data.setupNeeded) {
          setExistingUsers({ sender: false, collector: false })
        } else {
          // Check each role individually
          try {
            const senderCheck = await API.post('/auth/check-role', {
              role: 'sender',
            })
            const collectorCheck = await API.post('/auth/check-role', {
              role: 'collector',
            })
            setExistingUsers({
              sender: senderCheck.data.exists,
              collector: collectorCheck.data.exists,
            })
          } catch (error) {
            // If error, assume users exist
            setExistingUsers({ sender: true, collector: true })
          }
        }
      } catch (error) {
        console.error('Failed to check existing users:', error)
      } finally {
        setChecking(false)
      }
    }
    checkExistingUsers()
  }, [])

  const handleRoleSelect = (role) => {
    setSelectedRole(role)
    if (existingUsers[role]) {
      setMode('login')
    } else {
      setMode('signup')
    }
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    if (!password.trim()) {
      toast.error('Please enter password')
      return
    }

    setLoading(true)
    try {
      const response = await API.post('/auth/login', {
        role: selectedRole,
        password,
      })
      if (response.data) {
        onLogin(selectedRole)
        toast.success(
          `Welcome ${selectedRole === 'collector' ? 'Collector' : 'Sender'}!`,
        )
      }
    } catch (error) {
      toast.error('Invalid password')
      setPassword('')
    } finally {
      setLoading(false)
    }
  }

  const handleSignup = async (e) => {
    e.preventDefault()
    if (!password.trim()) {
      toast.error('Please enter password')
      return
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    if (password.length < 4) {
      toast.error('Password must be at least 4 characters')
      return
    }

    setLoading(true)
    try {
      if (selectedRole === 'sender') {
        await API.post('/auth/setup', {
          senderPassword: password,
          collectorPassword: existingUsers.collector ? 'temp' : 'temp',
        })
      } else {
        await API.post('/auth/setup', {
          senderPassword: existingUsers.sender ? 'temp' : 'temp',
          collectorPassword: password,
        })
      }

      toast.success(
        `${selectedRole === 'collector' ? 'Collector' : 'Sender'} account created!`,
      )

      // Auto login after signup
      const loginResponse = await API.post('/auth/login', {
        role: selectedRole,
        password,
      })
      if (loginResponse.data) {
        onLogin(selectedRole)
      }
    } catch (error) {
      toast.error('Failed to create account')
    } finally {
      setLoading(false)
    }
  }

  const goBack = () => {
    setMode('select')
    setSelectedRole(null)
    setPassword('')
    setConfirmPassword('')
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-xl p-8 text-center">
          <div className="text-2xl mb-2">📦</div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Role Selection Screen
  if (mode === 'select') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
        <div className="max-w-4xl w-full">
          <div className="text-center mb-8">
            <div className="text-6xl mb-3">📦</div>
            <h1 className="text-3xl md:text-4xl font-bold text-white">Pickd</h1>
            <p className="text-white/80 mt-2">Choose your role to continue</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Sender Card */}
            <div className="bg-white rounded-2xl shadow-xl p-6 text-center hover:shadow-2xl transition">
              <div className="text-5xl mb-4">📤</div>
              <h2 className="text-2xl font-bold text-gray-800">Sender</h2>
              <p className="text-gray-500 text-sm mt-2">
                Add orders, manage inventory, export data
              </p>
              <div className="mt-4 text-xs text-gray-400">
                {existingUsers.sender ? '✓ Account exists' : '✗ No account yet'}
              </div>
              <button
                onClick={() => handleRoleSelect('sender')}
                className="mt-4 w-full bg-blue-500 text-white py-2 rounded-xl hover:bg-blue-600 transition font-medium"
              >
                {existingUsers.sender ? 'Login →' : 'Create Account →'}
              </button>
            </div>

            {/* Collector Card */}
            <div className="bg-white rounded-2xl shadow-xl p-6 text-center hover:shadow-2xl transition">
              <div className="text-5xl mb-4">📦</div>
              <h2 className="text-2xl font-bold text-gray-800">Collector</h2>
              <p className="text-gray-500 text-sm mt-2">
                Collect orders, update tracking, view history
              </p>
              <div className="mt-4 text-xs text-gray-400">
                {existingUsers.collector
                  ? '✓ Account exists'
                  : '✗ No account yet'}
              </div>
              <button
                onClick={() => handleRoleSelect('collector')}
                className="mt-4 w-full bg-green-500 text-white py-2 rounded-xl hover:bg-green-600 transition font-medium"
              >
                {existingUsers.collector ? 'Login →' : 'Create Account →'}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Login/Signup Screen
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 max-w-md w-full">
        <button
          onClick={goBack}
          className="text-gray-400 hover:text-gray-600 mb-4 text-sm flex items-center gap-1"
        >
          ← Back
        </button>

        <div className="text-center mb-6">
          <div className="text-4xl mb-2">
            {selectedRole === 'sender' ? '📤' : '📦'}
          </div>
          <h2 className="text-2xl font-bold text-gray-800">
            {selectedRole === 'sender' ? 'Sender' : 'Collector'}
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            {mode === 'login' ? 'Enter your password' : 'Create your account'}
          </p>
        </div>

        <form onSubmit={mode === 'login' ? handleLogin : handleSignup}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
              disabled={loading}
            />
          </div>

          {mode === 'signup' && (
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              />
              <p className="text-xs text-gray-400 mt-1">Minimum 4 characters</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-500 text-white py-3 rounded-xl hover:bg-blue-600 transition font-medium disabled:opacity-50"
          >
            {loading
              ? 'Please wait...'
              : mode === 'login'
                ? 'Login →'
                : 'Create Account →'}
          </button>
        </form>

        {mode === 'login' && (
          <div className="text-center mt-4">
            <button
              onClick={() => setMode('signup')}
              className="text-sm text-blue-500 hover:text-blue-600"
            >
              Don't have an account? Create one →
            </button>
          </div>
        )}

        {mode === 'signup' && (
          <div className="text-center mt-4">
            <button
              onClick={() => setMode('login')}
              className="text-sm text-blue-500 hover:text-blue-600"
            >
              Already have an account? Login →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default Login
