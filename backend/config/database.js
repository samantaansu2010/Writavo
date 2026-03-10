import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    // Support both MONGODB_URI (standard) and MONGO_URI (Railway)
    const mongoURI = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!mongoURI) throw new Error('MONGODB_URI or MONGO_URI is not defined in environment variables');

    const conn = await mongoose.connect(mongoURI, {
      dbName: process.env.MONGODB_DB_NAME || 'writavo',
      maxPoolSize: 10,
      minPoolSize: 2,
      socketTimeoutMS: 45000,
      serverSelectionTimeoutMS: 10000,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📦 Database: ${conn.connection.db.databaseName}`);
    return conn;
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    process.exit(1);
  }
};

mongoose.connection.on('disconnected', () => console.log('⚠️  MongoDB Disconnected'));
mongoose.connection.on('reconnected',  () => console.log('✅ MongoDB Reconnected'));
mongoose.connection.on('error',        (err) => console.error('❌ MongoDB Error:', err.message));

export default connectDB;
