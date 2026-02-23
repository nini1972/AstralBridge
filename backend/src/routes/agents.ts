import { Router } from 'express';
import { agents, tasks } from '../store';
import { AgentCard, HeartbeatPayload } from '../../../shared/types';
import { saveAgents } from '../persistence';
import { appendLog, getLogs } from '../logStore';

const router = Router();

// POST /agents/register
router.post('/register', (req, res) => {
    const agent: AgentCard = req.body;

    // Ensure data structures are present
    agent.skills = agent.skills || [];
    agent.capabilities = agent.capabilities || [];

    // Sync capabilities with skill IDs if skills are provided
    if (agent.skills.length > 0) {
        const skillIds = agent.skills.map(s => s.id);
        agent.capabilities = Array.from(new Set([...agent.capabilities, ...skillIds]));
    }

    agent.lastHeartbeat = Date.now();
    agent.status = agent.status || 'active';
    agents.set(agent.name, agent);
    saveAgents();

    appendLog(agent.name, 'register', `Agent "${agent.name}" registered`, {
        version: agent.version,
        skills: agent.skills.map(s => s.id),
        capabilities: agent.capabilities,
        endpoint: agent.endpoint,
    });
    res.status(201).json(agent);
});

// POST /agents/discovery
// Body: { url: "http://domain.com" }
router.post('/discovery', async (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'url is required' });

    try {
        const baseUrl = url.endsWith('/') ? url.slice(0, -1) : url;
        const discoveryUrl = `${baseUrl}/.well-known/agent-card.json`;

        console.log(`[discovery] Fetching agent card from ${discoveryUrl}`);
        const response = await fetch(discoveryUrl);
        if (!response.ok) {
            throw new Error(`Failed to fetch from ${discoveryUrl}: ${response.statusText}`);
        }

        const agentCard: AgentCard = await response.json() as AgentCard;

        // Basic validation
        if (!agentCard.name || !agentCard.endpoint) {
            return res.status(400).json({ error: 'Invalid Agent Card: missing name or endpoint' });
        }

        agentCard.skills = agentCard.skills || [];
        agentCard.capabilities = agentCard.capabilities || [];

        // In Discovery, if only capabilities are present, we treat them as legacy
        // If skills are present, we ensure capabilities reflects them
        if (agentCard.skills.length > 0) {
            const skillIds = agentCard.skills.map(s => s.id);
            agentCard.capabilities = Array.from(new Set([...agentCard.capabilities, ...skillIds]));
        } else if (agentCard.capabilities.length === 0) {
            return res.status(400).json({ error: 'Invalid Agent Card: no skills or capabilities defined' });
        }

        agentCard.lastHeartbeat = Date.now();
        agentCard.status = agentCard.status || 'active';
        agents.set(agentCard.name, agentCard);
        saveAgents();

        appendLog(agentCard.name, 'discovery', `Agent "${agentCard.name}" discovered/imported from URL`, {
            url: discoveryUrl,
            agent: agentCard
        });

        res.status(200).json(agentCard);
    } catch (err: any) {
        console.error(`[discovery] Error:`, err.message);
        res.status(500).json({ error: 'Discovery failed', details: err.message });
    }
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
