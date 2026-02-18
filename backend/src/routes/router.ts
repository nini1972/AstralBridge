import { Router } from 'express';
import axios from 'axios';
import { agents, tasks, pipelines } from '../store';
import { RouterTask, PipelineRecord, PipelineStepResult } from '../../../shared/types';
import { appendLog } from '../logStore';

const router = Router();

const isSimulated = (endpoint: string) =>
    endpoint.includes('.local') || endpoint.includes('example.com');

const makeId = () => Math.random().toString(36).substring(2, 9);

// ─── Single task dispatch ────────────────────────────────────────────────────

// POST /a2a/task
router.post('/task', (req, res) => {
    const { capability, payload, targetAgent } = req.body;

    if (!capability) {
        return res.status(400).json({ error: 'Capability is required' });
    }

    const availableAgents = Array.from(agents.values()).filter(a =>
        a.status === 'active' &&
        a.capabilities.includes(capability) &&
        !isSimulated(a.endpoint)
    );

    let selectedAgent = targetAgent
        ? availableAgents.find(a => a.name === targetAgent)
        : availableAgents[0];

    if (!selectedAgent) {
        return res.status(404).json({ error: 'No active real agents found with the required capability' });
    }

    const task: RouterTask = {
        id: makeId(),
        capability,
        payload,
        status: 'processing',
        assignedAgent: selectedAgent.name,
        createdAt: Date.now(),
        updatedAt: Date.now(),
    };

    tasks.set(task.id, task);

    appendLog(selectedAgent.name, 'task_request', `Task ${task.id} dispatched for "${capability}"`, {
        taskId: task.id, capability, payload,
    });

    const forwardTask = async () => {
        try {
            console.log(`Forwarding task ${task.id} to ${selectedAgent!.name} at ${selectedAgent!.endpoint}/task`);
            const response = await axios.post(`${selectedAgent!.endpoint}/task`, { capability, payload });
            task.status = 'completed';
            task.result = response.data.result;
            task.updatedAt = Date.now();
            console.log(`Task ${task.id} completed.`);
            appendLog(selectedAgent!.name, 'task_response', `Task ${task.id} completed`, {
                taskId: task.id, result: task.result,
            });
        } catch (err: any) {
            console.error(`Task ${task.id} failed:`, err.message);
            task.status = 'failed';
            task.result = { error: `Failed to reach agent ${selectedAgent!.name}`, details: err.message };
            task.updatedAt = Date.now();
            appendLog(selectedAgent!.name, 'task_error', `Task ${task.id} failed: ${err.message}`, {
                taskId: task.id, error: err.message,
            });
        }
    };

    forwardTask();
    res.status(202).json(task);
});

// GET /a2a/task/:task_id
router.get('/task/:task_id', (req, res) => {
    const task = tasks.get(req.params.task_id);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json(task);
});

// GET /a2a/tasks
router.get('/tasks', (req, res) => {
    const all = Array.from(tasks.values()).sort((a, b) => b.createdAt - a.createdAt);
    res.json(all);
});

// ─── Pipeline ────────────────────────────────────────────────────────────────

// POST /a2a/pipeline
router.post('/pipeline', (req, res) => {
    const { steps, input } = req.body;

    if (!Array.isArray(steps) || steps.length === 0) {
        return res.status(400).json({ error: 'steps must be a non-empty array' });
    }

    // Validate all capabilities are available before starting
    for (const step of steps) {
        const capable = Array.from(agents.values()).some(
            a => a.status === 'active' && a.capabilities.includes(step.capability) && !isSimulated(a.endpoint)
        );
        if (!capable) {
            return res.status(404).json({
                error: `No active real agent found for capability: "${step.capability}"`,
            });
        }
    }

    const pipeline: PipelineRecord = {
        id: makeId(),
        status: 'running',
        steps,
        results: [],
        input,
        createdAt: Date.now(),
        updatedAt: Date.now(),
    };

    pipelines.set(pipeline.id, pipeline);

    // Execute pipeline steps sequentially (async, non-blocking)
    const runPipeline = async () => {
        let currentInput = input;

        for (let i = 0; i < steps.length; i++) {
            const step = steps[i];
            const stepStart = Date.now();

            // Find agent for this step
            const agent = Array.from(agents.values()).find(
                a => a.status === 'active' && a.capabilities.includes(step.capability) && !isSimulated(a.endpoint)
            );

            if (!agent) {
                const stepResult: PipelineStepResult = {
                    capability: step.capability,
                    agentName: 'unknown',
                    result: null,
                    status: 'failed',
                    durationMs: Date.now() - stepStart,
                    error: `No agent available for "${step.capability}"`,
                };
                pipeline.results.push(stepResult);
                pipeline.status = 'failed';
                pipeline.updatedAt = Date.now();
                console.error(`Pipeline ${pipeline.id} step ${i + 1} failed: no agent for ${step.capability}`);
                return;
            }

            // Merge step params into the current input
            const stepPayload = { ...currentInput, ...(step.params ?? {}) };

            appendLog(agent.name, 'task_request',
                `Pipeline ${pipeline.id} step ${i + 1}/${steps.length}: "${step.capability}"`,
                { pipelineId: pipeline.id, step: i + 1, payload: stepPayload }
            );

            try {
                console.log(`Pipeline ${pipeline.id} step ${i + 1}: ${step.capability} → ${agent.name}`);
                const response = await axios.post(`${agent.endpoint}/task`, {
                    capability: step.capability,
                    payload: stepPayload,
                });

                const stepResult: PipelineStepResult = {
                    capability: step.capability,
                    agentName: agent.name,
                    result: response.data.result,
                    status: 'completed',
                    durationMs: Date.now() - stepStart,
                };
                pipeline.results.push(stepResult);
                pipeline.updatedAt = Date.now();

                appendLog(agent.name, 'task_response',
                    `Pipeline ${pipeline.id} step ${i + 1} completed`,
                    { pipelineId: pipeline.id, result: stepResult.result }
                );

                // Pass this step's result as next step's input
                currentInput = typeof response.data.result === 'object' && response.data.result !== null
                    ? response.data.result
                    : { text: String(response.data.result), ...currentInput };

            } catch (err: any) {
                const stepResult: PipelineStepResult = {
                    capability: step.capability,
                    agentName: agent.name,
                    result: null,
                    status: 'failed',
                    durationMs: Date.now() - stepStart,
                    error: err.message,
                };
                pipeline.results.push(stepResult);
                pipeline.status = 'failed';
                pipeline.updatedAt = Date.now();

                appendLog(agent.name, 'task_error',
                    `Pipeline ${pipeline.id} step ${i + 1} failed: ${err.message}`,
                    { pipelineId: pipeline.id, error: err.message }
                );

                console.error(`Pipeline ${pipeline.id} step ${i + 1} failed:`, err.message);
                return;
            }
        }

        // All steps completed
        pipeline.status = 'completed';
        pipeline.finalResult = pipeline.results[pipeline.results.length - 1]?.result;
        pipeline.updatedAt = Date.now();
        console.log(`Pipeline ${pipeline.id} completed successfully.`);
    };

    runPipeline();
    res.status(202).json(pipeline);
});

// GET /a2a/pipeline/:id
router.get('/pipeline/:id', (req, res) => {
    const pipeline = pipelines.get(req.params.id);
    if (!pipeline) return res.status(404).json({ error: 'Pipeline not found' });
    res.json(pipeline);
});

// GET /a2a/pipelines
router.get('/pipelines', (req, res) => {
    const all = Array.from(pipelines.values()).sort((a, b) => b.createdAt - a.createdAt);
    res.json(all);
});

export default router;
