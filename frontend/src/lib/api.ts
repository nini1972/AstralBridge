import { AgentCard, RouterTask, AgentLog, PipelineStep, PipelineRecord } from "@shared/types";

const API_BASE = "http://localhost:3001";

export const api = {
    getAgents: async (): Promise<AgentCard[]> => {
        const res = await fetch(`${API_BASE}/agents`);
        if (!res.ok) throw new Error("Failed to fetch agents");
        return res.json();
    },

    getAgent: async (name: string): Promise<AgentCard> => {
        const res = await fetch(`${API_BASE}/agents/${name}`);
        if (!res.ok) throw new Error("Failed to fetch agent");
        return res.json();
    },

    searchAgents: async (capability: string): Promise<AgentCard[]> => {
        const res = await fetch(`${API_BASE}/agents/search?capability=${capability}`);
        if (!res.ok) throw new Error("Failed to search agents");
        return res.json();
    },

    registerAgent: async (agent: Omit<AgentCard, "lastHeartbeat">): Promise<AgentCard> => {
        const res = await fetch(`${API_BASE}/agents/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(agent),
        });
        if (!res.ok) throw new Error("Failed to register agent");
        return res.json();
    },

    deleteAgent: async (name: string): Promise<void> => {
        const res = await fetch(`${API_BASE}/agents/${name}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Failed to delete agent");
    },

    sendHeartbeat: async (name: string, status: string): Promise<void> => {
        await fetch(`${API_BASE}/agents/${name}/heartbeat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status }),
        });
    },

    submitTask: async (capability: string, payload: any, targetAgent?: string): Promise<RouterTask> => {
        const res = await fetch(`${API_BASE}/a2a/task`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ capability, payload, targetAgent }),
        });
        if (!res.ok) throw new Error("Failed to submit task");
        return res.json();
    },

    getTaskStatus: async (taskId: string): Promise<RouterTask> => {
        const res = await fetch(`${API_BASE}/a2a/task/${taskId}`);
        if (!res.ok) throw new Error("Failed to fetch task status");
        return res.json();
    },

    getTasks: async (): Promise<RouterTask[]> => {
        const res = await fetch(`${API_BASE}/a2a/tasks`);
        if (!res.ok) throw new Error("Failed to fetch tasks");
        return res.json();
    },

    getAgentTasks: async (name: string): Promise<RouterTask[]> => {
        const res = await fetch(`${API_BASE}/agents/${encodeURIComponent(name)}/tasks`);
        if (!res.ok) throw new Error("Failed to fetch agent tasks");
        return res.json();
    },

    getAgentLogs: async (name: string): Promise<AgentLog[]> => {
        const res = await fetch(`${API_BASE}/agents/${encodeURIComponent(name)}/logs`);
        if (!res.ok) throw new Error("Failed to fetch agent logs");
        return res.json();
    },

    runPipeline: async (steps: PipelineStep[], input: any): Promise<PipelineRecord> => {
        const res = await fetch(`${API_BASE}/a2a/pipeline`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ steps, input }),
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({ error: "Unknown error" }));
            throw new Error(err.error || "Failed to start pipeline");
        }
        return res.json();
    },

    getPipeline: async (id: string): Promise<PipelineRecord> => {
        const res = await fetch(`${API_BASE}/a2a/pipeline/${id}`);
        if (!res.ok) throw new Error("Pipeline not found");
        return res.json();
    },

    getPipelines: async (): Promise<PipelineRecord[]> => {
        const res = await fetch(`${API_BASE}/a2a/pipelines`);
        if (!res.ok) throw new Error("Failed to fetch pipelines");
        return res.json();
    },
};
