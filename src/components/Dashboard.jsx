import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import API from '../api'

function Dashboard({ userRole }) {
  const [groupedOrders, setGroupedOrders] = useState({})
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedMonth, setSelectedMonth] = useState('')
  const [availableMonths, setAvailableMonths] = useState([])

  const fetchOrders = async () => {
    try {
      const response = await API.get('/orders/grouped-by-month')
      const groups = response.data

      const months = Object.keys(groups).sort().reverse()
      setAvailableMonths(months)

      if (months.length > 0 && !selectedMonth) {
        setSelectedMonth(months[0])
      }

      setGroupedOrders(groups)
    } catch (error) {
      toast.error('Failed to load orders')
    } finally {
      setLoading(false)
    }
  }

  const handleCollect = async (id, orderNumber) => {
    try {
      await API.put(`/orders/${id}/collect`)
      toast.success(`Order ${orderNumber} collected! ✅`)
      fetchOrders()
    } catch (error) {
      toast.error('Failed to mark as collected')
    }
  }

  const copyOrderNumber = (orderNumber) => {
    navigator.clipboard.writeText(orderNumber)
    toast.success(`Copied: ${orderNumber}`)
  }

  const exportToCSV = () => {
    const currentGroup = groupedOrders[selectedMonth]
    if (!currentGroup) return

    const orders = currentGroup.orders.filter(
      (order) => order.status === 'pending',
    )
    if (orders.length === 0) {
      toast.error('No pending orders to export')
      return
    }

    const headers = [
      'Order Number',
      'Status',
      'Tracking Number',
      'Notes',
      'Created At',
    ]
    const csvData = orders.map((order) => [
      order.orderNumber,
      order.status,
      order.trackingNumber || '',
      order.notes || '',
      new Date(order.createdAt).toLocaleDateString(),
    ])

    const csvContent = [headers, ...csvData]
      .map((row) => row.join(','))
      .join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `pending_orders_${selectedMonth}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('CSV exported!')
  }

  useEffect(() => {
    fetchOrders()
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500 text-lg">Loading orders...</div>
      </div>
    )
  }

  const currentGroup = groupedOrders[selectedMonth]
  const pendingOrders =
    currentGroup?.orders.filter((order) => order.status === 'pending') || []
  const totalPending = Object.values(groupedOrders).reduce((total, group) => {
    return total + group.orders.filter((o) => o.status === 'pending').length
  }, 0)

  return (
    <div>
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            Collection Dashboard
          </h1>
          <p className="text-gray-500 mt-1">
            Total pending:{' '}
            <span className="font-bold text-blue-600">{totalPending}</span>{' '}
            orders
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={exportToCSV}
            className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition"
          >
            📥 Export CSV
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex flex-wrap gap-2">
          {availableMonths.map((monthKey) => {
            const group = groupedOrders[monthKey]
            const pendingCount = group.orders.filter(
              (o) => o.status === 'pending',
            ).length
            const isActive = selectedMonth === monthKey

            return (
              <button
                key={monthKey}
                onClick={() => setSelectedMonth(monthKey)}
                className={`px-4 py-2 rounded-lg transition ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {group.month} {group.year}
                {pendingCount > 0 && (
                  <span
                    className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                      isActive ? 'bg-blue-400' : 'bg-red-400 text-white'
                    }`}
                  >
                    {pendingCount}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      <div className="mb-6">
        <input
          type="text"
          placeholder="🔍 Search by order number..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {currentGroup && (
        <div>
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">
            {currentGroup.month} {currentGroup.year}
          </h2>

          {pendingOrders.filter((order) =>
            order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()),
          ).length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <p className="text-gray-500 text-lg">
                No pending orders for {currentGroup.month} 🎉
              </p>
              <p className="text-gray-400 mt-2">All caught up!</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {pendingOrders
                .filter((order) =>
                  order.orderNumber
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase()),
                )
                .map((order) => (
                  <div
                    key={order._id}
                    className="bg-white rounded-lg shadow-md p-5 hover:shadow-lg transition"
                  >
                    <div className="flex justify-between items-start flex-wrap gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <p className="text-lg font-semibold text-gray-800">
                            Order #{order.orderNumber}
                          </p>
                          <button
                            onClick={() => copyOrderNumber(order.orderNumber)}
                            className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-2 py-1 rounded text-xs transition"
                            title="Copy order number"
                          >
                            📋 Copy
                          </button>
                        </div>

                        <p className="text-sm text-gray-500 mt-1">
                          Added:{' '}
                          {new Date(order.createdAt).toLocaleDateString()}
                        </p>

                        {/* Tracking Number - Display only */}
                        <div className="mt-3">
                          <label className="text-xs text-gray-500 block">
                            ZTO Tracking Number
                          </label>
                          <p className="text-gray-700 bg-gray-50 p-2 rounded border">
                            {order.trackingNumber || 'Not provided'}
                          </p>
                        </div>

                        {/* Notes - Display only */}
                        <div className="mt-2">
                          <label className="text-xs text-gray-500 block">
                            Notes
                          </label>
                          <p className="text-gray-700 bg-gray-50 p-2 rounded border">
                            {order.notes || 'No notes'}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() =>
                          handleCollect(order._id, order.orderNumber)
                        }
                        className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition font-medium"
                      >
                        Collected ✅
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default Dashboard
