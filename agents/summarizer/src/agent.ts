import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();

const app = express();
const PORT = 4001;
const BRIDGE_URL = 'http://localhost:3001';

app.use(cors());
app.use(express.json());

const agentCard = {
    name: 'SummarizerAgent',
    role: 'Text Summarizer',
    description: 'Condenses long strings into short, digestible summaries.',
    capabilities: ['summarize_text'],
    endpoint: `http://localhost:${PORT}/a2a`,
    status: 'active',
    framework: 'Express',
    provider: 'Local',
};

const tasks = new Map();

app.post('/a2a/task', (req: any, res: any) => {
    const { capability, payload } = req.body;
    if (capability !== 'summarize_text') {
        return res.status(400).json({ error: 'Unsupported capability' });
    }

    const taskId = Math.random().toString(36).substring(7);
    const text = payload.text || '';

    // Process immediately for A2A synchronous return
    const task: any = {
        id: taskId,
        status: 'completed',
        result: { summary: text.split(' ').slice(0, 5).join(' ') + '...' },
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
    console.log(`SummarizerAgent running on port ${PORT}`);
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
