import { useEffect, useRef, useState } from 'react'
import { useRequireAuth } from '../lib/protectRoute'
import { useAuth } from '../contexts/AuthContext'

export interface LogType {
  id?: string
  text: string
  type?: string
  ip?: string
}

function Main(): JSX.Element {
  const user = useRequireAuth()
  const { logout } = useAuth()
  const [logArray, setLogArray] = useState<LogType[]>([
    {
      text: 'Welcome to Quick Resume!!!',
      type: 'info',
      id: '0000'
    }
  ])
  const logAreaRef = useRef<HTMLDivElement>(null)
  const [generatedCount, setGeneratedCount] = useState(0)

  useEffect(() => {
    window.electron.ipcRenderer.on('generated', (event, arg) => {
      setGeneratedCount((prev) => prev + 1)

      setLogArray((prev) => [
        ...prev,
        {
          text: arg.text,
          type: arg.type,
          id: arg.id,
          ip: arg.ip
        }
      ])
    })

    window.electron.ipcRenderer.on('message', (event, arg) => {
      setLogArray((prev) => [
        ...prev,
        {
          text: arg.text,
          type: arg.type,
          id: arg.id,
          ip: arg.ip
        }
      ])
    })

    return () => {
      window.electron.ipcRenderer.removeAllListeners('message')
      window.electron.ipcRenderer.removeAllListeners('generated')
    }
  }, [])

  useEffect(() => {
    if (logAreaRef.current) {
      logAreaRef.current.scrollTop = logAreaRef.current.scrollHeight
    }
  }, [logArray])

  if (!user) return <></>

  return (
    <div className="flex flex-col wrapper">
      <div className="flex justify-between gap nav padding-y items-center">
        <div className="flex flex-col">
          <p>{generatedCount} resumes generated</p>
          <p>Hotkey: Ctrl + Alt + SPACE</p>
        </div>
        <button className="btn rounded" onClick={() => logout()}>
          Logout
        </button>
      </div>
      <div className="log-area" ref={logAreaRef}>
        {logArray.map((log, index) => (
          <div
            key={index}
            style={{
              color: (() => {
                if (log.type?.includes('error')) return 'pink'
                if (log.type?.includes('warning')) return 'yellow'
                if (log.type?.includes('info')) return 'cyan'
                if (log.type?.includes('success')) return 'lightgreen'
                return 'white'
              })()
            }}
          >
            {log.ip && <span className="ip">{log.ip}:</span>}
            {log.text}
          </div>
        ))}
      </div>
    </div>
  )
}

export default Main
