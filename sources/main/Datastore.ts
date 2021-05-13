import { app } from "electron";
import Datastore from 'nedb-promises';
import path from "path";

const appDataPath = app.getPath("userData");
console.log(appDataPath);
const getFilename = (file: string) => path.join(appDataPath, `${file}.nedb`);

let db = {
  video: new Datastore({ filename: getFilename("videos"), autoload: true }),
};

export default db;
