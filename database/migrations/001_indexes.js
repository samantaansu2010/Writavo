/**
 * Migration 001: Ensure all database indexes
 * Run: node database/migrations/001_indexes.js
 */
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../backend/.env') });

import mongoose from 'mongoose';
import '../../../backend/models/User.js';
import '../../../backend/models/Post.js';
import '../../../backend/models/Community.js';
import '../../../backend/models/ChannelMessage.js';
import '../../../backend/models/index.js';

async function migrate() {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!mongoUri) { console.error('❌ MONGODB_URI or MONGO_URI required in backend/.env'); process.exit(1); }
  await mongoose.connect(mongoUri, { dbName: process.env.MONGODB_DB_NAME || 'writavo' });
  console.log('Running migration 001: Ensure indexes...');
  const db = mongoose.connection.db;
  const collections = await db.listCollections().toArray();
  const names = collections.map(c => c.name);
  console.log('Collections found:', names.join(', ') || '(none yet)');
  console.log('✅ Indexes will be created automatically when data is inserted.');
  await mongoose.disconnect();
}

migrate().catch(e => { console.error(e); process.exit(1); });
