import express from 'express';
const app = express();

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'CricClash minimal API is running' });
});

export default app;
