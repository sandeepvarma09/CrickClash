const isProduction = import.meta.env.PROD;

export const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (isProduction ? '' : 'http://localhost:5000');

export const APP_URL = import.meta.env.VITE_APP_URL || 
  (isProduction ? 'https://cricclash-v1.vercel.app' : 'http://localhost:3000');
