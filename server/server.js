import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/calculator_db';

mongoose.connect(MONGODB_URI)
    .then(() => console.log('✅ MongoDB Connected'))
    .catch(err => console.error('❌ MongoDB Connection Error:', err));

// Schema & Model
const calculationSchema = new mongoose.Schema({
    equation: { type: String, required: true },
    result: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

const Calculation = mongoose.model('Calculation', calculationSchema);

// Routes
// Get all calculations
app.get('/api/history', async (req, res) => {
    try {
        const history = await Calculation.find().sort({ createdAt: -1 }).limit(10);
        res.json(history);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Save a calculation
app.post('/api/history', async (req, res) => {
    const { equation, result } = req.body;

    if (!equation || !result) {
        return res.status(400).json({ message: 'Equation and result are required' });
    }

    const newCalculation = new Calculation({ equation, result });

    try {
        const savedCalculation = await newCalculation.save();
        res.status(201).json(savedCalculation);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Clear history
app.delete('/api/history', async (req, res) => {
    try {
        await Calculation.deleteMany({});
        res.json({ message: 'History cleared' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Delete specific calculation
app.delete('/api/history/:id', async (req, res) => {
    try {
        const deleted = await Calculation.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ message: 'Not found' });
        res.json({ message: 'Calculation deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
