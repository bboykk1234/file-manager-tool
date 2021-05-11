import * as Cloudinary from "cloudinary";

Cloudinary.v2.config({
  cloud_name: 'bboykk1234',
  api_key: '288521624786666',
  api_secret: 'g6MTrFY5m0C2zteyAadoIAaFqMM',
});

const { uploader, url } = Cloudinary.v2;

export default class CloudImageStorage {
  static upload(from: string, to: string): Promise<Cloudinary.UploadApiResponse> {
    return new Promise((resolve, reject) => {
      uploader.upload(from, {
        type: "authenticated",
        public_id: to,
      },
        (err, result) => {
          if (err) {
            reject(err);
            return;
          }

          if (result) {
            resolve(result);
            return;
          }

          reject("Something went wrong!!");
        });
    });
  }

  static imageUrl(source: string, version: number) {
    return url(source, {
      sign_url: true,
      secure: true,
      version,
      type: "authenticated",
    });
  }
}
