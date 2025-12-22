'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { userApi, ApiError } from '@/lib/api'
import { UserDTO, UserRole as ApiUserRole } from '@/lib/types'

export default function UsersPage() {
  const router = useRouter()
  const [users, setUsers] = useState<UserDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'STUDENT' | 'TEACHER'>('STUDENT')
  const [selectedUser, setSelectedUser] = useState<UserDTO | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState<number | null>(null)

  // Form states for Create User
  const [newUser, setNewUser] = useState<UserDTO>({
    login: '',
    password: '',
    first_name: '',
    last_name: '',
    middle_name: '',
    role: 'STUDENT',
    email: '',
    date_of_birth: '',
  })

  // Form states for Edit User
  const [editUserData, setEditUserData] = useState<UserDTO>({
    login: '',
    first_name: '',
    last_name: '',
    middle_name: '',
    role: 'STUDENT',
    email: '',
    date_of_birth: '',
  })

  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  useEffect(() => {
    loadUsers()
  }, [activeTab])

  const loadUsers = async () => {
    try {
      setLoading(true)
      if (activeTab === 'STUDENT') {
        const res = await userApi.getStudents(0, 100, 'secondName', 'asc')
        const mapped: UserDTO[] = res.content.map(s => ({
          id: s.id,
          login: s.login,
          role: 'STUDENT',
          first_name: '',
          last_name: '',
          middle_name: '',
          full_name: s.fullName,
          email: '',
          date_of_birth: s.birthDate || '',
          coins: typeof s.coins === 'string' ? parseInt(s.coins, 10) || 0 : (s.coins || 0),
        }))
        setUsers(mapped)
      } else {
        const res = await userApi.getTeachers(0, 100, 'secondName', 'asc')
        const mapped: UserDTO[] = res.content.map(t => ({
          id: t.id,
          login: t.login,
          role: 'TEACHER',
          first_name: '',
          last_name: '',
          middle_name: '',
          full_name: t.fullName,
          email: '',
          date_of_birth: '',
          coins: 0,
        }))
        setUsers(mapped)
      }
    } catch (error) {
      if (error instanceof ApiError) {
        console.error('Failed to load users:', error.message)
      }
    } finally {
      setLoading(false)
    }
  }

  // Validations
  const validateLogin = (login: string, userId?: number): string | null => {
    if (!login) return 'Логин обязателен'
    if (!/^[a-zA-Z0-9]+$/.test(login)) {
      return 'Логин может содержать только латинские буквы и цифры'
    }
    const loginExists = users.some(u => u.login === login && u.id !== userId)
    if (loginExists) return 'Логин уже занят'
    return null
  }

  const validateName = (name: string, fieldName: string): string | null => {
    if (!name) return `${fieldName} обязательно`
    if (!/^[а-яА-ЯёЁa-zA-Z\s]+$/.test(name)) {
      return `${fieldName} может содержать только буквы`
    }
    return null
  }

  const validateEmail = (email: string, userId?: number): string | null => {
    if (!email) return 'Email обязателен'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return 'Неверный формат email'
    }
    const emailExists = users.some(u => u.email === email && u.id !== userId)
    if (emailExists) return 'Email уже занят'
    return null
  }

  const validatePassword = (password: string): string | null => {
    if (!password) return 'Пароль обязателен'
    if (password.length < 4) {
      return 'Пароль должен содержать минимум 4 символа'
    }
    return null
  }

  const validateBirthDate = (date: string): string | null => {
    if (!date) return 'Дата рождения обязательна'
    // Accept format YYYY-MM-DD
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return 'Формат даты: ГГГГ-ММ-ДД'
    }
    return null
  }

  const handleCreateUser = async () => {
    const newErrors: { [key: string]: string } = {}

    const loginError = validateLogin(newUser.login)
    if (loginError) newErrors.login = loginError

    const passwordError = validatePassword(newUser.password || '')
    if (passwordError) newErrors.password = passwordError

    const firstNameError = validateName(newUser.first_name, 'Имя')
    if (firstNameError) newErrors.first_name = firstNameError

    const lastNameError = validateName(newUser.last_name, 'Фамилия')
    if (lastNameError) newErrors.last_name = lastNameError

    if (newUser.middle_name) {
      const middleNameError = validateName(newUser.middle_name, 'Отчество')
      if (middleNameError) newErrors.middle_name = middleNameError
    }

    const emailError = validateEmail(newUser.email)
    if (emailError) newErrors.email = emailError

    const birthDateError = validateBirthDate(newUser.date_of_birth)
    if (birthDateError) newErrors.date_of_birth = birthDateError

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    try {
      const createdUser = await userApi.createUser(newUser)
      setUsers([...users, createdUser])
      setShowCreateModal(false)
      setNewUser({
        login: '',
        password: '',
        first_name: '',
        last_name: '',
        middle_name: '',
        role: 'STUDENT',
        email: '',
        date_of_birth: '',
      })
      setErrors({})
    } catch (error) {
      if (error instanceof ApiError) {
        setErrors({ api: error.message })
      }
    }
  }

  const handleEditUser = async () => {
    if (!selectedUser?.id) return

    const newErrors: { [key: string]: string } = {}

    const loginError = validateLogin(editUserData.login, selectedUser.id)
    if (loginError) newErrors.login = loginError

    const firstNameError = validateName(editUserData.first_name, 'Имя')
    if (firstNameError) newErrors.first_name = firstNameError

    const lastNameError = validateName(editUserData.last_name, 'Фамилия')
    if (lastNameError) newErrors.last_name = lastNameError

    if (editUserData.middle_name) {
      const middleNameError = validateName(editUserData.middle_name, 'Отчество')
      if (middleNameError) newErrors.middle_name = middleNameError
    }

    const emailError = validateEmail(editUserData.email, selectedUser.id)
    if (emailError) newErrors.email = emailError

    const birthDateError = validateBirthDate(editUserData.date_of_birth)
    if (birthDateError) newErrors.date_of_birth = birthDateError

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    try {
      const updatedUser = await userApi.updateUser(selectedUser.id, editUserData)
      setUsers(users.map(u => u.id === selectedUser.id ? updatedUser : u))
      setShowEditModal(false)
      setSelectedUser(null)
      setErrors({})
    } catch (error) {
      if (error instanceof ApiError) {
        setErrors({ api: error.message })
      }
    }
  }

  const handleDeleteUser = async () => {
    if (!selectedUser?.id) return
    
    try {
      await userApi.deleteUser(selectedUser.id)
      setUsers(users.filter(u => u.id !== selectedUser.id))
      setShowDeleteModal(false)
      setSelectedUser(null)
    } catch (error) {
      if (error instanceof ApiError) {
        console.error('Delete failed:', error.message)
      }
    }
  }

  const openEditModal = async (user: UserDTO) => {
    try {
      const full = await userApi.getUserById(user.id!)
      setSelectedUser(full)
      setEditUserData({
        login: full.login,
        first_name: full.first_name,
        last_name: full.last_name,
        middle_name: full.middle_name || '',
        role: full.role,
        email: full.email,
        date_of_birth: full.date_of_birth,
      })
      setErrors({})
      setShowEditModal(true)
      setShowUserMenu(null)
    } catch (error) {
      if (error instanceof ApiError) {
        setErrors({ api: error.message })
      }
    }
  }

  const openDeleteModal = (user: UserDTO) => {
    setSelectedUser(user)
    setShowDeleteModal(true)
    setShowUserMenu(null)
  }

  // Filter users
  const filteredUsers = users
    .filter(u => u.role === activeTab)
    .filter(u =>
      (u.full_name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      u.login.toLowerCase().includes(searchQuery.toLowerCase())
    )

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

          <button className="w-full flex items-center gap-3 px-4 py-3 text-left bg-[#132440]/10 text-[#132440] font-medium rounded-xl border-l-4 border-[#132440]">
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

        <div className="px-4 py-6 mt-auto">
          <div className="h-px bg-gray-200 mb-6"></div>
          <button
            onClick={() => router.push('/auth')}
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
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-800">База пользователей</h1>
            <button
              onClick={() => {
                setNewUser({
                  login: '',
                  password: '',
                  first_name: '',
                  last_name: '',
                  middle_name: '',
                  role: 'STUDENT',
                  email: '',
                  date_of_birth: '',
                })
                setErrors({})
                setShowCreateModal(true)
              }}
              className="bg-[#132440] text-white px-6 py-3 rounded-xl hover:bg-[#0d1a2e] transition-colors flex items-center gap-2 shadow-sm"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12h14" />
              </svg>
              <span className="font-medium">Создать пользователя</span>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-10">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="text-gray-500">Загрузка...</div>
            </div>
          ) : (
            <div className="max-w-7xl">
              {/* Search and Tabs */}
              <div className="flex items-center justify-center gap-4 mb-8">
                <div className="relative w-80">
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
                    placeholder="Поиск"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#132440]/50 focus:border-[#132440]"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setActiveTab('STUDENT')}
                    className={`px-6 py-2.5 rounded-xl font-medium transition-all ${
                      activeTab === 'STUDENT'
                        ? 'bg-[#132440] text-white shadow-sm'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Ученики
                  </button>
                  <button
                    onClick={() => setActiveTab('TEACHER')}
                    className={`px-6 py-2.5 rounded-xl font-medium transition-all ${
                      activeTab === 'TEACHER'
                        ? 'bg-[#132440] text-white shadow-sm'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Преподаватели
                  </button>
                </div>
              </div>

              {/* Users List */}
              <div className="space-y-3">
                {filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    className="group relative bg-gradient-to-br from-white to-gray-50/50 rounded-2xl p-6 border border-gray-200 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 ease-out"
                  >
                    <div className="flex items-center justify-between gap-6">
                      {/* Grid Layout for User Data */}
                      <div className="flex-1 grid grid-cols-4 gap-6">
                        <div className="flex flex-col">
                          <div className="text-xs font-medium text-gray-500 mb-1.5">ФИО</div>
                          <div className="h-px bg-gradient-to-r from-gray-200 to-transparent mb-2"></div>
                          <div className="text-sm font-bold text-gray-800">{user.full_name || `${user.last_name} ${user.first_name} ${user.middle_name || ''}`}</div>
                        </div>
                        
                        <div className="flex flex-col">
                          <div className="text-xs font-medium text-gray-500 mb-1.5">Логин</div>
                          <div className="h-px bg-gradient-to-r from-gray-200 to-transparent mb-2"></div>
                          <div className="text-sm font-semibold text-gray-700">{user.login}</div>
                        </div>
                        
                        <div className="flex flex-col">
                          <div className="text-xs font-medium text-gray-500 mb-1.5">Дата рождения</div>
                          <div className="h-px bg-gradient-to-r from-gray-200 to-transparent mb-2"></div>
                          <div className="text-sm font-semibold text-gray-700">{user.date_of_birth || '-'}</div>
                        </div>
                        
                        <div className="flex flex-col">
                          <div className="text-xs font-medium text-gray-500 mb-1.5">Кол-во алгокоинов</div>
                          <div className="h-px bg-gradient-to-r from-gray-200 to-transparent mb-2"></div>
                          <div className="text-sm font-bold text-[#132440]">{user.coins || 0}</div>
                        </div>
                      </div>

                      {/* Actions Menu */}
                      <div className="relative">
                        <button
                          onClick={() => setShowUserMenu(showUserMenu === user.id ? null : user.id!)}
                          className="p-2.5 rounded-full bg-gray-100/80 hover:bg-[#132440]/10 text-gray-600 hover:text-[#132440] transition-all duration-200 group-hover:shadow-sm"
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="1" fill="currentColor" />
                            <circle cx="12" cy="5" r="1" fill="currentColor" />
                            <circle cx="12" cy="19" r="1" fill="currentColor" />
                          </svg>
                        </button>

                        {showUserMenu === user.id && (
                          <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-10">
                            <button
                              onClick={() => openEditModal(user)}
                              className="w-full text-left px-4 py-2.5 hover:bg-gray-50 text-gray-700 text-sm transition-colors flex items-center gap-2"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                              </svg>
                              Редактировать
                            </button>
                            <button
                              onClick={() => openDeleteModal(user)}
                              className="w-full text-left px-4 py-2.5 hover:bg-red-50 text-red-600 text-sm transition-colors flex items-center gap-2"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                              </svg>
                              Удалить
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => {
          setShowCreateModal(false)
          setErrors({})
        }}>
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Создать пользователя</h2>
              <button
                onClick={() => {
                  setShowCreateModal(false)
                  setErrors({})
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              {errors.api && <div className="text-red-500 text-sm">{errors.api}</div>}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-2">Логин*</label>
                  <input
                    type="text"
                    value={newUser.login}
                    onChange={(e) => setNewUser({ ...newUser, login: e.target.value })}
                    placeholder="Логин"
                    className={`w-full px-4 py-2 rounded-lg border ${
                      errors.login ? 'border-red-500' : 'border-gray-300'
                    } focus:outline-none focus:ring-2 focus:ring-[#132440]`}
                  />
                  {errors.login && <p className="text-red-500 text-xs mt-1">{errors.login}</p>}
                </div>

                <div>
                  <label className="block text-sm mb-2">Пароль*</label>
                  <input
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    placeholder="Пароль"
                    className={`w-full px-4 py-2 rounded-lg border ${
                      errors.password ? 'border-red-500' : 'border-gray-300'
                    } focus:outline-none focus:ring-2 focus:ring-[#132440]`}
                  />
                  {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-2">Фамилия*</label>
                  <input
                    type="text"
                    value={newUser.last_name}
                    onChange={(e) => setNewUser({ ...newUser, last_name: e.target.value })}
                    placeholder="Фамилия"
                    className={`w-full px-4 py-2 rounded-lg border ${
                      errors.last_name ? 'border-red-500' : 'border-gray-300'
                    } focus:outline-none focus:ring-2 focus:ring-[#132440]`}
                  />
                  {errors.last_name && <p className="text-red-500 text-xs mt-1">{errors.last_name}</p>}
                </div>

                <div>
                  <label className="block text-sm mb-2">Роль*</label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value as ApiUserRole })}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#132440]"
                  >
                    <option value="STUDENT">Ученик</option>
                    <option value="TEACHER">Преподаватель</option>
                    <option value="ADMIN">Админ</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-2">Имя*</label>
                  <input
                    type="text"
                    value={newUser.first_name}
                    onChange={(e) => setNewUser({ ...newUser, first_name: e.target.value })}
                    placeholder="Имя"
                    className={`w-full px-4 py-2 rounded-lg border ${
                      errors.first_name ? 'border-red-500' : 'border-gray-300'
                    } focus:outline-none focus:ring-2 focus:ring-[#132440]`}
                  />
                  {errors.first_name && <p className="text-red-500 text-xs mt-1">{errors.first_name}</p>}
                </div>

                <div>
                  <label className="block text-sm mb-2">Отчество</label>
                  <input
                    type="text"
                    value={newUser.middle_name}
                    onChange={(e) => setNewUser({ ...newUser, middle_name: e.target.value })}
                    placeholder="Отчество"
                    className={`w-full px-4 py-2 rounded-lg border ${
                      errors.middle_name ? 'border-red-500' : 'border-gray-300'
                    } focus:outline-none focus:ring-2 focus:ring-[#132440]`}
                  />
                  {errors.middle_name && <p className="text-red-500 text-xs mt-1">{errors.middle_name}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-2">Email*</label>
                  <input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    placeholder="Email"
                    className={`w-full px-4 py-2 rounded-lg border ${
                      errors.email ? 'border-red-500' : 'border-gray-300'
                    } focus:outline-none focus:ring-2 focus:ring-[#132440]`}
                  />
                  {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                </div>

                <div>
                  <label className="block text-sm mb-2">Дата рождения*</label>
                  <input
                    type="date"
                    value={newUser.date_of_birth}
                    onChange={(e) => setNewUser({ ...newUser, date_of_birth: e.target.value })}
                    className={`w-full px-4 py-2 rounded-lg border ${
                      errors.date_of_birth ? 'border-red-500' : 'border-gray-300'
                    } focus:outline-none focus:ring-2 focus:ring-[#132440]`}
                  />
                  {errors.date_of_birth && <p className="text-red-500 text-xs mt-1">{errors.date_of_birth}</p>}
                </div>
              </div>

              <button
                onClick={handleCreateUser}
                className="w-full bg-[#132440] hover:bg-[#0d1a2e] text-white font-medium py-3 rounded-lg mt-4"
              >
                Создать
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => {
          setShowEditModal(false)
          setSelectedUser(null)
          setErrors({})
        }}>
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Редактировать пользователя</h2>
              <button
                onClick={() => {
                  setShowEditModal(false)
                  setSelectedUser(null)
                  setErrors({})
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              {errors.api && <div className="text-red-500 text-sm">{errors.api}</div>}
              
              <div>
                <label className="block text-sm mb-2">Логин*</label>
                <input
                  type="text"
                  value={editUserData.login}
                  onChange={(e) => setEditUserData({ ...editUserData, login: e.target.value })}
                  placeholder="Логин"
                  className={`w-full px-4 py-2 rounded-lg border ${
                    errors.login ? 'border-red-500' : 'border-gray-300'
                  } focus:outline-none focus:ring-2 focus:ring-[#132440]`}
                />
                {errors.login && <p className="text-red-500 text-xs mt-1">{errors.login}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-2">Фамилия*</label>
                  <input
                    type="text"
                    value={editUserData.last_name}
                    onChange={(e) => setEditUserData({ ...editUserData, last_name: e.target.value })}
                    placeholder="Фамилия"
                    className={`w-full px-4 py-2 rounded-lg border ${
                      errors.last_name ? 'border-red-500' : 'border-gray-300'
                    } focus:outline-none focus:ring-2 focus:ring-[#132440]`}
                  />
                  {errors.last_name && <p className="text-red-500 text-xs mt-1">{errors.last_name}</p>}
                </div>

                <div>
                  <label className="block text-sm mb-2">Роль*</label>
                  <select
                    value={editUserData.role}
                    onChange={(e) => setEditUserData({ ...editUserData, role: e.target.value as ApiUserRole })}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#132440]"
                  >
                    <option value="STUDENT">Ученик</option>
                    <option value="TEACHER">Преподаватель</option>
                    <option value="ADMIN">Админ</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-2">Имя*</label>
                  <input
                    type="text"
                    value={editUserData.first_name}
                    onChange={(e) => setEditUserData({ ...editUserData, first_name: e.target.value })}
                    placeholder="Имя"
                    className={`w-full px-4 py-2 rounded-lg border ${
                      errors.first_name ? 'border-red-500' : 'border-gray-300'
                    } focus:outline-none focus:ring-2 focus:ring-[#132440]`}
                  />
                  {errors.first_name && <p className="text-red-500 text-xs mt-1">{errors.first_name}</p>}
                </div>

                <div>
                  <label className="block text-sm mb-2">Отчество</label>
                  <input
                    type="text"
                    value={editUserData.middle_name}
                    onChange={(e) => setEditUserData({ ...editUserData, middle_name: e.target.value })}
                    placeholder="Отчество"
                    className={`w-full px-4 py-2 rounded-lg border ${
                      errors.middle_name ? 'border-red-500' : 'border-gray-300'
                    } focus:outline-none focus:ring-2 focus:ring-[#132440]`}
                  />
                  {errors.middle_name && <p className="text-red-500 text-xs mt-1">{errors.middle_name}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-2">Email*</label>
                  <input
                    type="email"
                    value={editUserData.email}
                    onChange={(e) => setEditUserData({ ...editUserData, email: e.target.value })}
                    placeholder="Email"
                    className={`w-full px-4 py-2 rounded-lg border ${
                      errors.email ? 'border-red-500' : 'border-gray-300'
                    } focus:outline-none focus:ring-2 focus:ring-[#132440]`}
                  />
                  {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                </div>

                <div>
                  <label className="block text-sm mb-2">Дата рождения*</label>
                  <input
                    type="date"
                    value={editUserData.date_of_birth}
                    onChange={(e) => setEditUserData({ ...editUserData, date_of_birth: e.target.value })}
                    className={`w-full px-4 py-2 rounded-lg border ${
                      errors.date_of_birth ? 'border-red-500' : 'border-gray-300'
                    } focus:outline-none focus:ring-2 focus:ring-[#132440]`}
                  />
                  {errors.date_of_birth && <p className="text-red-500 text-xs mt-1">{errors.date_of_birth}</p>}
                </div>
              </div>

              <button
                onClick={handleEditUser}
                className="w-full bg-[#132440] hover:bg-[#0d1a2e] text-white font-medium py-3 rounded-lg mt-4"
              >
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete User Modal */}
      {showDeleteModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => {
          setShowDeleteModal(false)
          setSelectedUser(null)
        }}>
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Удалить пользователя</h2>
              <button
                onClick={() => {
                  setShowDeleteModal(false)
                  setSelectedUser(null)
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <p className="text-gray-600 mb-6">
              {selectedUser.full_name || `${selectedUser.last_name} ${selectedUser.first_name}`} будет удален навсегда без возможности восстановления
            </p>

            <button
              onClick={handleDeleteUser}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 rounded-lg"
            >
              Удалить
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
