"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatIST = exports.generateShortId = exports.sendError = exports.sendPaginated = exports.sendSuccess = void 0;
/** Send a 200 success response */
const sendSuccess = (res, data, message = 'Success', statusCode = 200) => res.status(statusCode).json({ success: true, message, data });
exports.sendSuccess = sendSuccess;
/** Send a paginated success response */
const sendPaginated = (res, data, total, page, limit, message = 'Success') => res.status(200).json({ success: true, message, data, total, page, limit });
exports.sendPaginated = sendPaginated;
/** Send an error response */
const sendError = (res, message = 'Something went wrong', statusCode = 500) => res.status(statusCode).json({ success: false, message });
exports.sendError = sendError;
/** Generate a random short ID for challenge links e.g. "abc123" */
const generateShortId = (length = 6) => {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};
exports.generateShortId = generateShortId;
/** Format a date to IST */
const formatIST = (date) => new Date(date).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
exports.formatIST = formatIST;
