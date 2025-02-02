const express = require('express');
const cors = require('cors');

const app = express();

// Basic middleware
app.use(express.json());
app.use(cors());

// Test route
app.get('/api/test', (req, res) => {
    console.log('Test endpoint hit!');
    res.json({ message: 'Test endpoint working!' });
});

// Error handling
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
});

const PORT = 5002; 
const server = app.listen(PORT, () => {
    console.log(`Test server running on port ${PORT}`);
    console.log(`Try accessing: http://localhost:${PORT}/api/test`);
}).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Please try a different port.`);
    } else {
        console.error('Server error:', err);
    }
});
