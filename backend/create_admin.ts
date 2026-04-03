import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from './src/models/User';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/cricclash';

mongoose.connect(MONGO_URI)
  .then(async () => {
    try {
      const email = 'admin4617@gmail.com';
      const password = 'admin@4627';
      const username = 'admin4617';

      const hashedPassword = await bcrypt.hash(password, 10);
      const existing = await User.findOne({ email });

      if (existing) {
        existing.password = hashedPassword;
        existing.isAdmin = true;
        await existing.save();
        console.log(`Admin user ${email} updated successfully.`);
      } else {
        await User.create({
          username,
          email,
          password: hashedPassword,
          isAdmin: true,
        });
        console.log(`Admin user ${email} created successfully.`);
      }
      process.exit(0);
    } catch (err) {
      console.error(err);
      process.exit(1);
    }
  })
  .catch(err => {
    console.error('Failed to connect to MongoDB', err);
    process.exit(1);
  });
