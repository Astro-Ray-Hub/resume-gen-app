import { useState } from 'react'
import { CircleAlertIcon, GripHorizontalIcon, MinusIcon, XIcon } from 'lucide-react'

interface LayoutProps {
  children: React.ReactNode
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [showCloseModal, setShowCloseModal] = useState('hide')

  const minimizeWindow = () => {
    window.electron.ipcRenderer.send('minimize')
  }

  const confirmClose = (confirm: boolean) => {
    if (confirm) {
      window.close()
    }
    setShowCloseModal('hide')
  }

  const toggleCloseModal = () => {
    setShowCloseModal('hide')
    if (showCloseModal === 'hide') {
      setShowCloseModal('show')
    } else {
      setShowCloseModal('hide')
    }
  }

  return (
    <div className="bg">
      <div className="frame">
        <GripHorizontalIcon className="move-icon" />
        <MinusIcon className="minimize-icon" onClick={minimizeWindow} />
        <XIcon className="close-icon" onClick={toggleCloseModal} />
      </div>

      <div className="main">{children}</div>

      {/* Confirm Close Modal */}
      <div className={`modal ${showCloseModal}`}>
        <div className="modal-content">
          <div className="modal-header">
            <CircleAlertIcon size={50} />
          </div>
          <div className="modal-body">
            <p>Are you sure to close?</p>
          </div>
          <div className="modal-footer">
            <button className="btn" onClick={() => confirmClose(true)}>
              Yes
            </button>
            <button className="btn" onClick={() => confirmClose(false)}>
              No
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
