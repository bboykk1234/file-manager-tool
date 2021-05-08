/* eslint global-require: off, no-console: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `yarn build` or `yarn build:main`, this file is compiled to
 * `./src/main.prod.js` using webpack. This gives us some performance wins.
 */
import 'core-js/stable';
import 'regenerator-runtime/runtime';
import { app, BrowserWindow, dialog, ipcMain } from 'electron';
import Db from "./Datastore";
import path from "path";
import VideoProcessor from "./VideoProcessor";
import { readdirSync } from 'fs';

let mainWindow: BrowserWindow | null = null;

const createWindow = async () => {
  mainWindow = new BrowserWindow({
    show: false,
    width: 1024,
    height: 728,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  mainWindow.loadURL(`file://${__dirname}/index.html`);

  // @TODO: Use 'ready-to-show' event
  //        https://github.com/electron/electron/blob/master/docs/api/browser-window.md#using-ready-to-show-event
  mainWindow.webContents.on('did-finish-load', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
      mainWindow.focus();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
};

/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.whenReady().then(() => {
  Db.load().then(() => console.log('nedb loaded'));
  createWindow();
}).catch(console.log);

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) createWindow();
});

ipcMain.on('read-files-metadata', async (event) => {
  if (mainWindow === null) {
    return;
  }

  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });

  const videoProcessor = VideoProcessor.read("/home/davidtan/Downloads/test.mp4");
  const metadata = await videoProcessor.getMetadata();
  try {
    await videoProcessor.takeMosaicScreenshot();
  } catch (err) {
    console.log(err);
  }

  // result?.filePaths?.forEach((filePath) => {
  //   readdirSync(filePath).forEach(async (file) => {
  //     if (!file.endsWith(".mp4")) {
  //       return;
  //     }

  //     const filename = path.join(filePath, file);

  //     console.log(metadata);
  //     event.reply('read-files-metadata-chunk-finished', file);
  //   });
  // });
});
