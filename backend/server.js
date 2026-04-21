// import express from 'express';
// import mongoose from 'mongoose';
// import cors from 'cors';
// import dotenv from 'dotenv';
// import authRoutes from './routes/authRoutes.js';
// import termRoutes from './routes/termRoutes.js';

// dotenv.config();

// const app = express();
// // app.use(cors({
// //   origin: ['http://localhost:5500', 'http://127.0.0.1:5500'],
// //   credentials: true
// // }));
// app.use(cors({
//   origin: [
//     'http://localhost:5500',
//     'http://127.0.0.1:5500',
//     'http://localhost:5501',
//     'http://127.0.0.1:5501'
//   ],
//   credentials: true
// }));

// app.use(express.json());

// // Initialize MongoDB connection
// mongoose.connect(process.env.MONGO_URI)
// .then(() => console.log('MongoDB Connected'))
// .catch(err => console.error('MongoDB connection error:', err));

// // Routes
// app.use('/api/auth', authRoutes);
// app.use('/api/terms', termRoutes);

// // Root route
// app.get('/', (req, res) => {
//   res.send('Collaborative Glossary API is running...');
// });

// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });



import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import termRoutes from './routes/termRoutes.js';

dotenv.config();

const app = express();


const allowedOrigins = [
  'http://localhost:5500',
  'http://127.0.0.1:5500',
  'http://localhost:5501',
  'http://127.0.0.1:5501',
  'https://tech-gloss-alpha.vercel.app'
];

app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (like Postman)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('❌ Blocked by CORS:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));


app.use(express.json());


mongoose.connect(process.env.MONGO_URI)
.then(() => console.log('✅ MongoDB Connected'))
.catch(err => console.error('❌ MongoDB Error:', err));


app.use('/api/auth', authRoutes);
app.use('/api/terms', termRoutes);


app.get('/', (req, res) => {
  res.send('🚀 Collaborative Glossary API is running...');
});


const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🔥 Server running on port ${PORT}`);
});