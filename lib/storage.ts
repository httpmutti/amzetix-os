import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { writeFile, mkdir, readFile, unlink } from "fs/promises";
import path from "path";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

function sanitizeAwsKey(key?: string): string | undefined {
  if (!key) return undefined;
  const trimmed = key.trim();
  if (trimmed.length === 40 && trimmed.slice(0, 20) === trimmed.slice(20)) {
    return trimmed.slice(0, 20);
  }
  return trimmed;
}

let _s3Client: S3Client | null = null;

export function getS3Client(): S3Client {
  if (_s3Client) return _s3Client;

  const region = (process.env.AWS_S3_REGION || process.env.AWS_SES_REGION || "eu-north-1").trim();
  const accessKeyId = sanitizeAwsKey(process.env.AWS_S3_ACCESS_KEY_ID || process.env.AWS_SES_ACCESS_KEY_ID);
  const secretAccessKey = (process.env.AWS_S3_SECRET_ACCESS_KEY || process.env.AWS_SES_SECRET_ACCESS_KEY)?.trim();
  const endpoint = process.env.AWS_S3_ENDPOINT?.trim() || undefined;

  _s3Client = new S3Client({
    region,
    credentials:
      accessKeyId && secretAccessKey
        ? { accessKeyId, secretAccessKey }
        : undefined,
    ...(endpoint ? { endpoint, forcePathStyle: true } : {}),
  });

  return _s3Client;
}

export function isS3Configured(): boolean {
  const provider = (process.env.STORAGE_PROVIDER ?? "local").toLowerCase().trim();
  const bucket = process.env.AWS_S3_BUCKET?.trim();
  return provider === "s3" && !!bucket;
}

export interface UploadResult {
  fileUrl: string; // "s3://bucket/key" or "/uploads/filename"
  key: string;
}

/**
 * Upload a file either to AWS S3 or Local Disk depending on STORAGE_PROVIDER
 */
export async function uploadFile(
  buffer: Buffer,
  fileName: string,
  contentType?: string
): Promise<UploadResult> {
  const ext = path.extname(fileName);
  const baseName = path.basename(fileName, ext).replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 60);
  const uniqueKey = `documents/${Date.now()}_${baseName}${ext}`;

  if (isS3Configured()) {
    const bucket = process.env.AWS_S3_BUCKET!.trim();
    const s3 = getS3Client();

    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: uniqueKey,
        Body: buffer,
        ContentType: contentType || "application/octet-stream",
      })
    );

    return {
      fileUrl: `s3://${bucket}/${uniqueKey}`,
      key: uniqueKey,
    };
  }

  // Fallback: Local Storage
  const localFileName = `${Date.now()}_${baseName}${ext}`;
  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(path.join(UPLOAD_DIR, localFileName), buffer);

  return {
    fileUrl: `/uploads/${localFileName}`,
    key: localFileName,
  };
}

/**
 * Retrieve a file buffer from S3 or Local Disk
 */
export async function getFileBuffer(fileUrl: string): Promise<Buffer> {
  if (fileUrl.startsWith("s3://")) {
    const withoutPrefix = fileUrl.replace("s3://", "");
    const firstSlashIndex = withoutPrefix.indexOf("/");
    const bucket = withoutPrefix.slice(0, firstSlashIndex);
    const key = withoutPrefix.slice(firstSlashIndex + 1);

    const s3 = getS3Client();
    const response = await s3.send(
      new GetObjectCommand({
        Bucket: bucket,
        Key: key,
      })
    );

    const byteArray = await response.Body?.transformToByteArray();
    if (!byteArray) throw new Error("Empty response from S3");
    return Buffer.from(byteArray);
  }

  // Local storage
  const filePath = path.join(process.cwd(), "public", fileUrl.startsWith("/") ? fileUrl.slice(1) : fileUrl);
  return await readFile(filePath);
}

/**
 * Generate a pre-signed temporary download URL (valid for 1 hour) for S3 files
 */
export async function getDownloadUrl(fileUrl: string, originalFileName?: string): Promise<string> {
  if (fileUrl.startsWith("s3://")) {
    const withoutPrefix = fileUrl.replace("s3://", "");
    const firstSlashIndex = withoutPrefix.indexOf("/");
    const bucket = withoutPrefix.slice(0, firstSlashIndex);
    const key = withoutPrefix.slice(firstSlashIndex + 1);

    const s3 = getS3Client();
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
      ResponseContentDisposition: originalFileName
        ? `attachment; filename="${encodeURIComponent(originalFileName)}"`
        : undefined,
    });

    return await getSignedUrl(s3, command, { expiresIn: 3600 });
  }

  return fileUrl;
}

/**
 * Delete a file from S3 or Local Disk
 */
export async function deleteStorageFile(fileUrl: string): Promise<void> {
  try {
    if (fileUrl.startsWith("s3://")) {
      const withoutPrefix = fileUrl.replace("s3://", "");
      const firstSlashIndex = withoutPrefix.indexOf("/");
      const bucket = withoutPrefix.slice(0, firstSlashIndex);
      const key = withoutPrefix.slice(firstSlashIndex + 1);

      const s3 = getS3Client();
      await s3.send(
        new DeleteObjectCommand({
          Bucket: bucket,
          Key: key,
        })
      );
      return;
    }

    const filePath = path.join(process.cwd(), "public", fileUrl.startsWith("/") ? fileUrl.slice(1) : fileUrl);
    await unlink(filePath);
  } catch (err) {
    console.warn("[storage] Delete failed or file not found:", err);
  }
}
