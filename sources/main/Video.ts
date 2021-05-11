import VideoProcessor from "./VideoProcessor";
import path from "path";

export interface Metadata {
  width: number,
  height: number,
  numOfFrame: number,
  durationInSec: number,
}

const defaultMosaicScreenshotOptions = {
  tile: {
    x: 6,
    y: 6,
  },
  scale: {
    width: 480,
    height: -1, // Keep aspect ratio height based on provided width
  }
}

export default class Video {
  processor: VideoProcessor;
  metadata: Metadata;

  constructor(processor: VideoProcessor) {
    this.processor = processor;
  }

  async readMetadata() {
    if (!this.metadata) {
      this.metadata = await this.processor.getMetadata();
    }
  }

  async takeMosaicScreenshot(outputFilename: string) : Promise<string> {
    const { tile, scale } = defaultMosaicScreenshotOptions;
    const tileArea = tile.x * tile.y;

    await this.readMetadata();
    if (tileArea >= this.metadata.durationInSec) {
      throw new Error("Video number of frame less than the default options.");
    }
    const everyNSec = Math.floor(this.metadata.durationInSec / tileArea);
    const output = path.join(__dirname, `../../screenshots/${outputFilename}.jpg`);

    return this.processor.takeMosaicScreenshot(output, everyNSec, scale, tile);
  }
}
