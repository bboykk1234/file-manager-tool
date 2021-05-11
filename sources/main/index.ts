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
import { readdirSync, statSync, unlinkSync } from 'fs';
import Video from './Video';
import CloudImageStorage from './CloudImageStorage';

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

  const readVideoFilesFromDir = async (dir: string) => {
    const filesFromDir = readdirSync(dir);

    for (const file of filesFromDir) {
      const filename = path.join(dir, file);
      if (statSync(filename).isDirectory()) {
        console.log("Directory: " + filename);
        await readVideoFilesFromDir(filename);
      }

      if (!(file.endsWith(".mp4") || file.endsWith(".mkv"))) {
        console.log("Not video file, next...");
        continue;
      }
      const processor = new VideoProcessor(filename);
      const video = new Video(processor);

      let message = {
        status: true,
        reason: null,
        file,
      };

      const outputFile = Date.now().toString();
      const sourceKey = `test/${outputFile}`;

      try {
        console.log("Before taking screen shot for: " + filename);
        const outputPath = await video.takeMosaicScreenshot(outputFile);
        console.log("Upstream: " + outputPath);
        const uploadResult = await CloudImageStorage.upload(outputPath, sourceKey);
        unlinkSync(outputPath);
        console.log("Unlinked: " + outputPath);
      } catch (err) {
        message.status = false;
        message.reason = err;
      }

      event.reply('read-files-metadata-chunk-finished', message);
    }
  };

  for (const dir of result.filePaths) {
    await readVideoFilesFromDir(dir);
  }
});
