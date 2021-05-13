# file-manager-tool

## Terms and definitions
- Mosaic of screenshots

## References
- https://medium.com/@kitze/%EF%B8%8F-from-react-to-an-electron-app-ready-for-production-a0468ecb1da3

## Notes
- NO_UPDATE_NOTIFIER=1 surpress error=TypeError: update_notifier_1.default is not a function
```
"postinstall": "NO_UPDATE_NOTIFIER=1 electron-builder install-app-deps"
```
- Error: ffmpeg exited with code 1: av_interleaved_write_frame(): Input/output error
```
.output(path.join(__dirname, "../../screenshots/test.jpg")); // Must be absolute path in order to solve this error
because default ffmpeg doesn't know the current working directory
Ffmpeg({cwd: __dirname}); // I think should also solve this error

- await doesn't work in map, forEach
https://medium.com/@patarkf/synchronize-your-asynchronous-code-using-javascripts-async-await-5f3fa5b1366d

- Fixed development, app data is 'Electron' instead of my app name
https://github.com/electron/electron/issues/3391
```

## TODO
- Production build
