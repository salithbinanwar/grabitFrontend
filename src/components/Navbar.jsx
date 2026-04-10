import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

function Navbar({ userRole, onLogout }) {
  const location = useLocation()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen)
  const closeMenu = () => setIsMenuOpen(false)

  return (
    <nav className="bg-blue-600 shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-14 md:h-16">
          {/* Logo */}
          <Link
            to="/"
            className="text-white text-lg md:text-2xl font-bold"
            onClick={closeMenu}
          >
            Pickd
            <span className="text-xs ml-2 bg-blue-500 px-2 py-0.5 rounded">
              {userRole === 'collector' ? 'CL' : 'SR'}
            </span>
          </Link>

          {/* Desktop Menu - Hidden on mobile */}
          <div className="hidden md:flex space-x-4">
            <NavLink
              to="/"
              current={location.pathname === '/'}
              onClick={closeMenu}
            >
              Home
            </NavLink>

            {userRole === 'collector' && (
              <NavLink
                to="/dashboard"
                current={location.pathname === '/dashboard'}
                onClick={closeMenu}
              >
                Dashboard
              </NavLink>
            )}

            {userRole === 'sender' && (
              <NavLink
                to="/add-order"
                current={location.pathname === '/add-order'}
                onClick={closeMenu}
              >
                Add Order
              </NavLink>
            )}

            <NavLink
              to="/history"
              current={location.pathname === '/history'}
              onClick={closeMenu}
            >
              History
            </NavLink>

            <button
              onClick={() => {
                onLogout()
                closeMenu()
              }}
              className="px-4 py-2 rounded-lg transition bg-red-500 text-white hover:bg-red-600"
            >
              Logout
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={toggleMenu}
            className="md:hidden text-white focus:outline-none p-2"
            aria-label="Menu"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-3 border-t border-blue-500 space-y-2">
            <MobileNavLink
              to="/"
              current={location.pathname === '/'}
              onClick={closeMenu}
            >
              Home 🏠
            </MobileNavLink>

            {userRole === 'collector' && (
              <MobileNavLink
                to="/dashboard"
                current={location.pathname === '/dashboard'}
                onClick={closeMenu}
              >
                Dashboard 📊
              </MobileNavLink>
            )}

            {userRole === 'sender' && (
              <MobileNavLink
                to="/add-order"
                current={location.pathname === '/add-order'}
                onClick={closeMenu}
              >
                Add Order ➕
              </MobileNavLink>
            )}

            <MobileNavLink
              to="/history"
              current={location.pathname === '/history'}
              onClick={closeMenu}
            >
              History 📜
            </MobileNavLink>

            <button
              onClick={() => {
                onLogout()
                closeMenu()
              }}
              className="w-full text-left px-4 py-3 rounded-lg transition bg-red-500 text-white hover:bg-red-600"
            >
              Logout 🚪
            </button>
          </div>
        )}
      </div>
    </nav>
  )
}

// Desktop nav link component
function NavLink({ to, children, current, onClick }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`px-4 py-2 rounded-lg transition ${
        current ? 'bg-blue-700 text-white' : 'text-blue-100 hover:bg-blue-500'
      }`}
    >
      {children}
    </Link>
  )
}

// Mobile nav link component
function MobileNavLink({ to, children, current, onClick }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`block px-4 py-3 rounded-lg transition ${
        current ? 'bg-blue-700 text-white' : 'text-blue-100 hover:bg-blue-500'
      }`}
    >
      {children}
    </Link>
  )
}

export default Navbar
