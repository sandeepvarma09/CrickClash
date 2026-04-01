import { Response } from 'express';

/** Send a 200 success response */
export const sendSuccess = <T>(
  res: Response,
  data: T,
  message = 'Success',
  statusCode = 200
): Response =>
  res.status(statusCode).json({ success: true, message, data });

/** Send a paginated success response */
export const sendPaginated = <T>(
  res: Response,
  data: T[],
  total: number,
  page: number,
  limit: number,
  message = 'Success'
): Response =>
  res.status(200).json({ success: true, message, data, total, page, limit });

/** Send an error response */
export const sendError = (
  res: Response,
  message = 'Something went wrong',
  statusCode = 500
): Response =>
  res.status(statusCode).json({ success: false, message });

/** Generate a random short ID for challenge links e.g. "abc123" */
export const generateShortId = (length = 6): string => {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/** Format a date to IST */
export const formatIST = (date: Date | string): string =>
  new Date(date).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
