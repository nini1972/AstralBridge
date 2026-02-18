export interface AgentCard {
    name: string;
    role: string;
    description: string;
    capabilities: string[];
    endpoint: string;
    status: 'active' | 'inactive' | 'busy';
    lastHeartbeat: number;
    framework?: string;
    provider?: string;
}

export interface Capability {
    id: string;
    name: string;
    description: string;
    agents: string[]; // Agent names
}

export interface RouterTask {
    id: string;
    capability: string;
    payload: any;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    result?: any;
    assignedAgent?: string;
    createdAt: number;
    updatedAt: number;
}

export interface HeartbeatPayload {
    name: string;
    status: 'active' | 'inactive' | 'busy';
}
