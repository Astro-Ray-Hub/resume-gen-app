import { app, shell, BrowserWindow, ipcMain, Tray, Menu, screen } from 'electron'
import { is } from '@electron-toolkit/utils'
import fs from 'fs'
import path from 'path'
import os from 'os'
import { getText } from '@one-lang/get-selected-text'
import { GlobalKeyboardListener } from 'node-global-key-listener'
import axios from 'axios'
import image from '../../resources/images.png?asset'

const config = JSON.parse(fs.readFileSync('config.json', 'utf8'))
ipcMain.handle('get-config', () => config)

const globalKeyboardListener = new GlobalKeyboardListener()

let mainWindow: BrowserWindow
let authToken = ''

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 240,
    height: 400,
    minWidth: 300,
    // resizable: false,
    show: false,
    transparent: true,
    autoHideMenuBar: true,
    alwaysOnTop: true,
    frame: false,
    ...(process.platform === 'linux' ? { image } : {}),
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      sandbox: false
    },
    x: screen.getPrimaryDisplay().workAreaSize.width - 300 - 10,
    y: 264
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  setupGlobalKeyboardListener()

  logMessage('++++++ Resume writer is ready. ++++++')

  const tray = new Tray(image)

  const contextMenu = Menu.buildFromTemplate([{ label: 'Quit', click: () => app.quit() }])
  tray.setToolTip('Resume Generator')
  tray.setContextMenu(contextMenu)
  createWindow()
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

const generateResume = async (jobDescription) => {
  mainWindow.webContents.send('message', {
    text: 'Selected : ' + jobDescription,
    type: 'selected-text'
  })

  try {
    const result = await axios.post(
      config.hostUrl + '/api/resume/generate',
      { jobDescription },
      {
        headers: {
          Authorization: `Bearer ${authToken}`
        },
      }
    )

    const { resumeBuffer, fileName, dirName } = result.data;

    // Define path
    const downloadsDir = path.join(os.homedir(), 'Downloads', 'Resume', `${dirName}`)
    if (!fs.existsSync(downloadsDir)) {
      fs.mkdirSync(downloadsDir, { recursive: true })
    }
    const savePath = path.join(downloadsDir, `${fileName}.docx`)

    // Write binary file to disk
    fs.writeFileSync(savePath, Buffer.from(resumeBuffer, 'base64'))

    // Notify frontend
    mainWindow.webContents.send('generated', {
      text: `✅ Saved to ${savePath}`,
      type: 'success'
    })
  } catch (error: any) {
    const { data } = error.response
    mainWindow.webContents.send('message', {
      text: data.message || 'Failed to generate resume',
      type: 'error'
    })
  }
}

ipcMain.on('minimize', () => {
  mainWindow.minimize()
})

ipcMain.on('auth-token', (event, token) => {
  authToken = token
})

const setupGlobalKeyboardListener = () => {
  if (authToken) {
    mainWindow.webContents.send('message', {
      text: 'Auth is required',
      type: 'error'
    })
    return
  }
  globalKeyboardListener.addListener(function (e, down) {
    if (e.state == 'DOWN' && down['LEFT ALT'] && down['LEFT CTRL'] && e.name == 'SPACE') {
      getText()
        .then((jobDescription) => {
          if (!jobDescription) {
            throw new Error('No text selected')
          }
          generateResume(jobDescription)
        })
    }
  })
}

const logMessage = (message) => {
  const logFilePath = path.join('app.log')
  const logEntry = `${new Date().toISOString()} - ${message}\n`
  fs.appendFileSync(logFilePath, logEntry)
}
