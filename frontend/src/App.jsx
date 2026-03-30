import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { isLoggedIn } from './lib/auth'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import TaskListPage from './pages/TaskListPage'
import TaskDetailPage from './pages/TaskDetailPage'
import MyTasksPage from './pages/MyTasksPage'
import Sidebar from './components/Sidebar'
import PostTaskModal from './components/PostTaskModal'

function PrivateRoute({ children }) {
  return isLoggedIn() ? children : <Navigate to="/login" replace />
}

function ForumLayout({ children }) {
  const [showModal, setShowModal] = useState(false)

  return (
    <div className="app-layout">
      <Sidebar onAskForHelp={() => setShowModal(true)} />
      <main className="app-main">
        {children}
      </main>
      {showModal && (
        <PostTaskModal
          onClose={() => setShowModal(false)}
          onCreated={() => setShowModal(false)}
        />
      )}
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login"    element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/" element={
          <PrivateRoute>
            <ForumLayout>
              <TaskListPage />
            </ForumLayout>
          </PrivateRoute>
        } />
        <Route path="/tasks/:id" element={
          <PrivateRoute>
            <ForumLayout>
              <TaskDetailPage />
            </ForumLayout>
          </PrivateRoute>
        } />
        <Route path="/my-tasks" element={
          <PrivateRoute>
            <ForumLayout>
              <MyTasksPage />
            </ForumLayout>
          </PrivateRoute>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
