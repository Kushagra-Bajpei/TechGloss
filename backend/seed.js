import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from './models/User.js';
import Term from './models/Term.js';
import Comment from './models/Comment.js';

dotenv.config();

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB for upgraded seeding...');

    await User.deleteMany({});
    await Term.deleteMany({});
    await Comment.deleteMany({});

    const salt = await bcrypt.genSalt(10);
    const pass = await bcrypt.hash('password123', salt);

    // Users
    const admin = await User.create({ username: 'mod_king', email: 'admin@test.com', password: pass, role: 'moderator', points: 500 });
    const user1 = await User.create({ username: 'code_wizard', email: 'user1@test.com', password: pass, points: 250 });
    const user2 = await User.create({ username: 'js_ninja', email: 'user2@test.com', password: pass, points: 180 });
    const user3 = await User.create({ username: 'ai_guru', email: 'user3@test.com', password: pass, points: 320 });

    // Terms
    const t1 = await Term.create({ name: 'React', definition: 'A JavaScript library for building user interfaces.', example: 'Building a dashboard component.', category: 'Web Dev', author: user1._id, status: 'approved', upvotes: 45 });
    const t2 = await Term.create({ name: 'Docker', definition: 'A platform for developers to develop, ship, and run applications in containers.', example: 'Containerizing a Node.js app.', category: 'DevOps', author: user2._id, status: 'approved', upvotes: 38 });
    const t3 = await Term.create({ name: 'TypeScript', definition: 'A syntactical superset of JavaScript which adds static typing.', example: 'Defining interfaces for API responses.', category: 'Web Dev', author: user1._id, status: 'approved', upvotes: 52 });
    const t4 = await Term.create({ name: 'LLM', definition: 'Large Language Model trained on massive amounts of text data.', example: 'GPT-4 by OpenAI.', category: 'AI', author: user3._id, status: 'approved', upvotes: 95 });
    
    // Comments
    await Comment.create({ term: t4._id, author: user1._id, text: 'This is changing everything!' });
    await Comment.create({ term: t4._id, author: user2._id, text: 'Can wait to see what comes next.' });

    console.log('Upgraded sample data seeded!');
    process.exit();
  } catch (error) { console.error(error); process.exit(1); }
};

seedData();
