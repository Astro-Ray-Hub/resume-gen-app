import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      getConfig: () => Promise<{ hostUrl: string }>
    }
  }
}
