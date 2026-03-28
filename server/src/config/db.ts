import mongoose from 'mongoose';

const connectDB = async (): Promise<void> => {
  const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/cricclash';

  try {
    await mongoose.connect(mongoURI);
    console.log(`✅ MongoDB Connected: ${mongoose.connection.host}`);
  } catch (error) {
    // Log the error but DON'T crash — server stays up so health/admin routes work
    console.error('❌ MongoDB connection failed:', error);
    console.error('⚠️  Check your MONGO_URI in server/.env');
    console.warn('🔄  Retrying in 10 seconds...');

    // Retry once after 10 seconds
    setTimeout(async () => {
      try {
        await mongoose.connect(mongoURI);
        console.log(`✅ MongoDB Reconnected: ${mongoose.connection.host}`);
      } catch (retryErr) {
        console.error('❌ MongoDB retry failed:', (retryErr as Error).message);
        console.error('🚨  Running without database — DB routes will fail. Fix MONGO_URI and restart.');
      }
    }, 10_000);
  }
};

export default connectDB;
