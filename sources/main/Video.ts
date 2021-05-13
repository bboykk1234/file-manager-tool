import VideoProcessor from "./VideoProcessor";
import path from "path";
import tempy from "tempy";

export interface Metadata {
  width: number,
  height: number,
  numOfFrame: number,
  durationInSec: number,
}

interface ScreenshotOptions {
  customOutput?: string,
  outputExtension: "jpg" | "png"
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

  async takeMosaicScreenshot(options: ScreenshotOptions = { outputExtension: "jpg" }): Promise<string> {
    const { tile, scale } = defaultMosaicScreenshotOptions;
    const tileArea = tile.x * tile.y;

    await this.readMetadata();
    if (tileArea >= this.metadata.durationInSec) {
      throw new Error("Video number of frame less than the default options.");
    }
    const everyNSec = Math.floor(this.metadata.durationInSec / tileArea);
    const { customOutput, outputExtension } = options;
    const output = customOutput
      ? `${customOutput}.${outputExtension}`
      : tempy.file({ extension: outputExtension });

    return this.processor.takeMosaicScreenshot(output, everyNSec, scale, tile);
  }
}
