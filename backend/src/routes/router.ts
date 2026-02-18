import { Router } from 'express';
import axios from 'axios';
import { agents, tasks } from '../store';
import { RouterTask } from '../../../shared/types';

const router = Router();

const isSimulated = (endpoint: string) =>
    endpoint.includes('.local') || endpoint.includes('example.com');

// POST /a2a/task
router.post('/task', (req, res) => {
    const { capability, payload, targetAgent } = req.body;

    if (!capability) {
        return res.status(400).json({ error: 'Capability is required' });
    }

    // Resolve agents by capability — skip simulated agents
    const availableAgents = Array.from(agents.values()).filter(a =>
        a.status === 'active' &&
        a.capabilities.includes(capability) &&
        !isSimulated(a.endpoint)
    );

    // If a specific agent is requested, use it (if it qualifies)
    let selectedAgent = targetAgent
        ? availableAgents.find(a => a.name === targetAgent)
        : availableAgents[0];

    if (!selectedAgent) {
        return res.status(404).json({ error: 'No active real agents found with the required capability' });
    }

    const task: RouterTask = {
        id: Math.random().toString(36).substring(7),
        capability,
        payload,
        status: 'processing',
        assignedAgent: selectedAgent.name,
        createdAt: Date.now(),
        updatedAt: Date.now(),
    };

    tasks.set(task.id, task);

    // Forward the task to selectedAgent.endpoint
    const forwardTask = async () => {
        try {
            console.log(`Forwarding task ${task.id} to ${selectedAgent!.name} at ${selectedAgent!.endpoint}/task`);
            const response = await axios.post(`${selectedAgent!.endpoint}/task`, {
                capability,
                payload
            });

            task.status = 'completed';
            task.result = response.data.result;
            task.updatedAt = Date.now();
            console.log(`Task ${task.id} completed.`);
        } catch (err: any) {
            console.error(`Task ${task.id} failed:`, err.message);
            task.status = 'failed';
            task.result = { error: `Failed to reach agent ${selectedAgent!.name}`, details: err.message };
            task.updatedAt = Date.now();
        }
    };

    forwardTask();
    res.status(202).json(task);
});

// GET /a2a/task/:task_id
router.get('/task/:task_id', (req, res) => {
    const task = tasks.get(req.params.task_id);
    if (!task) {
        return res.status(404).json({ error: 'Task not found' });
    }
    res.json(task);
});

// GET /a2a/tasks — full task history
router.get('/tasks', (req, res) => {
    const all = Array.from(tasks.values()).sort((a, b) => b.createdAt - a.createdAt);
    res.json(all);
});

export default router;
