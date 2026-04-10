import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import API from '../api'

function AddOrderForm() {
  const [orderNumber, setOrderNumber] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [bulkMode, setBulkMode] = useState(false)
  const [bulkOrders, setBulkOrders] = useState('')
  const [showDeleteSection, setShowDeleteSection] = useState(false)
  const [orders, setOrders] = useState([])
  const [selectedOrders, setSelectedOrders] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [showExportSection, setShowExportSection] = useState(false)
  const navigate = useNavigate()

  // Fetch orders for delete section
  const fetchOrders = async () => {
    try {
      const response = await API.get('/orders')
      setOrders(response.data)
    } catch (error) {
      toast.error('Failed to load orders')
    }
  }

  useEffect(() => {
    if (showDeleteSection || showExportSection) {
      fetchOrders()
    }
  }, [showDeleteSection, showExportSection])

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!orderNumber.trim()) {
      toast.error('Please enter an order number')
      return
    }

    setLoading(true)
    try {
      await API.post('/orders', {
        orderNumber: orderNumber.trim(),
        notes: notes.trim(),
      })
      toast.success('Order added successfully!')
      setOrderNumber('')
      setNotes('')
      if (showDeleteSection || showExportSection) fetchOrders()
    } catch (error) {
      if (error.response?.status === 409) {
        toast.error('Order number already exists')
      } else {
        toast.error('Failed to add order')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleBulkSubmit = async (e) => {
    e.preventDefault()

    const lines = bulkOrders.trim().split('\n')
    const ordersList = lines
      .map((line) => {
        const parts = line.split(',').map((p) => p.trim())
        return {
          orderNumber: parts[0],
          notes: parts[1] || '',
        }
      })
      .filter((o) => o.orderNumber)

    if (ordersList.length === 0) {
      toast.error('No valid orders found')
      return
    }

    setLoading(true)
    try {
      const response = await API.post('/orders/bulk', { orders: ordersList })
      toast.success(`${response.data.totalCreated} orders added successfully`)
      if (response.data.errors.length > 0) {
        toast.error(`${response.data.errors.length} orders failed`)
      }
      setBulkOrders('')
      if (showDeleteSection || showExportSection) fetchOrders()
    } catch (error) {
      toast.error('Failed to add orders')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectOrder = (orderId) => {
    setSelectedOrders((prev) =>
      prev.includes(orderId)
        ? prev.filter((id) => id !== orderId)
        : [...prev, orderId],
    )
  }

  const handleSelectAll = () => {
    if (selectedOrders.length === filteredOrders.length) {
      setSelectedOrders([])
    } else {
      setSelectedOrders(filteredOrders.map((o) => o._id))
    }
  }

  const handleDeleteSelected = async () => {
    if (selectedOrders.length === 0) {
      toast.error('No orders selected')
      return
    }

    const confirmed = window.confirm(
      `Delete ${selectedOrders.length} order(s)? This cannot be undone.`,
    )
    if (!confirmed) return

    setDeleting(true)
    let deleted = 0
    let failed = 0

    for (const orderId of selectedOrders) {
      try {
        await API.delete(`/orders/${orderId}`)
        deleted++
      } catch (error) {
        failed++
      }
    }

    if (deleted > 0) {
      toast.success(`${deleted} order(s) deleted successfully`)
    }
    if (failed > 0) {
      toast.error(`${failed} order(s) failed to delete`)
    }

    setSelectedOrders([])
    await fetchOrders()
    setDeleting(false)
  }

  // CSV Export Functions
  const exportToCSV = (ordersToExport, filename) => {
    if (ordersToExport.length === 0) {
      toast.error('No orders to export')
      return
    }

    const headers = [
      'Order Number',
      'Status',
      'Notes',
      'Created At',
      'Collected At',
    ]
    const csvData = ordersToExport.map((order) => [
      order.orderNumber,
      order.status,
      order.notes || '',
      new Date(order.createdAt).toLocaleString(),
      order.updatedAt ? new Date(order.updatedAt).toLocaleString() : '',
    ])

    const csvContent = [headers, ...csvData]
      .map((row) => row.join(','))
      .join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${filename}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success(`Exported ${ordersToExport.length} orders`)
  }

  const exportAllOrders = () => {
    exportToCSV(orders, `all_orders_${new Date().toISOString().split('T')[0]}`)
  }

  const exportPendingOrders = () => {
    const pending = orders.filter((o) => o.status === 'pending')
    exportToCSV(
      pending,
      `pending_orders_${new Date().toISOString().split('T')[0]}`,
    )
  }

  const exportCollectedOrders = () => {
    const collected = orders.filter((o) => o.status === 'collected')
    exportToCSV(
      collected,
      `collected_orders_${new Date().toISOString().split('T')[0]}`,
    )
  }

  const exportSelectedOrders = () => {
    const selected = orders.filter((o) => selectedOrders.includes(o._id))
    if (selected.length === 0) {
      toast.error('No orders selected')
      return
    }
    exportToCSV(
      selected,
      `selected_orders_${new Date().toISOString().split('T')[0]}`,
    )
  }

  const filteredOrders = orders.filter((order) =>
    order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const pendingOrders = filteredOrders.filter((o) => o.status === 'pending')
  const collectedOrders = filteredOrders.filter((o) => o.status === 'collected')
  const totalSelected = orders.filter((o) =>
    selectedOrders.includes(o._id),
  ).length

  // Export Section View
  if (showExportSection) {
    return (
      <div className="max-w-4xl mx-auto px-4 md:px-0">
        <div className="bg-white rounded-xl shadow-md p-5 md:p-6">
          <div className="flex justify-between items-center mb-5">
            <h1 className="text-xl md:text-2xl font-bold text-gray-800">
              📥 Export Orders
            </h1>
            <button
              onClick={() => setShowExportSection(false)}
              className="text-gray-500 hover:text-gray-700 text-sm"
            >
              ✕ Close
            </button>
          </div>

          {/* Export Options */}
          <div className="space-y-3 mb-6">
            <button
              onClick={exportAllOrders}
              className="w-full bg-blue-500 text-white py-3 rounded-xl hover:bg-blue-600 transition font-medium"
            >
              📋 Export All Orders ({orders.length})
            </button>

            <button
              onClick={exportPendingOrders}
              className="w-full bg-yellow-500 text-white py-3 rounded-xl hover:bg-yellow-600 transition font-medium"
            >
              ⏳ Export Pending Orders (
              {orders.filter((o) => o.status === 'pending').length})
            </button>

            <button
              onClick={exportCollectedOrders}
              className="w-full bg-green-500 text-white py-3 rounded-xl hover:bg-green-600 transition font-medium"
            >
              ✅ Export Collected Orders (
              {orders.filter((o) => o.status === 'collected').length})
            </button>
          </div>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">OR</span>
            </div>
          </div>

          {/* Select and Export */}
          <div className="mb-4">
            <h2 className="font-semibold text-gray-700 mb-3">
              Select Specific Orders
            </h2>

            {/* Search */}
            <input
              type="text"
              placeholder="🔍 Search order number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
            />

            {/* Select All */}
            <div className="flex justify-between items-center mb-3 text-sm">
              <span className="text-gray-500">
                {filteredOrders.length} order(s) found
              </span>
              <button
                onClick={handleSelectAll}
                className="text-blue-500 hover:text-blue-600"
              >
                {selectedOrders.length === filteredOrders.length
                  ? 'Deselect All'
                  : 'Select All'}
              </button>
            </div>

            {/* Orders List */}
            <div className="max-h-80 overflow-y-auto border border-gray-200 rounded-lg divide-y">
              {filteredOrders.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  No orders found
                </div>
              ) : (
                filteredOrders.map((order) => (
                  <label
                    key={order._id}
                    className={`flex items-center gap-3 p-3 cursor-pointer transition ${
                      order.status === 'pending'
                        ? 'hover:bg-yellow-50'
                        : 'hover:bg-green-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedOrders.includes(order._id)}
                      onChange={() => handleSelectOrder(order._id)}
                      className="w-4 h-4 text-blue-500 rounded focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <p className="font-mono text-sm font-medium text-gray-800">
                        {order.orderNumber}
                      </p>
                      {order.notes && (
                        <p className="text-xs text-gray-500">{order.notes}</p>
                      )}
                    </div>
                    <span
                      className={`text-xs px-2 py-0.5 rounded ${
                        order.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-green-100 text-green-700'
                      }`}
                    >
                      {order.status}
                    </span>
                  </label>
                ))
              )}
            </div>

            {/* Export Selected Button */}
            {totalSelected > 0 && (
              <button
                onClick={exportSelectedOrders}
                className="w-full bg-purple-500 text-white py-3 rounded-xl hover:bg-purple-600 transition font-medium mt-4"
              >
                📥 Export Selected ({totalSelected}) Orders
              </button>
            )}
          </div>

          <button
            onClick={() => setShowExportSection(false)}
            className="w-full mt-3 text-gray-500 py-3 rounded-xl hover:text-gray-700 transition text-sm"
          >
            ← Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-0">
      {/* Three Tabs */}
      <div className="flex gap-3 mb-4">
        <button
          onClick={() => {
            setShowDeleteSection(false)
            setShowExportSection(false)
          }}
          className={`flex-1 py-2 rounded-xl transition ${
            !showDeleteSection && !showExportSection
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
          }`}
        >
          ➕ Add Orders
        </button>
        <button
          onClick={() => {
            setShowDeleteSection(true)
            setShowExportSection(false)
          }}
          className={`flex-1 py-2 rounded-xl transition ${
            showDeleteSection && !showExportSection
              ? 'bg-red-500 text-white'
              : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
          }`}
        >
          🗑️ Delete Orders
        </button>
        <button
          onClick={() => {
            setShowExportSection(true)
            setShowDeleteSection(false)
          }}
          className={`flex-1 py-2 rounded-xl transition ${
            showExportSection
              ? 'bg-purple-500 text-white'
              : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
          }`}
        >
          📥 Export CSV
        </button>
      </div>

      {/* Add Orders Section */}
      {!showDeleteSection && !showExportSection ? (
        <div className="bg-white rounded-xl shadow-md p-5 md:p-6">
          <div className="flex justify-between items-center mb-5">
            <h1 className="text-xl md:text-2xl font-bold text-gray-800">
              {bulkMode ? 'Bulk Add' : 'New Order'}
            </h1>
            <button
              onClick={() => setBulkMode(!bulkMode)}
              className="text-blue-500 hover:text-blue-600 text-sm"
            >
              {bulkMode ? '← Single' : 'Bulk →'}
            </button>
          </div>

          {!bulkMode ? (
            <form
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              <div>
                <label className="block text-gray-700 font-medium mb-2 text-sm">
                  Order Number *
                </label>
                <input
                  type="text"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  placeholder="PDD123456789"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                  disabled={loading}
                  autoComplete="off"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2 text-sm">
                  Notes (optional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Fragile, Rush, etc."
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                  disabled={loading}
                  autoComplete="off"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-500 text-white py-3 rounded-xl hover:bg-blue-600 transition font-medium text-base disabled:opacity-50"
              >
                {loading ? 'Adding...' : 'Add Order 📦'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleBulkSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2 text-sm">
                  Bulk Orders (one per line)
                </label>
                <textarea
                  value={bulkOrders}
                  onChange={(e) => setBulkOrders(e.target.value)}
                  placeholder="PDD123456789, Rush&#10;PDD987654321, Fragile&#10;PDD555666777,"
                  rows={8}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  disabled={loading}
                />
                <p className="text-xs text-gray-500 mt-2">
                  Format: orderNumber, notes (notes are optional)
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-500 text-white py-3 rounded-xl hover:bg-blue-600 transition font-medium text-base disabled:opacity-50"
              >
                {loading ? 'Adding...' : 'Add Bulk Orders 📦📦'}
              </button>
            </form>
          )}

          <button
            onClick={() => navigate('/')}
            className="w-full mt-3 text-gray-500 py-3 rounded-xl hover:text-gray-700 transition text-sm"
          >
            ← Back to Home
          </button>
        </div>
      ) : showDeleteSection ? (
        // Delete Orders Section
        <div className="bg-white rounded-xl shadow-md p-5 md:p-6">
          <div className="flex justify-between items-center mb-5">
            <h1 className="text-xl md:text-2xl font-bold text-gray-800">
              🗑️ Delete Orders
            </h1>
            <button
              onClick={() => setShowDeleteSection(false)}
              className="text-gray-500 hover:text-gray-700 text-sm"
            >
              ✕ Close
            </button>
          </div>
          <p className="text-gray-500 text-sm mb-5">
            Select orders to permanently remove from the system
          </p>

          {/* Search */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="🔍 Search order number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Stats */}
          <div className="flex justify-between items-center mb-4 text-sm">
            <span className="text-gray-500">
              {filteredOrders.length} order(s) found
            </span>
            <button
              onClick={handleSelectAll}
              className="text-blue-500 hover:text-blue-600"
            >
              {selectedOrders.length === filteredOrders.length
                ? 'Deselect All'
                : 'Select All'}
            </button>
          </div>

          {/* Orders List */}
          <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg divide-y">
            {filteredOrders.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No orders found
              </div>
            ) : (
              <>
                {/* Pending Orders */}
                {pendingOrders.length > 0 && (
                  <div>
                    <div className="bg-yellow-50 px-3 py-2 sticky top-0">
                      <h3 className="text-sm font-semibold text-yellow-700">
                        Pending ({pendingOrders.length})
                      </h3>
                    </div>
                    {pendingOrders.map((order) => (
                      <label
                        key={order._id}
                        className="flex items-center gap-3 p-3 hover:bg-yellow-50 cursor-pointer transition border-b"
                      >
                        <input
                          type="checkbox"
                          checked={selectedOrders.includes(order._id)}
                          onChange={() => handleSelectOrder(order._id)}
                          className="w-4 h-4 text-red-500 rounded focus:ring-red-500"
                        />
                        <div className="flex-1">
                          <p className="font-mono text-sm font-medium text-gray-800">
                            {order.orderNumber}
                          </p>
                          {order.notes && (
                            <p className="text-xs text-gray-500">
                              {order.notes}
                            </p>
                          )}
                        </div>
                        <span className="text-xs text-yellow-600 bg-yellow-100 px-2 py-0.5 rounded">
                          pending
                        </span>
                      </label>
                    ))}
                  </div>
                )}

                {/* Collected Orders */}
                {collectedOrders.length > 0 && (
                  <div>
                    <div className="bg-green-50 px-3 py-2 sticky top-0">
                      <h3 className="text-sm font-semibold text-green-700">
                        Collected ({collectedOrders.length})
                      </h3>
                    </div>
                    {collectedOrders.map((order) => (
                      <label
                        key={order._id}
                        className="flex items-center gap-3 p-3 hover:bg-green-50 cursor-pointer transition border-b"
                      >
                        <input
                          type="checkbox"
                          checked={selectedOrders.includes(order._id)}
                          onChange={() => handleSelectOrder(order._id)}
                          className="w-4 h-4 text-red-500 rounded focus:ring-red-500"
                        />
                        <div className="flex-1">
                          <p className="font-mono text-sm font-medium text-gray-800">
                            {order.orderNumber}
                          </p>
                          {order.notes && (
                            <p className="text-xs text-gray-500">
                              {order.notes}
                            </p>
                          )}
                        </div>
                        <span className="text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded">
                          collected
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Delete Button */}
          {selectedOrders.length > 0 && (
            <button
              onClick={handleDeleteSelected}
              disabled={deleting}
              className="w-full bg-red-500 text-white py-3 rounded-xl hover:bg-red-600 transition font-medium disabled:opacity-50 mt-4"
            >
              {deleting
                ? 'Deleting...'
                : `Delete ${selectedOrders.length} Order(s) 🗑️`}
            </button>
          )}

          <button
            onClick={() => setShowDeleteSection(false)}
            className="w-full mt-3 text-gray-500 py-3 rounded-xl hover:text-gray-700 transition text-sm"
          >
            ← Back to Add Orders
          </button>
        </div>
      ) : null}
    </div>
  )
}

export default AddOrderForm
