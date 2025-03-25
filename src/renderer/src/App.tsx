import { HashRouter as Router, Routes, Route } from 'react-router-dom'
import Login from './pages/Login'
import Main from './pages/Main'
import { Layout } from './components/Layout'
import { AuthProvider } from './contexts/AuthContext'

export default function App() {
  return (
    <Layout>
      <Router>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Main />} />
          </Routes>
        </AuthProvider>
      </Router>
    </Layout>
  )
}
