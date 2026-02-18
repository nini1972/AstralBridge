import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();

const app = express();
const PORT = 4002;
const BRIDGE_URL = 'http://localhost:3001';

app.use(cors());
app.use(express.json());

const agentCard = {
    name: 'SentimentAgent',
    role: 'Sentiment Analyst',
    description: 'Analyzes the emotional tone of text.',
    capabilities: ['analyze_sentiment'],
    endpoint: `http://localhost:${PORT}/a2a`,
    status: 'active',
    framework: 'Express',
    provider: 'Local',
};

const tasks = new Map();

app.post('/a2a/task', (req: any, res: any) => {
    const { capability, payload } = req.body;
    if (capability !== 'analyze_sentiment') {
        return res.status(400).json({ error: 'Unsupported capability' });
    }

    const taskId = Math.random().toString(36).substring(7);
    const text = (payload.text || '').toLowerCase();

    const positiveWords = ['good', 'great', 'happy', 'excellent', 'stunning', 'charm', 'perfect', 'love', 'amazing', 'brilliant', 'expected', 'success', 'working', 'best', 'wonderful'];
    const negativeWords = ['bad', 'sad', 'angry', 'fail', 'error', 'broken', 'issue', 'problem', 'unhappy', 'poor', 'terrible', 'worst', 'difficult'];

    let score = 0;
    positiveWords.forEach(word => { if (text.includes(word)) score++; });
    negativeWords.forEach(word => { if (text.includes(word)) score--; });

    // Handle common negations like "without any issues"
    if (text.includes('without any issues') || text.includes('no issues') || text.includes('no problems')) score += 2;

    let sentiment = 'neutral';
    if (score > 0) sentiment = 'positive';
    if (score < 0) sentiment = 'negative';

    const task: any = {
        id: taskId,
        status: 'completed',
        result: { sentiment },
        createdAt: Date.now(),
        updatedAt: Date.now(),
    };
    tasks.set(taskId, task);

    res.status(200).json(task);
});

app.get('/a2a/task/:id', (req: any, res: any) => {
    const task = tasks.get(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json(task);
});

const register = async () => {
    try {
        await axios.post(`${BRIDGE_URL}/agents/register`, agentCard);
        console.log('Registered with AstralBridge');
        return true;
    } catch (err: any) {
        console.error('Registration failed:', err.message);
        return false;
    }
};

app.listen(PORT, async () => {
    console.log(`SentimentAgent running on port ${PORT}`);
    await register();

    setInterval(async () => {
        try {
            await axios.post(`${BRIDGE_URL}/agents/${agentCard.name}/heartbeat`, { status: 'active' });
        } catch (err: any) {
            console.warn('Heartbeat failed, attempting re-registration...');
            await register();
        }
    }, 5000);
});
