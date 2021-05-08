import { ffmpegPath, ffprobePath } from "ffmpeg-ffprobe-static";
import Ffmpeg from "fluent-ffmpeg";
import path from "path";

interface VideoMetadata {
  width: number,
  height: number,
  numOfFrame: number,
  durationInSec: number,
}

export default class VideoProcessor {
  filename: string;
  processor: Ffmpeg.FfmpegCommand;

  constructor(filename: string) {
    this.processor = Ffmpeg(filename);
    console.log(ffmpegPath, ffprobePath);
    this.processor = this.processor.setFfmpegPath(ffmpegPath as string);
    this.processor = this.processor.setFfprobePath(ffprobePath as string);
    this.filename = filename;
  }

  static read(filename: string) {
    return new VideoProcessor(filename);
  }

  getMetadata() {
    const self = this;
    return new Promise<VideoMetadata>(function (resolve, reject) {
      self.processor
        .ffprobe(function (err, data) {
        if (err) {
          reject(err);
          return;
        }

        const [videoStream] = data.streams;
        console.log(videoStream);
        if (videoStream.width === undefined ||
          videoStream.height === undefined ||
          videoStream.nb_frames === undefined ||
          videoStream.duration === undefined
        ) {
          reject("Video doesn't seem like have width and height");
          return;
        }

        resolve({
          width: videoStream.width,
          height: videoStream.height,
          numOfFrame: +videoStream.nb_frames,
          durationInSec: +videoStream.duration,
        });
      });
    });
  }

  takeMosaicScreenshot(): Promise<boolean> {
    const self = this;
    return new Promise((resolve, reject) => {
      self.processor
        .on('end', function () {
          resolve(true);
        })
        .on('error', function (err) {
          reject(err);
        })
        .on('start', function (commandLine) {
          console.log('Ffmpeg with command: ' + commandLine);
        })
        .output(path.join(__dirname, "../../screenshots/test.jpg"))
        .addOutputOptions(
          "-frames", '1',
          "-q:v", '1',
          "-vf", 'select=not(mod(n\\,10)),scale=160:120,tile=4x3'
        )
        .run();
    })

  }
}
