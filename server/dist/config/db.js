"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
let isConnected = false;
const connectDB = async () => {
    if (isConnected) {
        console.log('✅ MongoDB already connected (cached)');
        return;
    }
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/cricclash';
    try {
        await mongoose_1.default.connect(mongoURI, {
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
        });
        isConnected = true;
        console.log(`✅ MongoDB Connected: ${mongoose_1.default.connection.host}`);
    }
    catch (error) {
        console.error('❌ MongoDB connection failed:', error);
        console.error('⚠️  Check your MONGO_URI in server/.env');
    }
};
exports.default = connectDB;
