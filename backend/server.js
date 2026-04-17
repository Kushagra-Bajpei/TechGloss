import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import termRoutes from './routes/termRoutes.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Initialize MongoDB connection
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log('MongoDB Connected'))
.catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/terms', termRoutes);

// Serve static frontend files if needed (optional since we'll run frontend with live server or directly)
app.use(express.static('../frontend'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
