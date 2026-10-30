
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const authRoutes = require('./routes/auth');
const eventRoutes = require('./routes/events');
const bookingRoutes = require('./routes/bookings');

const app = express();

app.use(cors());
app.use(express.json());

// MongoDB connection cache
let cached = global.mongoose;

if (!cached) {
    cached = global.mongoose = {
        conn: null,
        promise: null
    };
}

async function connectDB() {
    if (cached.conn) return cached.conn;

    if (!process.env.MONGO_URI) {
        throw new Error('MONGO_URI is missing');
    }

    if (!cached.promise) {
        cached.promise = mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 10000,
            maxPoolSize: 5
        }).then((mongoose) => mongoose)
          .catch((error) => {
              cached.promise = null;
              throw error;
          });
    }

    cached.conn = await cached.promise;
    return cached.conn;
}

// Root route
app.get('/', (req, res) => {
    res.json({ message: 'Eventora API is running' });
});

// Database connection before API routes
app.use(async (req, res, next) => {
    try {
        await connectDB();
        next();
    } catch (error) {
        console.error('MongoDB Connection Error:', error.message);
        res.status(500).json({
            message: 'Database connection failed'
        });
    }
});

// Existing routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/bookings', bookingRoutes);

// Local development only
if (!process.env.VERCEL) {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

module.exports = app;
