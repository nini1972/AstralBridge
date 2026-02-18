import { Router } from 'express';
import { agents } from '../store';
import { AgentCard, HeartbeatPayload } from '../../../shared/types';
import { saveAgents } from '../persistence';

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
    saveAgents();
    res.status(201).json(agent);
});

// GET /agents
router.get('/', (req, res) => {
    res.json(Array.from(agents.values()));
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

// GET /agents/:name
router.get('/:name', (req, res) => {
    const agent = agents.get(req.params.name);
    if (!agent) {
        return res.status(404).json({ error: 'Agent not found' });
    }
    res.json(agent);
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
    saveAgents();
    res.json({ status: 'updated', lastHeartbeat: agent.lastHeartbeat });
});

// DELETE /agents/:name
router.delete('/:name', (req, res) => {
    const existed = agents.delete(req.params.name);
    if (!existed) {
        return res.status(404).json({ error: 'Agent not found' });
    }
    saveAgents();
    res.json({ status: 'deleted', name: req.params.name });
});

export default router;
