/**
 * Writavo Database Seeder
 * Run: node database/seeders/seed.js
 * Creates sample users, posts, communities for development
 */
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../backend/.env') });

import mongoose from 'mongoose';
import User from '../../backend/models/User.js';
import Post from '../../backend/models/Post.js';
import Community from '../../backend/models/Community.js';
import { Follow, Like } from '../../backend/models/index.js';

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;
if (!MONGO_URI) { console.error('❌ MONGODB_URI or MONGO_URI not set in backend/.env'); process.exit(1); }

const sampleUsers = [
  { firstName:'Alice', lastName:'Chen', username:'alicechen', email:'alice@demo.com', password:'Demo1234!', bio:'Tech writer & AI researcher. Writing about the future.', userType:'Writer / Blogger', interests:['Technology','AI','Science'], role:'admin' },
  { firstName:'Marcus', lastName:'Rivera', username:'marcusrivera', email:'marcus@demo.com', password:'Demo1234!', bio:'Photographer and visual storyteller based in NYC.', userType:'Photographer', interests:['Art','Photography','Travel'] },
  { firstName:'Priya', lastName:'Patel', username:'priyapatel', email:'priya@demo.com', password:'Demo1234!', bio:'Full-stack developer. Writing about web & open source.', userType:'Developer', interests:['Technology','Programming','Education'] },
  { firstName:'Jordan', lastName:'Kim', username:'jordankim', email:'jordan@demo.com', password:'Demo1234!', bio:'Designer crafting beautiful interfaces. Design thinking enthusiast.', userType:'Designer / Artist', interests:['Art','Design','Business'] },
  { firstName:'Sam', lastName:'Torres', username:'samtorres', email:'sam@demo.com', password:'Demo1234!', bio:'Student exploring the intersection of science and writing.', userType:'Student', interests:['Science','Writing','Health'] },
];

const samplePosts = [
  { title:'The Future of AI-Assisted Writing', subtitle:'How language models are changing the way we create content', body:`<h2>Introduction</h2><p>Artificial intelligence is fundamentally changing how we approach writing. From simple autocomplete to full paragraph generation, AI tools are becoming indispensable in the modern writer's toolkit.</p><h2>What's Changing</h2><p>The most significant shift isn't that AI writes for us—it's that AI helps us write <em>better</em>. Think of it as having a tireless editor available at any hour.</p><blockquote>The best writers will be those who learn to collaborate with AI, not those who resist it.</blockquote><h2>Practical Applications</h2><p>Today, writers use AI for brainstorming, overcoming writer's block, checking for logical consistency, and improving clarity. These are tasks that previously required other humans.</p><p>The future isn't man versus machine—it's man <strong>with</strong> machine, creating things neither could alone.</p>`, tags:['AI','Writing','Technology','Future'], category:'Technology', status:'published' },
  { title:'Why Every Developer Should Learn Design', subtitle:'The hidden skill that separates good engineers from great ones', body:`<h2>The Gap Nobody Talks About</h2><p>There's a persistent myth in tech: designers design, developers develop. These roles are separate. But the most impactful engineers I've met all had strong design intuitions.</p><h2>Design Thinking, Not Photoshop Skills</h2><p>Learning design doesn't mean learning Figma. It means understanding user needs, visual hierarchy, and the emotional response that UI decisions create.</p><pre>// Bad: Technically correct but unusable
function handleError(e) { throw e; }

// Good: Designed for the human using it  
function handleError(e) {
  showToast(e.message, 'error');
  logToSentry(e);
}</pre><p>Notice how the second version considers the experience of the person encountering the error.</p><h2>Start Here</h2><p>Read <em>The Design of Everyday Things</em> by Don Norman. It will permanently change how you see the world.</p>`, tags:['Development','Design','Career','Programming'], category:'Technology', status:'published' },
  { title:'Morning Light: A Year of Landscape Photography', subtitle:'What 365 sunrises taught me about patience and seeing', body:`<h2>Day One</h2><p>I didn't plan to photograph every sunrise for a year. It started with a single sleepless night in November, a camera I barely knew how to use, and a hill behind my apartment.</p><p>The light that morning was unlike anything I'd seen. Not because it was spectacular—it was actually quite grey—but because I was <em>present</em> in a way I hadn't been in years.</p><h2>What I Learned</h2><p>Photography teaches you to see. Not to look—everyone looks—but to truly <strong>see</strong>. The difference between a mediocre shot and a great one is rarely technical. It's about noticing what's actually there.</p><blockquote>Light doesn't change the world. Light reveals it.</blockquote><p>By month three, I started seeing light everywhere. At my desk. In restaurants. The way afternoon sun cut across my kitchen floor became endlessly fascinating.</p>`, tags:['Photography','Art','Nature','Creativity'], category:'Art', status:'published' },
  { title:'How I Built a $0 Startup in 30 Days', subtitle:'Bootstrapping with free tools, free hosting, and zero budget', body:`<h2>The Constraints Were the Point</h2><p>Constraints force creativity. When I decided to build a side project with absolutely zero budget, I discovered an entire ecosystem of free tools I'd never explored.</p><h2>The Stack</h2><p>Frontend: Vanilla HTML/CSS/JS — zero build tools, zero complexity. Backend: Railway.app free tier. Database: MongoDB Atlas free tier (512MB, more than enough to start). Email: Resend free tier (100 emails/day). Images: Cloudinary free tier.</p><p>Total monthly cost: <strong>$0.00</strong>.</p><h2>The Lesson</h2><p>Most developers overbuild. We reach for React when vanilla JS works. We set up Kubernetes when a single server is fine. The $0 constraint forced me to strip everything to its essence—and the result was actually faster and more maintainable.</p>`, tags:['Startup','Business','Programming','Money'], category:'Business', status:'published' },
  { title:'The Neuroscience of Deep Work', subtitle:'Why your brain needs boredom to do its best thinking', body:`<h2>The Default Mode Network</h2><p>When your brain isn't actively focused on a task, it doesn't go idle. It activates what neuroscientists call the Default Mode Network—a system involved in self-reflection, future planning, and creative synthesis.</p><p>This is where your best ideas come from. Not from staring at a screen.</p><h2>The Problem with Constant Stimulation</h2><p>Every notification, every quick phone check, every "I'll just scroll for a minute"—these interrupt the DMN. They train your brain to be a context-switching machine, not a deep thinker.</p><blockquote>Boredom is not the absence of stimulation. It's the presence of potential.</blockquote><h2>Practical Steps</h2><p>Schedule two 90-minute blocks of truly disconnected work each day. No phone, no browser tabs, no music with lyrics. Just you, the problem, and time. The discomfort you feel in the first few minutes is your brain recalibrating. Push through it.</p>`, tags:['Science','Health','Productivity','Brain'], category:'Science', status:'published' },
];

