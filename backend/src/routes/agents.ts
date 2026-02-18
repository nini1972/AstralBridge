import { Router } from 'express';
import { agents, tasks } from '../store';
import { AgentCard, HeartbeatPayload } from '../../../shared/types';
import { saveAgents } from '../persistence';
import { appendLog, getLogs } from '../logStore';

const router = Router();

// POST /agents/register
router.post('/register', (req, res) => {
    const agent: AgentCard = req.body;
    agent.lastHeartbeat = Date.now();
    agent.status = agent.status || 'active';
    agents.set(agent.name, agent);
    saveAgents();
    appendLog(agent.name, 'register', `Agent "${agent.name}" registered`, {
        version: agent.version,
        build: agent.build,
        model: agent.model,
        capabilities: agent.capabilities,
        endpoint: agent.endpoint,
    });
    res.status(201).json(agent);
});

// GET /agents
router.get('/', (req, res) => {
    res.json(Array.from(agents.values()));
});

// GET /agents/search?capability=xxx
router.get('/search', (req, res) => {
    const { capability } = req.query;
    if (!capability || typeof capability !== 'string') {
        return res.status(400).json({ error: 'capability query param required' });
    }
    const matches = Array.from(agents.values()).filter(a =>
        a.capabilities.includes(capability)
    );
    res.json(matches);
});

// GET /agents/:name
router.get('/:name', (req, res) => {
    const agent = agents.get(req.params.name);
    if (!agent) return res.status(404).json({ error: 'Agent not found' });
    res.json(agent);
});

// GET /agents/:name/logs
router.get('/:name/logs', (req, res) => {
    const agent = agents.get(req.params.name);
    if (!agent) return res.status(404).json({ error: 'Agent not found' });
    res.json(getLogs(req.params.name));
});

// GET /agents/:name/tasks — last 20 tasks assigned to this agent
router.get('/:name/tasks', (req, res) => {
    const agent = agents.get(req.params.name);
    if (!agent) return res.status(404).json({ error: 'Agent not found' });
    const agentTasks = Array.from(tasks.values())
        .filter(t => t.assignedAgent === req.params.name)
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, 20);
    res.json(agentTasks);
});

// POST /agents/:name/heartbeat
router.post('/:name/heartbeat', (req, res) => {
    const agent = agents.get(req.params.name);
    if (!agent) return res.status(404).json({ error: 'Agent not found' });

    const payload: HeartbeatPayload = req.body;
    agent.lastHeartbeat = Date.now();
    if (payload.status) {
        agent.status = payload.status;
    }
    saveAgents();
    appendLog(agent.name, 'heartbeat', `Heartbeat from "${agent.name}"`, { status: agent.status });
    res.json({ status: 'updated', lastHeartbeat: agent.lastHeartbeat });
});

// DELETE /agents/:name
router.delete('/:name', (req, res) => {
    const agent = agents.get(req.params.name);
    const existed = agents.delete(req.params.name);
    if (!existed) {
        return res.status(404).json({ error: 'Agent not found' });
    }
    saveAgents();
    appendLog(req.params.name, 'delete', `Agent "${req.params.name}" deleted`);
    res.json({ status: 'deleted', name: req.params.name });
});

export default router;
