import { v2 as cloudinary, UploadApiOptions, UploadApiResponse } from "cloudinary";
import { Readable } from "stream";

let configured = false;

function ensureConfigured(): void {
  if (configured) {
    return;
  }
  if (!process.env.CLOUDINARY_URL?.trim()) {
    throw new Error(
      "CLOUDINARY_URL is not set. Add it to your .env (see .env.example)."
    );
  }
  cloudinary.config(true);
  configured = true;
}

function uploadBuffer(
  buffer: Buffer,
  options: UploadApiOptions
): Promise<UploadApiResponse> {
  ensureConfigured();
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      options,
      (err, result) => {
        if (err) {
          reject(err);
          return;
        }
        if (!result) {
          reject(new Error("Cloudinary upload returned no result"));
          return;
        }
        resolve(result);
      }
    );
    Readable.from(buffer).pipe(stream);
  });
}

export type UploadImageOptions = UploadApiOptions & {
  /** Overrides CLOUDINARY_UPLOAD_FOLDER when set on process.env */
  folder?: string;
};

/**
 * Upload an image to Cloudinary. Configure `CLOUDINARY_URL` in the environment
 * (see .env.example). Optional `CLOUDINARY_UPLOAD_FOLDER` defaults folder to `ecommerce`.
 *
 * - `Buffer`: streamed upload (typical for multipart/form-data)
 * - `string` starting with `http://` or `https://`: Cloudinary fetches the remote image
 * - other `string`: treated as base64 or a data URI (`data:image/...;base64,...`)
 */
export async function uploadImage(
  source: Buffer | string,
  options: UploadImageOptions = {}
): Promise<UploadApiResponse> {
  ensureConfigured();

  const envFolder = process.env.CLOUDINARY_UPLOAD_FOLDER;
  const { folder: optionFolder, ...rest } = options;
  const merged: UploadApiOptions = {
    resource_type: "image",
    folder: optionFolder ?? envFolder ?? "ecommerce",
    ...rest,
  };

  if (Buffer.isBuffer(source)) {
    return uploadBuffer(source, merged);
  }

  const trimmed = source.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return cloudinary.uploader.upload(trimmed, merged);
  }

  return cloudinary.uploader.upload(trimmed, merged);
}
