import type { Response } from "express";

export function ok<T>(res: Response, data: T, message?: string): void {
  res.json({ success: true, data, message });
}

export function created<T>(res: Response, data: T, message?: string): void {
  res.status(201).json({ success: true, data, message });
}

export function fail(res: Response, message: string, statusCode = 400): void {
  res.status(statusCode).json({ success: false, message });
}
