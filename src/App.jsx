import { AuthProvider, useAuth } from '@/context/AuthContext'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from '@/pages/LoginPage'
import TeamPage from '@/pages/TeamPage'
import BoardPage from '@/pages/BoardPage'
import { Toaster } from "@/components/ui/sonner" // ตัวแสดงผลแจ้งเตือน

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" />
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
        </Routes>
        
        {/* วาง Toaster ไว้ตรงนี้เพื่อให้เด้งได้ทุกหน้า */}
        <Toaster position="top-center" richColors />
        
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App