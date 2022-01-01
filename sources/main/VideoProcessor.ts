import { ffmpegPath, ffprobePath } from 'ffmpeg-ffprobe-static';
import Ffmpeg, { FfmpegCommand } from 'fluent-ffmpeg';
import { Metadata } from './Video';

type MosaicScreenshotTile = {
  x: number;
  y: number;
};

type MosaicScreenshotScale = {
  width: number;
  height: number;
};

export default class VideoProcessor {
  filename: string;
  processor: Ffmpeg.FfmpegCommand;

  constructor(filename?: string) {
    if (filename) {
      this.processor = Ffmpeg(filename);
      this.processor = this.processor.setFfmpegPath(ffmpegPath as string);
      this.processor = this.processor.setFfprobePath(ffprobePath as string);
      this.filename = filename;
    }
  }

  static input(filename: string) {
    return new VideoProcessor(filename);
  }

  getMetadata() {
    const processor = this.getProcessorThrowErrorIfNoInputFile();
    return new Promise<Metadata>(function (resolve, reject) {
      processor.ffprobe(function (err, data) {
        if (err) {
          reject(err);
          return;
        }

        const [videoStream] = data.streams;

        if (
          videoStream.width === undefined ||
          videoStream.height === undefined
        ) {
          reject("Video doesn't seem like have width and height");
          return;
        }

        if (
          videoStream.duration !== undefined &&
          +videoStream.duration >= 0 &&
          videoStream.nb_frames !== undefined &&
          +videoStream.nb_frames >= 0
        ) {
          resolve({
            width: videoStream.width,
            height: videoStream.height,
            numOfFrame: +videoStream.nb_frames,
            durationInSec: +videoStream.duration,
          });
        }

        // NOTE: Take number of frames and duration from 'tags' for .mkv video file
        if (videoStream.duration === 'N/A' || videoStream.nb_frames === 'N/A') {
          if (!videoStream.tags) {
            reject('No duration or number of frames in metadata tags');
            return;
          }

          if (
            'NUMBER_OF_FRAMES' in videoStream.tags &&
            typeof videoStream.tags.NUMBER_OF_FRAMES === 'string'
          ) {
            videoStream.nb_frames = videoStream.tags.NUMBER_OF_FRAMES;
          }

          if (
            'DURATION' in videoStream.tags &&
            typeof videoStream.tags.DURATION === 'string'
          ) {
            const hmsParts = videoStream.tags.DURATION.split(':');
            videoStream.duration = (
              +hmsParts[0] * 60 * 60 +
              +hmsParts[1] * 60 +
              +hmsParts[2]
            ).toString();
          }
        }

        if (
          videoStream.nb_frames === undefined ||
          videoStream.duration === undefined
        ) {
          reject('No duration or number of frames in metadata tags');
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

  takeMosaicScreenshot(
    output: string,
    everyNSec: number,
    scale: MosaicScreenshotScale,
    tile: MosaicScreenshotTile
  ): Promise<string> {
    const processor = this.getProcessorThrowErrorIfNoInputFile();
    const filters = [
      `select=(isnan(prev_selected_t)+gte(t-prev_selected_t\\,${everyNSec}))*gte(t\\,${everyNSec})`,
      `scale=${scale.width}:${scale.height}`,
      "drawtext=text='timestamp: %{pts\\:gmtime\\:0\\:%H\\\\\\:%M\\\\\\:%S}':x=(w-text_w-8):y=(h-text_h-8):borderw=5:alpha=0.6:fontcolor=white:fontsize=32",
      `tile=${tile.x}x${tile.y}`,
    ];

    return new Promise((resolve, reject) => {
      processor
        .on('end', function () {
          console.log('Taken screenshot: ' + output);
          resolve(output);
        })
        .on('error', function (err) {
          reject(err);
        })
        .on('start', function (commandLine) {
          console.log('Ffmpeg with command: ' + commandLine);
        })
        .output(output)
        .addOutputOptions('-frames', '1', '-q:v', '1', '-vf', filters.join(','))
        .run();
    });
  }

  private getProcessorThrowErrorIfNoInputFile(): FfmpegCommand | never {
    if (!this.processor) {
      throw new Error('No input file.');
    }

    return this.processor;
  }
}
