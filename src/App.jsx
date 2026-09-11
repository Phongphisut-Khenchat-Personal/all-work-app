import { AuthProvider, useAuth } from '@/context/AuthContext'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from '@/pages/LoginPage'
import TeamPage from '@/pages/TeamPage'
import BoardPage from '@/pages/BoardPage'
import { Toaster } from "@/components/ui/sonner"

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  return children
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<ProtectedRoute><TeamPage /></ProtectedRoute>} />
          <Route path="/board/:teamId" element={<ProtectedRoute><BoardPage /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster position="top-center" richColors />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
