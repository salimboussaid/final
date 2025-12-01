'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { setAuthCredentials, userApi } from '@/lib/api'

export default function AuthPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Simple validation
    if (!password) {
      setError('Введите пароль')
      return
    }

    setLoading(true)

    try {
      // Save credentials to localStorage
      const login = 'admin'
      setAuthCredentials(login, password)

      // Test the credentials by making a request using the API
      try {
        await userApi.getCurrentUser()
        // Credentials are valid, redirect to profile
        router.push('/profile')
      } catch (apiError) {
        // Invalid credentials
        setError('Неверный пароль')
        localStorage.removeItem('auth_credentials')
      }
    } catch (err) {
      setError('Ошибка подключения к серверу')
      localStorage.removeItem('auth_credentials')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5] p-4">
      <div className="max-w-md mx-auto pt-8">
        <h1 className="text-3xl font-bold mb-8">Авторизация</h1>
        
        <div className="bg-white rounded-3xl p-8 shadow-sm border-2 border-blue-500">
          <h2 className="text-2xl font-semibold text-center mb-8">Авторизация</h2>
          
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Login field - disabled */}
            <div>
              <label className="block text-sm mb-2 text-gray-700">
                Логин*
              </label>
              <input
                type="text"
                value="admin"
                disabled
                className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-gray-100 text-gray-600 cursor-not-allowed"
              />
            </div>

            {/* Password field */}
            <div>
              <label className="block text-sm mb-2 text-gray-700">
                Пароль*
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    {showPassword ? (
                      <>
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </>
                    ) : (
                      <>
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </>
                    )}
                  </svg>
                </button>
              </div>
            </div>

            {error && (
              <div className="text-red-500 text-sm">
                {error}
              </div>
            )}

            {/* Login button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {loading ? 'Вход...' : 'Войти'}
              {!loading && (
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
