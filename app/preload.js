// Preload script to expose require to renderer
const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  ipcRenderer: {
    invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args),
    on: (channel, func) => {
      const validChannels = ['sync-log', 'sync-stopped'];
      if (validChannels.includes(channel)) {
        ipcRenderer.on(channel, (event, ...args) => func(...args));
      }
    },
    removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel)
  },
  require: require
});

