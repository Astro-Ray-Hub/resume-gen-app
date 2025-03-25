import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

export default function Login() {
  const { login } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    try {
      setLoading(true)
      await login(username, password)
    } catch (err: any) {
      setLoading(false)
      const { data, statusText } = err.response
      new Notification(statusText, {
        body: data.error
      })
    }
    setUsername('')
    setPassword('')
  }

  if (loading) return <h1>Loading...</h1>

  return (
    <div className="flex flex-col gap">
      <h1 className="text-center">Login</h1>
      <input
        type="text"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        className="rounded text-lg input"
      />
      <input
        type="password"
        placeholder="Password"
        className="rounded text-lg input"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button onClick={handleLogin} className="btn rounded">
        Login
      </button>
    </div>
  )
}
