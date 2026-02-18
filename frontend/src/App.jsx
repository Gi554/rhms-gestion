import { Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Toaster } from 'sonner'

// Layouts
import DashboardLayout from './layouts/DashboardLayout'
import AuthLayout from './layouts/AuthLayout'

// Pages
import Login from './pages/auth/Login'
import Dashboard from './pages/dashboard/Dashboard'
import EmployeeList from './pages/employees/EmployeeList'
import EmployeeDetail from './pages/employees/EmployeeDetail'
import DepartmentList from './pages/departments/DepartmentList'
import LeaveList from './pages/leaves/LeaveList'
import PayrollList from './pages/payroll/PayrollList'
import DocumentList from './pages/documents/DocumentList'
import AttendanceList from './pages/attendance/AttendanceList'
import Profile from './pages/profile/Profile'
import { api } from './lib/api-client'

import { useQueryClient } from '@tanstack/react-query'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const queryClient = useQueryClient()

  const fetchProfile = async () => {
    try {
      const profile = await api.getProfile()
      setUserProfile(profile.data)
      setIsAuthenticated(true)
    } catch (err) {
      console.error("Failed to fetch profile", err)
      setIsAuthenticated(false)
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (token) {
      fetchProfile()
    } else {
      setLoading(false)
    }
  }, [])

  const handleLogin = async (tokens) => {
    localStorage.setItem('accessToken', tokens.access)
    localStorage.setItem('refreshToken', tokens.refresh)
    await fetchProfile()
  }

  const handleLogout = () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    setIsAuthenticated(false)
    setUserProfile(null)
    queryClient.clear()
  }

  const isAdmin = userProfile?.is_superuser || userProfile?.is_staff
  const userRole = userProfile?.organizations?.[0]?.role
  const isManager = userRole === 'admin' || userRole === 'manager'

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-lg">Chargement...</div>
      </div>
    )
  }

  return (
    <>
      <Routes>
        {/* Auth Routes */}
        <Route element={<AuthLayout />}>
          <Route
            path="/login"
            element={
              isAuthenticated ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <Login onLogin={handleLogin} />
              )
            }
          />
        </Route>

        {/* Protected Routes */}
        <Route
          element={
            isAuthenticated ? (
              <DashboardLayout onLogout={handleLogout} userProfile={userProfile} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route
            path="/employees"
            element={isAdmin || isManager ? <EmployeeList /> : <Navigate to="/dashboard" replace />}
          />
          <Route
            path="/employees/:id"
            element={isAdmin || isManager ? <EmployeeDetail /> : <Navigate to="/dashboard" replace />}
          />
          <Route
            path="/departments"
            element={isAdmin || isManager ? <DepartmentList /> : <Navigate to="/dashboard" replace />}
          />
          <Route path="/leaves" element={<LeaveList />} />
          <Route path="/attendance" element={<AttendanceList />} />
          <Route path="/payroll" element={<PayrollList />} />
          <Route path="/documents" element={<DocumentList />} />
          <Route path="/profile" element={<Profile />} />
        </Route>

        {/* Default redirect */}
        <Route
          path="/"
          element={
            <Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />
          }
        />
      </Routes>

      <Toaster position="top-right" richColors />
    </>
  )
}

export default App
