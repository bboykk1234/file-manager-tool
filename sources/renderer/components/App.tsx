import React from "react";
import { ipcRenderer } from "electron";
import { IpcRendererEvent } from "electron/main";

export default class App extends React.Component<{}, {}> {
  constructor(props: {}) {
    super(props);
    this.handleFolderSelection = this.handleFolderSelection.bind(this);
    this.handleFinishedReadFilesMetadata = this.handleFinishedReadFilesMetadata.bind(this);
  }

  componentWillUnmount() {
    ipcRenderer.removeListener('read-files-metadata-chunk-finished', this.handleFinishedReadFilesMetadata);
  }

  componentDidMount() {
    ipcRenderer.on('read-files-metadata-chunk-finished', (event: IpcRendererEvent, data: any) => {
      console.log(data);
    });
  }

  handleFolderSelection(e: React.BaseSyntheticEvent) {
    console.log(e.target.files);
  }

  listenFinishedReadFilesMetadata() {
    ipcRenderer.send("read-files-metadata");
  }

  handleFinishedReadFilesMetadata(data: any) {
    console.log(data);
  }

  render() {
    return (
      <>
        <input
          type="file"
          name="folder-selector"
          id="folder-selector"
          onChange={this.handleFolderSelection}
          /* @ts-expect-error */
          directory=""
          webkitdirectory=""
        />
        <input type="button" value="Select folder" onClick={this.listenFinishedReadFilesMetadata} />
      </>
    );
  }
}
