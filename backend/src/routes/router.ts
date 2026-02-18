import { Router } from 'express';
import axios from 'axios';
import { agents, tasks } from '../store';
import { RouterTask } from '../../../shared/types';

const router = Router();

// POST /a2a/task
router.post('/task', (req, res) => {
    const { capability, payload } = req.body;

    if (!capability) {
        return res.status(400).json({ error: 'Capability is required' });
    }

    // Resolve agents by capability
    const availableAgents = Array.from(agents.values()).filter(a =>
        a.status === 'active' && a.capabilities.includes(capability)
    );

    if (availableAgents.length === 0) {
        return res.status(404).json({ error: 'No active agents found with the required capability' });
    }

    // Simple selection strategy: first available
    const selectedAgent = availableAgents[0];

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
            console.log(`Forwarding task ${task.id} to agent ${selectedAgent.name} at ${selectedAgent.endpoint}/task`);
            const response = await axios.post(`${selectedAgent.endpoint}/task`, {
                capability,
                payload
            });

            console.log(`Agent ${selectedAgent.name} response:`, JSON.stringify(response.data, null, 2));

            task.status = 'completed';
            task.result = response.data.result; // Extract result from agent's A2A response
            task.updatedAt = Date.now();
            console.log(`Task ${task.id} result saved in bridge memory.`);
        } catch (err: any) {
            console.error(`Task ${task.id} forwarding failed:`, err.message);
            task.status = 'failed';
            task.result = { error: `Failed to reach agent ${selectedAgent.name}`, details: err.message };
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

export default router;
