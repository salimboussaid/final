'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { orderApi, presentApi, ApiError, clearAuthCredentials } from '@/lib/api'
import { OrderDTO, OrderStatus } from '@/lib/types'

// Local Order type for UI with Russian status
interface Order {
  id: number
  giftName: string
  giftId: number
  customerName: string
  orderDate: string
  status: 'Заказан' | 'Подтвержден' | 'Выдан' | 'Отменен'
  apiStatus: OrderStatus
}

// Map API status to Russian
function mapStatusToRussian(status: OrderStatus): 'Заказан' | 'Подтвержден' | 'Выдан' | 'Отменен' {
  switch (status) {
    case 'PENDING': return 'Заказан'
    case 'CONFIRMED': return 'Подтвержден'
    case 'DELIVERED': return 'Выдан'
    case 'CANCELLED': return 'Отменен'
    default: return 'Заказан'
  }
}

// Map Russian status to API
function mapStatusToApi(status: string): OrderStatus {
  switch (status) {
    case 'Заказан': return 'PENDING'
    case 'Подтвержден': return 'CONFIRMED'
    case 'Выдан': return 'DELIVERED'
    case 'Отменен': return 'CANCELLED'
    default: return 'PENDING'
  }
}

export default function OrdersPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active')
  const [showOrderMenu, setShowOrderMenu] = useState<number | null>(null)
  const [presentsMap, setPresentsMap] = useState<Map<number, string>>(new Map())

  // Pagination states
  const [currentPage, setCurrentPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [totalElements, setTotalElements] = useState(0)
  const [showAll, setShowAll] = useState(false)
  const PAGE_SIZE = 10

  useEffect(() => {
    loadData()
  }, [currentPage, showAll])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Load presents first to get names
      const presents = await presentApi.getAllPresents()
      const presentNames = new Map<number, string>()
      presents.forEach(p => presentNames.set(p.id, p.name))
      setPresentsMap(presentNames)
      
      // Load orders with pagination
      let ordersData: OrderDTO[]
      if (showAll) {
        ordersData = await orderApi.getAllOrders()
        setTotalPages(1)
        setTotalElements(ordersData.length)
      } else {
        const response = await orderApi.getOrders(currentPage, PAGE_SIZE)
        ordersData = response.content
        setTotalPages(response.totalPages)
        setTotalElements(response.totalElements)
      }
      
      const convertedOrders: Order[] = ordersData.map(o => ({
        id: o.id,
        giftName: presentNames.get(o.present_id) || `Подарок #${o.present_id}`,
        giftId: o.present_id,
        customerName: o.customer.full_name || `${o.customer.last_name} ${o.customer.first_name}`,
        orderDate: new Date(o.date).toLocaleDateString('ru-RU'),
        status: mapStatusToRussian(o.status),
        apiStatus: o.status
      }))
      setOrders(convertedOrders)
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401) {
          clearAuthCredentials()
          router.push('/auth')
          return
        }
        setError(err.message)
      } else {
        setError('Ошибка загрузки данных')
      }
    } finally {
      setLoading(false)
    }
  }

  // Filter orders by status
  const activeOrders = orders.filter(
    (o) => o.status === 'Заказан' || o.status === 'Подтвержден'
  )
  const completedOrders = orders.filter(
    (o) => o.status === 'Выдан' || o.status === 'Отменен'
  )

  // Sort orders by date (newest first)
  const sortOrdersByDate = (ordersList: Order[]) => {
    return [...ordersList].sort((a, b) => {
      const dateA = a.orderDate.split('.').reverse().join('')
      const dateB = b.orderDate.split('.').reverse().join('')
      return dateB.localeCompare(dateA)
    })
  }

  // Get filtered orders based on active tab
  const displayedOrders = sortOrdersByDate(
    activeTab === 'active' ? activeOrders : completedOrders
  ).filter(
    (o) =>
      o.giftName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customerName.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleConfirmOrder = async (orderId: number) => {
    try {
      await orderApi.updateOrderStatus(orderId, 'CONFIRMED')
      await loadData()
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      }
    }
    setShowOrderMenu(null)
  }

  const handleIssueOrder = async (orderId: number) => {
    try {
      await orderApi.updateOrderStatus(orderId, 'DELIVERED')
      await loadData()
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      }
    }
    setShowOrderMenu(null)
  }

  const handleCancelOrder = async (orderId: number) => {
    try {
      await orderApi.cancelOrder(orderId)
      await loadData()
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      }
    }
    setShowOrderMenu(null)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Заказан':
        return 'text-blue-600'
      case 'Подтвержден':
        return 'text-green-600'
      case 'Выдан':
        return 'text-gray-600'
      case 'Отменен':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen w-full bg-[#f4f9fd] items-center justify-center">
        <div className="text-gray-500">Загрузка...</div>
      </div>
    )
  }

  return (
    <div className="flex h-screen w-full bg-[#f4f9fd]">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r flex flex-col">
        <nav className="flex-1 px-4 pt-8 space-y-2">
          <button
            onClick={() => router.push('/profile')}
            className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 hover:bg-gray-50 rounded-xl transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            <span>Профиль</span>
          </button>

          <button
            onClick={() => router.push('/users')}
            className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 hover:bg-gray-50 rounded-xl transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <span>Пользователи</span>
          </button>

          <button
            onClick={() => router.push('/groups')}
            className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 hover:bg-gray-50 rounded-xl transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 1v6m0 6v6M5.64 5.64l4.24 4.24m4.24 4.24l4.24 4.24M1 12h6m6 0h6M5.64 18.36l4.24-4.24m4.24-4.24l4.24-4.24" />
            </svg>
            <span>Группы</span>
          </button>

          <button
            onClick={() => router.push('/gifts')}
            className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 hover:bg-gray-50 rounded-xl transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            </svg>
            <span>Подарки</span>
          </button>

          <button className="w-full flex items-center gap-3 px-4 py-3 text-left bg-[#132440]/10 text-[#132440] font-medium rounded-xl border-l-4 border-[#132440]">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 2v2m6-2v2M4 6h16M5 10h14v10H5V10z" />
            </svg>
            <span>Заказы</span>
          </button>

          <button
            onClick={() => router.push('/history')}
            className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 hover:bg-gray-50 rounded-xl transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
            <span>История</span>
          </button>
        </nav>

        <div className="p-6 mt-auto border-t">
          <button
            onClick={() => {
              clearAuthCredentials()
              router.push('/auth')
            }}
            className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 hover:bg-gray-50 rounded-xl transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
            </svg>
            <span>Выйти</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Top Header */}
        <div className="bg-white border-b px-10 py-6">
          <h1 className="text-3xl font-bold text-gray-800">Заказы</h1>
        </div>

        {/* Error message */}
        {error && (
          <div className="mx-10 mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600">
            {error}
          </div>
        )}

        {/* Content Area */}
        <div className="p-10">
          {/* Tabs and Search */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex gap-4">
              <button
                onClick={() => setActiveTab('active')}
                className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'active'
                    ? 'bg-[#132440] text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                Активные ({activeOrders.length})
              </button>
              <button
                onClick={() => setActiveTab('completed')}
                className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'completed'
                    ? 'bg-[#132440] text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                Завершенные ({completedOrders.length})
              </button>
            </div>

            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск заказов..."
                className="pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64"
              />
            </div>
          </div>

          {/* Orders Table */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">ID</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Подарок</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Заказчик</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Дата</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Статус</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Действия</th>
                </tr>
              </thead>
              <tbody>
                {displayedOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-gray-400">
                      Нет заказов
                    </td>
                  </tr>
                ) : (
                  displayedOrders.map((order) => (
                    <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-800">#{order.id}</td>
                      <td className="px-6 py-4 text-sm text-gray-800">{order.giftName}</td>
                      <td className="px-6 py-4 text-sm text-gray-800">{order.customerName}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{order.orderDate}</td>
                      <td className="px-6 py-4">
                        <span className={`text-sm font-medium ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {(order.status === 'Заказан' || order.status === 'Подтвержден') && (
                          <div className="relative">
                            <button
                              onClick={() => setShowOrderMenu(showOrderMenu === order.id ? null : order.id)}
                              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="1" />
                                <circle cx="12" cy="5" r="1" />
                                <circle cx="12" cy="19" r="1" />
                              </svg>
                            </button>
                            
                            {showOrderMenu === order.id && (
                              <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[160px]">
                                {order.status === 'Заказан' && (
                                  <button
                                    onClick={() => handleConfirmOrder(order.id)}
                                    className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm text-green-600"
                                  >
                                    Подтвердить
                                  </button>
                                )}
                                {order.status === 'Подтвержден' && (
                                  <button
                                    onClick={() => handleIssueOrder(order.id)}
                                    className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm text-blue-600"
                                  >
                                    Выдать
                                  </button>
                                )}
                                <button
                                  onClick={() => handleCancelOrder(order.id)}
                                  className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm text-red-600"
                                >
                                  Отменить
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="mt-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setShowAll(false)
                  setCurrentPage(0)
                }}
                disabled={currentPage === 0 && !showAll}
                className={`px-4 py-2 rounded-lg border transition-colors ${
                  currentPage === 0 && !showAll
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                Первая
              </button>
              <button
                onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                disabled={currentPage === 0 || showAll}
                className={`px-4 py-2 rounded-lg border transition-colors ${
                  currentPage === 0 || showAll
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                ← Назад
              </button>
              <span className="px-4 py-2 text-gray-600">
                {showAll ? `Все заказы (${totalElements})` : `Страница ${currentPage + 1} из ${totalPages}`}
              </span>
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage >= totalPages - 1 || showAll}
                className={`px-4 py-2 rounded-lg border transition-colors ${
                  currentPage >= totalPages - 1 || showAll
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                Вперед →
              </button>
            </div>
            <button
              onClick={() => {
                setShowAll(!showAll)
                setCurrentPage(0)
              }}
              className={`px-4 py-2 rounded-lg border transition-colors ${
                showAll
                  ? 'bg-[#132440] text-white'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {showAll ? 'Постранично' : 'Показать все'}
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
