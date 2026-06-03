import axios, { AxiosRequestConfig } from "axios";
import https from "https";
import FormData from "form-data";
import type { UploaderResponse, FileUploadRequest } from "../types/uploader.types";
import type { Response } from "express";

export type UploadType = "image" | "document";

const httpsAgent = new https.Agent({ rejectUnauthorized: false, keepAlive: true });

const baseUrl = () => (process.env.UPLOADER_SERVER_API || "http://localhost:4000").replace(/\/$/, "");
const apiKey = () => process.env.QB_SCAFFOLDER_KEY || "";
const keyspace = () => process.env._KEYSPACE || "";
const userId = () => process.env._USER_ID || "";

function handleAxiosError(err: any): never {
  if (err.code === "ECONNABORTED") throw new Error("Upload service timed out. Please try again.");
  if (err.code === "ECONNREFUSED" || err.code === "ENOTFOUND")
    throw new Error("Upload service is unreachable. Please try again later.");
  throw new Error(err.response?.data?.message || err.message || "Upload failed");
}

export async function uploadFile(
  req: FileUploadRequest,
): Promise<UploaderResponse<any>> {
  const url = `${baseUrl()}/files`;

  const form = new FormData();
  form.append("keyspace", keyspace());
  form.append("user_id", userId());
  if (req.file?.buffer) {
    form.append("file", req.file.buffer, {
      filename: req.file.filename || req.file.fieldname || "upload",
      contentType: req.file.mimetype || "application/octet-stream",
    });
  }

  const cfg: AxiosRequestConfig = {
    method: "POST",
    url,
    timeout: 120_000,
    headers: { "x-api-key": apiKey(), ...form.getHeaders(), "Content-Length": form.getLengthSync() },
    data: form,
    maxBodyLength: Infinity,
    maxContentLength: Infinity,
    httpsAgent,
  };

  try {
    const res = await axios(cfg);
    const { file_id, url: fileUrl, size, mimeType } = res.data.result;
    return {
      statusCode: 201,
      message: "Uploaded successfully",
      data: {
        url: fileUrl,
        path: file_id,
        originalname: req.file?.filename || req.file?.fieldname || "upload",
        size,
        mimeType,
      },
    };
  } catch (err: any) {
    handleAxiosError(err);
  }
}

export async function deleteFile(req: FileUploadRequest): Promise<UploaderResponse<any>> {
  if (!req.filename) throw new Error("Filename is required for delete");

  const url = `${baseUrl()}/files/${encodeURIComponent(req.filename)}?keyspace=${encodeURIComponent(keyspace())}&user_id=${encodeURIComponent(userId())}`;

  try {
    const res = await axios({ method: "DELETE", url, timeout: 60_000, headers: { "x-api-key": apiKey() }, httpsAgent });
    return { statusCode: res.status, message: "Deleted successfully", data: res.data };
  } catch (err: any) {
    handleAxiosError(err);
  }
}

export async function getFile(imageUrl: string, res: Response): Promise<void> {
  const url = `${baseUrl()}/public/${encodeURIComponent(keyspace())}/${encodeURIComponent(userId())}/${imageUrl}`;

  try {
    const response = await axios({
      method: "GET", url, timeout: 120_000, responseType: "stream",
      maxBodyLength: Infinity, maxContentLength: Infinity, httpsAgent,
    });
    const contentType = response.headers["content-type"] || "application/octet-stream";
    res.header("Content-Type", contentType);
    res.type(contentType.split(";")[0]);
    response.data.pipe(res);
  } catch (err: any) {
    handleAxiosError(err);
  }
}
