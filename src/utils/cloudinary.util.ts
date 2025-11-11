// Cloudinary Utility for Image Uploads

import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import { Readable } from 'stream';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '',
  api_key: process.env.CLOUDINARY_API_KEY || '',
  api_secret: process.env.CLOUDINARY_API_SECRET || '',
});

export interface UploadResult {
  public_id: string;
  secure_url: string;
  url: string;
  width: number;
  height: number;
  format: string;
  resource_type: string;
}

/**
 * Upload image to Cloudinary
 * @param file - File buffer or path
 * @param folder - Optional folder name in Cloudinary
 * @returns Upload result with secure URL
 */

export const uploadImage = async (
  file: Buffer | string,
  folder: string = 'ecommerce-products'
): Promise<UploadResult> => {
  return new Promise((resolve, reject) => {
    const uploadOptions = {
      folder,
      resource_type: 'image' as const,
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
      transformation: [
        { width: 800, height: 800, crop: 'limit' },
        { quality: 'auto' },
        { fetch_format: 'auto' },
      ],
    };

    if (Buffer.isBuffer(file)) {
      // Upload from buffer
      const uploadStream = cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
        if (error) {
          reject(error);
        } else if (result) {
          resolve({
            public_id: result.public_id,
            secure_url: result.secure_url,
            url: result.url,
            width: result.width,
            height: result.height,
            format: result.format,
            resource_type: result.resource_type,
          });
        } else {
          reject(new Error('Upload failed: No result returned'));
        }
      });

      const readableStream = new Readable();
      readableStream.push(file);
      readableStream.push(null);
      readableStream.on('error', error => {
        reject(error);
      });
      // Pipe operation is synchronous, errors handled via callbacks
      void readableStream.pipe(uploadStream);
    } else {
      // Upload from file path
      cloudinary.uploader.upload(file, uploadOptions, (error, result) => {
        if (error) {
          reject(error);
        } else if (result) {
          resolve({
            public_id: result.public_id,
            secure_url: result.secure_url,
            url: result.url,
            width: result.width,
            height: result.height,
            format: result.format,
            resource_type: result.resource_type,
          });
        } else {
          reject(new Error('Upload failed: No result returned'));
        }
      });
    }
  });
};

/**
 * Delete image from Cloudinary
 * @param publicId - Public ID of the image
 */
export const deleteImage = async (publicId: string): Promise<void> => {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Error deleting image from Cloudinary:', error);
    throw error;
  }
};

/**
 * Extract public ID from Cloudinary URL
 */
export const extractPublicIdFromUrl = (url: string): string | null => {
  try {
    const parts = url.split('/');
    const filename = parts[parts.length - 1];
    const publicId = filename.split('.')[0];
    return publicId;
  } catch (error) {
    return null;
  }
};

export default cloudinary;
