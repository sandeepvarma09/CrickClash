import mongoose from 'mongoose';

let isConnected = false;

const connectDB = async (): Promise<void> => {
  if (isConnected) {
    console.log('✅ MongoDB already connected (cached)');
    return;
  }
  
  const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/cricclash';

  try {
    await mongoose.connect(mongoURI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
    });
    isConnected = true;
    console.log(`✅ MongoDB Connected: ${mongoose.connection.host}`);
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    console.error('⚠️  Check your MONGO_URI in server/.env');
  }
};

export default connectDB;
