import { ffmpegPath, ffprobePath } from "ffmpeg-ffprobe-static";
import Ffmpeg from "fluent-ffmpeg";

Ffmpeg.setFfmpegPath(ffmpegPath as string);
Ffmpeg.setFfprobePath(ffprobePath as string);

interface VideoMetadata {
  width: number,
  height: number,
}

class VideoMetadataReader {
  public read(filename: string): Promise<VideoMetadata> {
    return new Promise(function (resolve, reject) {
      Ffmpeg.ffprobe(filename, function (err, data) {
        if (err) {
          reject(err);
          return;
        }

        const [videoStream] = data.streams;

        if (videoStream.width === undefined || videoStream.height === undefined) {
          reject("Video doesn't seem like have width and height");
          return;
        }

        resolve({ width: videoStream.width, height: videoStream.height });
      });
    });
  }
}

export default new VideoMetadataReader;
