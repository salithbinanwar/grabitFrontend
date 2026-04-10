import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'
import API from '../api'

function Home({ userRole }) {
  const [stats, setStats] = useState({
    totalPending: 0,
    totalCollected: 0,
    monthlyCollected: 0,
  })
  const [recentPending, setRecentPending] = useState([])
  const [recentCollected, setRecentCollected] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchDashboardData = async () => {
    try {
      const response = await API.get('/orders')
      const allOrders = response.data

      const pending = allOrders.filter((o) => o.status === 'pending')
      const collected = allOrders.filter((o) => o.status === 'collected')

      const now = new Date()
      const currentMonth = now.getMonth()
      const currentYear = now.getFullYear()

      const collectedThisMonth = collected.filter((o) => {
        const date = new Date(o.updatedAt)
        return (
          date.getMonth() === currentMonth && date.getFullYear() === currentYear
        )
      })

      setStats({
        totalPending: pending.length,
        totalCollected: collected.length,
        monthlyCollected: collectedThisMonth.length,
      })

      setRecentPending(pending.slice(0, 5))
      setRecentCollected(collected.slice(0, 5))
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
      toast.error('Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }

  const handleQuickCollect = async (id, orderNumber) => {
    try {
      await API.put(`/orders/${id}/collect`)
      toast.success(`Order ${orderNumber} collected! ✅`)
      fetchDashboardData()
    } catch (error) {
      toast.error('Failed to collect order')
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="text-gray-500 text-center">Loading...</div>
      </div>
    )
  }

  return (
    <div className="space-y-4 md:space-y-6 pb-20 md:pb-0">
      {/* Welcome Header - Mobile optimized */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg p-5 md:p-6 text-white">
        <h1 className="text-xl md:text-2xl font-bold">
          Hey {userRole === 'collector' ? 'Collector' : 'Inventory Manager'}! 👋
        </h1>
        <p className="text-sm md:text-base opacity-90 mt-1">
          {userRole === 'collector'
            ? `${stats.totalPending} order${stats.totalPending !== 1 ? 's' : ''} waiting`
            : `${stats.totalCollected + stats.totalPending} total order${stats.totalCollected + stats.totalPending !== 1 ? 's' : ''}`}
        </p>
      </div>

      {/* Stats Cards - Mobile grid */}
      <div className="grid grid-cols-2 gap-3 md:gap-6">
        <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-yellow-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 text-xs uppercase tracking-wide">
                Pending
              </p>
              <p className="text-2xl md:text-3xl font-bold text-gray-800">
                {stats.totalPending}
              </p>
            </div>
            {/* <div className="text-yellow-500 text-xl">⏳</div> */}
          </div>
          {stats.totalPending > 0 && userRole === 'collector' && (
            <Link
              to="/dashboard"
              className="text-xs text-blue-500 hover:text-blue-600 mt-2 inline-block"
            >
              View all →
            </Link>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-green-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 text-xs uppercase tracking-wide">
                Collected
              </p>
              <p className="text-2xl md:text-3xl font-bold text-gray-800">
                {stats.totalCollected}
              </p>
              <p className="text-xs text-gray-400 ">
                {stats.monthlyCollected} this month
              </p>
            </div>
            {/* <div className="text-green-500 text-xl">✅</div> */}
          </div>
        </div>
      </div>

      {/* Quick Action Button - Full width on mobile */}
      <div className="flex justify-end">
        {userRole === 'collector' ? (
          <Link
            to="/dashboard"
            className="bg-blue-500 text-white px-5 md:px-6 py-2.5 rounded-xl hover:bg-blue-600 transition text-sm md:text-base w-full md:w-auto text-center"
          >
            Full Dashboard →
          </Link>
        ) : (
          <Link
            to="/add-order"
            className="bg-green-500 text-white px-5 md:px-6 py-2.5 rounded-xl hover:bg-green-600 transition text-sm md:text-base w-full md:w-auto text-center"
          >
            + New Order
          </Link>
        )}
      </div>

      {/* Two Column Layout - Stacks on mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Pending Orders */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="bg-yellow-50 px-4 md:px-6 py-3 border-b">
            <h2 className="text-sm md:text-base font-semibold text-gray-800">
              Products Pending ({stats.totalPending})
            </h2>
          </div>

          {recentPending.length === 0 ? (
            <div className="p-6 md:p-8 text-center text-gray-500 text-sm">
              No pending orders 🎉
            </div>
          ) : (
            <div className="divide-y">
              {recentPending.map((order) => (
                <div
                  key={order._id}
                  className="p-3 md:p-4 hover:bg-gray-50 transition"
                >
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-sm font-medium text-gray-800 break-all">
                        {order.orderNumber}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                      {order.notes && (
                        <p className="text-xs text-gray-600 mt-1 truncate">
                          📝 {order.notes}
                        </p>
                      )}
                    </div>

                    {userRole === 'collector' && (
                      <button
                        onClick={() =>
                          handleQuickCollect(order._id, order.orderNumber)
                        }
                        className="bg-green-500 text-white px-3 py-1.5 rounded-lg text-xs hover:bg-green-600 transition shrink-0"
                      >
                        Collect
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {recentPending.length > 0 && userRole === 'collector' && (
            <div className="bg-gray-50 px-4 md:px-6 py-3 border-t text-center">
              <Link
                to="/dashboard"
                className="text-xs text-blue-500 hover:text-blue-600"
              >
                View all pending →
              </Link>
            </div>
          )}
        </div>

        {/* Recently Collected */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="bg-green-50 px-4 md:px-6 py-3 border-b">
            <h2 className="text-sm md:text-base font-semibold text-gray-800">
              Product Collected ({stats.totalCollected})
            </h2>
          </div>

          {recentCollected.length === 0 ? (
            <div className="p-6 md:p-8 text-center text-gray-500 text-sm">
              No collected orders yet
            </div>
          ) : (
            <div className="divide-y">
              {recentCollected.map((order) => (
                <div
                  key={order._id}
                  className="p-3 md:p-4 hover:bg-gray-50 transition"
                >
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-sm font-medium text-gray-800 break-all">
                        {order.orderNumber}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(order.updatedAt).toLocaleDateString()}
                      </p>
                      {order.trackingNumber && (
                        <p className="text-xs text-gray-600 mt-1 truncate">
                          Note: {order.trackingNumber}
                        </p>
                      )}
                    </div>

                    {userRole === 'sender' && order.trackingNumber && (
                      <span className="bg-blue-100 text-blue-600 text-xs px-2 py-1 rounded-lg shrink-0">
                        Shipped
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {recentCollected.length > 0 && (
            <div className="bg-gray-50 px-4 md:px-6 py-3 border-t text-center">
              <Link
                to="/history"
                className="text-xs text-blue-500 hover:text-blue-600"
              >
                Full history →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Home
