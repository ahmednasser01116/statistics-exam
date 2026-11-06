const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(__dirname));

const DATA_DIR = process.env.VERCEL ? '/tmp' : path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'results.json');

// Ensure data directory and file exist
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2));
}

function readResults() {
    try {
        return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    } catch {
        return [];
    }
}

function writeResults(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// Get all results (admin)
app.get('/api/results', (req, res) => {
    res.json(readResults());
});

// Submit a new result
app.post('/api/results', (req, res) => {
    const data = readResults();
    const result = {
        id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
        studentName: req.body.studentName,
        score: req.body.score,
        total: req.body.total,
        percentage: req.body.percentage,
        timeTaken: req.body.timeTaken,
        answers: req.body.answers,
        timestamp: new Date().toISOString()
    };
    data.push(result);
    writeResults(data);
    res.json({ success: true, id: result.id });
});

// Delete a specific result
app.delete('/api/results/:id', (req, res) => {
    let data = readResults();
    data = data.filter(r => r.id !== req.params.id);
    writeResults(data);
    res.json({ success: true });
});

// Clear all results
app.delete('/api/results', (req, res) => {
    writeResults([]);
    res.json({ success: true });
});

// Get statistics summary
app.get('/api/stats', (req, res) => {
    const data = readResults();
    if (data.length === 0) {
        return res.json({ count: 0, avgScore: 0, highest: 0, lowest: 0, avgPercentage: 0 });
    }
    const scores = data.map(r => r.score);
    const percentages = data.map(r => r.percentage);
    res.json({
        count: data.length,
        avgScore: (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1),
        highest: Math.max(...scores),
        lowest: Math.min(...scores),
        avgPercentage: (percentages.reduce((a, b) => a + b, 0) / percentages.length).toFixed(1)
    });
});

if (!process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log('');
        console.log('  ╔══════════════════════════════════════════════╗');
        console.log('  ║   🎓 Statistics Exam Server is Running!     ║');
        console.log('  ║                                              ║');
        console.log(`  ║   📝 Exam:  http://localhost:${PORT}             ║`);
        console.log(`  ║   📊 Admin: http://localhost:${PORT}/admin.html  ║`);
        console.log('  ║                                              ║');
        console.log('  ║   Admin Password: admin2024                  ║');
        console.log('  ╚══════════════════════════════════════════════╝');
        console.log('');
    });
}

module.exports = app;
