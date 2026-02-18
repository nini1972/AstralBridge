import { Router } from 'express';
import { agents } from '../store';
import { AgentCard, HeartbeatPayload } from '../../../shared/types';

const router = Router();

// POST /agents/register
router.post('/register', (req, res) => {
    const agent: AgentCard = req.body;
    if (!agent.name) {
        return res.status(400).json({ error: 'Agent name is required' });
    }
    agent.lastHeartbeat = Date.now();
    agent.status = agent.status || 'active';
    agents.set(agent.name, agent);
    res.status(201).json(agent);
});

// GET /agents
router.get('/', (req, res) => {
    res.json(Array.from(agents.values()));
});

// GET /agents/:name
router.get('/:name', (req, res) => {
    const agent = agents.get(req.params.name);
    if (!agent) {
        return res.status(404).json({ error: 'Agent not found' });
    }
    res.json(agent);
});

// GET /agents/search?capability=...
router.get('/search', (req, res) => {
    const capability = req.query.capability as string;
    if (!capability) {
        return res.status(400).json({ error: 'Capability query parameter is required' });
    }
    const results = Array.from(agents.values()).filter(a =>
        a.capabilities.some(c => c.toLowerCase().includes(capability.toLowerCase()))
    );
    res.json(results);
});

// POST /agents/:name/heartbeat
router.post('/:name/heartbeat', (req, res) => {
    const agent = agents.get(req.params.name);
    if (!agent) {
        return res.status(404).json({ error: 'Agent not found' });
    }
    const payload: HeartbeatPayload = req.body;
    agent.lastHeartbeat = Date.now();
    if (payload.status) {
        agent.status = payload.status;
    }
    res.json({ status: 'updated', lastHeartbeat: agent.lastHeartbeat });
});

export default router;
