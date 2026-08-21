import { PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getR2Client } from "./r2Client.js";
import { getR2Config, getSignedUrlDefaultExpiry, isR2Configured } from "./config.js";

export const DocumentStorageService = {
  isConfigured() {
    return isR2Configured();
  },

  async upload({ key, body, contentType = "application/pdf", metadata = {} }) {
    const client = getR2Client();
    if (!client) throw new Error("R2 storage is not configured");
    const { bucketName } = getR2Config();

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: body,
      ContentType: contentType,
      Metadata: metadata,
    });

    const result = await client.send(command);
    return {
      bucket: bucketName,
      key,
      contentType,
      etag: result.ETag || null,
      size: Buffer.isBuffer(body) ? body.length : null,
    };
  },

  async download(key) {
    const client = getR2Client();
    if (!client) throw new Error("R2 storage is not configured");
    const { bucketName } = getR2Config();

    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    const result = await client.send(command);
    const chunks = [];
    for await (const chunk of result.Body) {
      chunks.push(Buffer.from(chunk));
    }
    return Buffer.concat(chunks);
  },

  async delete(key) {
    const client = getR2Client();
    if (!client) throw new Error("R2 storage is not configured");
    const { bucketName } = getR2Config();

    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    await client.send(command);
  },

  async exists(key) {
    const client = getR2Client();
    if (!client) throw new Error("R2 storage is not configured");
    const { bucketName } = getR2Config();

    try {
      const command = new HeadObjectCommand({
        Bucket: bucketName,
        Key: key,
      });
      await client.send(command);
      return true;
    } catch (err) {
      if (err?.name === "NotFound" || err?.$metadata?.httpStatusCode === 404) return false;
      throw err;
    }
  },

  async getSignedDownloadUrl(key, expiresIn) {
    const client = getR2Client();
    if (!client) throw new Error("R2 storage is not configured");
    const { bucketName } = getR2Config();
    const expiry = expiresIn || getSignedUrlDefaultExpiry();

    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    const url = await getSignedUrl(client, command, { expiresIn: expiry });
    return { url, expiresIn: expiry };
  },

  async getSignedUploadUrl(key, contentType, expiresIn) {
    const client = getR2Client();
    if (!client) throw new Error("R2 storage is not configured");
    const { bucketName } = getR2Config();
    const expiry = expiresIn || getSignedUrlDefaultExpiry();

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      ContentType: contentType,
    });

    const url = await getSignedUrl(client, command, { expiresIn: expiry });
    return { url, expiresIn: expiry, key };
  },
};

export default DocumentStorageService;