const sampleCommunities = [
  { name:'The Writers Room', description:'A space for writers of all kinds. Share drafts, give feedback, discuss craft.', shortDesc:'For writers who take writing seriously.', category:'Writing', tags:['writing','craft','fiction','essays'], color:'#c8622a' },
  { name:'Tech & Code', description:'Developers, engineers, and tech enthusiasts discussing the latest in software.', shortDesc:'Where code meets conversation.', category:'Technology', tags:['programming','software','ai','web'], color:'#2d5a9e' },
  { name:'Visual Creators', description:'Photographers, designers, illustrators — share your visual work and get feedback.', shortDesc:'For the visually inclined.', category:'Art', tags:['photography','design','illustration','visual'], color:'#2d7a4a' },
];

async function seed() {
  console.log('🌱 Connecting to database...');
  await mongoose.connect(MONGO_URI, { dbName: process.env.MONGODB_DB_NAME || 'writavo' });
  console.log('✅ Connected');

  // Clear existing data
  await Promise.all([User.deleteMany({}), Post.deleteMany({}), Community.deleteMany({}), Follow.deleteMany({}), Like.deleteMany({})]);
  console.log('🧹 Cleared existing data');

  // Create users
  const users = await User.create(sampleUsers);
  console.log(`👥 Created ${users.length} users`);

  // Make admin
  await User.findByIdAndUpdate(users[0]._id, { emailVerified: true, role: 'admin' });
  for (const u of users) await User.findByIdAndUpdate(u._id, { emailVerified: true });

  // Create posts
  const posts = await Promise.all(samplePosts.map((p, i) => Post.create({ ...p, author: users[i % users.length]._id, publishedAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000) })));
  console.log(`📝 Created ${posts.length} posts`);

  // Create follows
  for (let i = 1; i < users.length; i++) await Follow.create({ follower: users[0]._id, following: users[i]._id });
  await User.findByIdAndUpdate(users[0]._id, { totalFollowing: users.length - 1 });
  for (let i = 1; i < users.length; i++) await User.findByIdAndUpdate(users[i]._id, { totalFollowers: 1 });
  console.log('🤝 Created follows');

  // Create likes
  for (const post of posts.slice(0,3)) await Like.create({ user: users[0]._id, target: post._id, targetType: 'Post' });
  console.log('❤️  Created likes');

  // Create communities
  const communities = await Promise.all(sampleCommunities.map(c => Community.create({
    ...c, slug: c.name.toLowerCase().replace(/[^a-z0-9\s]/g,'').replace(/\s+/g,'-') + '-' + Date.now(),
    owner: users[0]._id, admins: [users[0]._id],
    members: [{ user: users[0]._id, role: 'admin' }, { user: users[1]._id, role: 'member' }],
    memberCount: 2,
    channels: [
      { name: 'general', slug: 'general', type: 'text', description: 'General discussion' },
      { name: 'announcements', slug: 'announcements', type: 'announcements', description: 'Important announcements' },
    ],
  })));
  console.log(`🏘️  Created ${communities.length} communities`);

  console.log('\n✅ Seed complete!\n');
  console.log('Demo accounts (password: Demo1234!):');
  sampleUsers.forEach(u => console.log(`  ${u.role === 'admin' ? '👑' : '  '} ${u.email} — @${u.username}`));
  console.log('\nRun: npm start — then visit http://localhost:5000\n');
  await mongoose.disconnect();
}

seed().catch(e => { console.error('❌ Seed failed:', e.message); process.exit(1); });
