import { app } from "electron";
import Datastore from 'nedb-promises';
import path from "path";

const filename = path.join(app.getPath("userData"), "media.nedb");
export default new Datastore({ filename, autoload: true });
