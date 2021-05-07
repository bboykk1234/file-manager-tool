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
import { app, BrowserWindow } from 'electron';
import path from "path";
import { ffmpegPath, ffprobePath } from "ffmpeg-ffprobe-static";
import Ffmpeg from "fluent-ffmpeg";
import Db from "./Datastore";
import VideoMetadataReader from "./VideoMetadataReader";

Ffmpeg.setFfmpegPath(ffmpegPath as string);
Ffmpeg.setFfprobePath(ffprobePath as string);

let mainWindow: BrowserWindow | null = null;

console.log(ffprobePath);

Ffmpeg.ffprobe(path.resolve(__dirname, "../test.mp4"), function (err, metadata) {
  console.dir(metadata);
});

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
  console.log(path.resolve(__dirname, "../../test.mp4"));
  VideoMetadataReader.read(path.resolve(__dirname, "../../test.mp4")).then(data => console.log(data)).catch(err => console.log(err));
  createWindow();
}).catch(console.log);

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) createWindow();
});
