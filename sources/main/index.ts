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
import db from "./Datastore";
import path from "path";
import VideoProcessor from "./VideoProcessor";
import { readdirSync, statSync, unlinkSync } from 'fs';
import Video from './Video';
import CloudImageStorage from './CloudImageStorage';
import { v4 as uuidv4 } from "uuid";
import { UploadApiResponse } from 'cloudinary';

type CustomVideoFileDocument = {
  originalLocation: string,
  screenshotId: string,
};

type VideoFileDocument = CustomVideoFileDocument & UploadApiResponse;

type VideoDocument = {
  originalTitle: string,
  lowerCasedTitle: string,
  files: VideoFileDocument[],
};

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
      const dirParts = dir.split(path.sep);
      const lastDir = dirParts.pop();

      if (lastDir === undefined) {
        console.log("File doesn't store in a folder!");
        continue;
      }

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
      const screenshotId = uuidv4();
      const sourceKey = `pictures/screenshots/${screenshotId}`;
      const videoTitle = lastDir;
      let docFound = true;

      let videoDoc = await db.video.findOne<VideoDocument>({ originalTitle: videoTitle, lowerCasedTitle: videoTitle.toLowerCase() });

      if (!videoDoc) {
        docFound = false;
        videoDoc = {
          _id: uuidv4(),
          originalTitle: videoTitle,
          lowerCasedTitle: videoTitle.toLowerCase(),
          files: [],
        };
      }

      let tempOutputPath = null;
      let message = {
        status: true,
        reason: null,
        file,
      };

      try {
        tempOutputPath = await video.takeMosaicScreenshot();
        console.log("Screenshot temp output path: " + tempOutputPath);
        const uploadResult = await CloudImageStorage.upload(tempOutputPath, sourceKey);
        videoDoc.files.push({
          ...uploadResult,
          originalLocation: filename,
          screenshotId,
        });

        if (docFound) {
          db.video.update({_id: videoDoc._id}, videoDoc)
            .then(updatedDoc => {
              console.log(`Document updated: ${updatedDoc}`);
            })
            .catch(err => {
              console.log(`Document failed to create, reason: ${err}`);
            });
        } else {
          db.video.insert(videoDoc)
            .then(newDoc => {
              console.log(`New document created: ${newDoc}`);
            })
            .catch(err => {
              console.log(`Document failed to create, reason: ${err}`);
            });
        }
      } catch (err) {
        message.status = false;
        message.reason = err;
      } finally {
        if (tempOutputPath !== null) {
          unlinkSync(tempOutputPath);
          console.log("Unlinked: " + tempOutputPath);
        }
      }

      event.reply('read-files-metadata-chunk-finished', message);
    }
  };

  for (const dir of result.filePaths) {
    await readVideoFilesFromDir(dir);
  }
});
