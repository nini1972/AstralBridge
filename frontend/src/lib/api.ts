import { AgentCard, RouterTask } from "@shared/types";

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

    sendHeartbeat: async (name: string, status: string): Promise<void> => {
        await fetch(`${API_BASE}/agents/${name}/heartbeat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status }),
        });
    },

    submitTask: async (capability: string, payload: any): Promise<RouterTask> => {
        const res = await fetch(`${API_BASE}/a2a/task`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ capability, payload }),
        });
        if (!res.ok) throw new Error("Failed to submit task");
        return res.json();
    },

    getTaskStatus: async (taskId: string): Promise<RouterTask> => {
        const res = await fetch(`${API_BASE}/a2a/task/${taskId}`);
        if (!res.ok) throw new Error("Failed to fetch task status");
        return res.json();
    },
};
