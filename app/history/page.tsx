'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { userApi, groupApi, ApiError, clearAuthCredentials } from '@/lib/api'
import { CoinsHistoryRecord, GroupDTO } from '@/lib/types'

interface HistoryRecord {
  id: number
  date: string
  teacher: string
  group: string
  student: string
  coins: number
  reason: string
}

export default function HistoryPage() {
  const router = useRouter()
  const [historyRecords, setHistoryRecords] = useState<HistoryRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [selectedTeacher, setSelectedTeacher] = useState('')
  const [selectedGroup, setSelectedGroup] = useState('')
  const [selectedStudent, setSelectedStudent] = useState('')
  
  const [teachers, setTeachers] = useState<string[]>([])
  const [groups, setGroups] = useState<string[]>([])
  const [students, setStudents] = useState<string[]>([])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Load coins history
      const history = await userApi.getAllCoinsHistory()
      
      // Convert to our format
      const records: HistoryRecord[] = history.map((h, index) => ({
        id: index + 1,
        date: new Date(h.date).toLocaleDateString('ru-RU'),
        teacher: h.admin ? `${h.admin.last_name} ${h.admin.first_name}` : 'Система',
        group: h.user?.group_name || 'Без группы',
        student: h.user ? `${h.user.last_name} ${h.user.first_name}` : 'Неизвестно',
        coins: h.coins,
        reason: h.reason || 'Не указана'
      }))
      
      setHistoryRecords(records)
      
      // Extract unique values for filters
      const uniqueTeachers = [...new Set(records.map(r => r.teacher))].sort()
      const uniqueGroups = [...new Set(records.map(r => r.group))].sort()
      const uniqueStudents = [...new Set(records.map(r => r.student))].sort()
      
      setTeachers(uniqueTeachers)
      setGroups(uniqueGroups)
      setStudents(uniqueStudents)
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401) {
          clearAuthCredentials()
          router.push('/auth')
          return
        }
        setError(err.message)
      } else {
        setError('Ошибка загрузки истории')
      }
    } finally {
      setLoading(false)
    }
  }

  // Convert dd.mm.yyyy to comparable format
  const parseRussianDate = (dateStr: string): Date => {
    const parts = dateStr.split('.')
    return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]))
  }

  // Filter and sort records
  const filteredRecords = historyRecords
    .filter((record) => {
      // Date filter
      if (dateFrom) {
        const recordDate = parseRussianDate(record.date)
        const fromDate = new Date(dateFrom)
        if (recordDate < fromDate) return false
      }
      if (dateTo) {
        const recordDate = parseRussianDate(record.date)
        const toDate = new Date(dateTo)
        if (recordDate > toDate) return false
      }
      
      // Other filters
      if (selectedTeacher && record.teacher !== selectedTeacher) return false
      if (selectedGroup && record.group !== selectedGroup) return false
      if (selectedStudent && record.student !== selectedStudent) return false
      
      return true
    })
    .sort((a, b) => {
      const dateA = parseRussianDate(a.date)
      const dateB = parseRussianDate(b.date)
      return dateB.getTime() - dateA.getTime()
    })

  const clearFilters = () => {
    setDateFrom('')
    setDateTo('')
    setSelectedTeacher('')
    setSelectedGroup('')
    setSelectedStudent('')
  }

  // Calculate total coins for filtered records
  const totalCoins = filteredRecords.reduce((sum, r) => sum + r.coins, 0)

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

          <button
            onClick={() => router.push('/orders')}
            className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 hover:bg-gray-50 rounded-xl transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 2v2m6-2v2M4 6h16M5 10h14v10H5V10z" />
            </svg>
            <span>Заказы</span>
          </button>

          <button className="w-full flex items-center gap-3 px-4 py-3 text-left bg-[#132440]/10 text-[#132440] font-medium rounded-xl border-l-4 border-[#132440]">
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
          <h1 className="text-3xl font-bold text-gray-800">История начислений</h1>
        </div>

        {/* Error message */}
        {error && (
          <div className="mx-10 mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600">
            {error}
          </div>
        )}

        {/* Content Area */}
        <div className="p-10">
          {/* Filters */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Фильтры</h2>
              <button
                onClick={clearFilters}
                className="text-sm text-indigo-600 hover:text-indigo-700"
              >
                Сбросить
              </button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Дата с</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-600 mb-1">Дата по</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-600 mb-1">Учитель</label>
                <select
                  value={selectedTeacher}
                  onChange={(e) => setSelectedTeacher(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Все</option>
                  {teachers.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm text-gray-600 mb-1">Группа</label>
                <select
                  value={selectedGroup}
                  onChange={(e) => setSelectedGroup(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Все</option>
                  {groups.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm text-gray-600 mb-1">Ученик</label>
                <select
                  value={selectedStudent}
                  onChange={(e) => setSelectedStudent(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Все</option>
                  {students.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Stats Summary */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Всего записей</p>
                <p className="text-2xl font-bold text-gray-800">{filteredRecords.length}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Сумма монет</p>
                <p className={`text-2xl font-bold ${totalCoins >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {totalCoins >= 0 ? '+' : ''}{totalCoins}
                </p>
              </div>
            </div>
          </div>

          {/* History Table */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Дата</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Учитель</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Группа</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Ученик</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Монеты</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Причина</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-gray-400">
                      Нет записей
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((record) => (
                    <tr key={record.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-600">{record.date}</td>
                      <td className="px-6 py-4 text-sm text-gray-800">{record.teacher}</td>
                      <td className="px-6 py-4 text-sm text-gray-800">{record.group}</td>
                      <td className="px-6 py-4 text-sm text-gray-800">{record.student}</td>
                      <td className="px-6 py-4">
                        <span className={`text-sm font-medium ${record.coins >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {record.coins >= 0 ? '+' : ''}{record.coins}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{record.reason}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}
