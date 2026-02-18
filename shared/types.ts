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
    // Plan A: versioning
    version?: string;
    build?: string;
    model?: string;
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

// Plan C: Agent logs
export type AgentLogType =
    | 'register'
    | 'heartbeat'
    | 'delete'
    | 'task_request'
    | 'task_response'
    | 'task_error';

export interface AgentLog {
    id: string;
    agentName: string;
    type: AgentLogType;
    message: string;
    data?: any;
    timestamp: number;
}

// Part 3: Multi-agent pipelines
export interface PipelineStep {
    capability: string;
    params?: Record<string, any>;
}

export interface PipelineStepResult {
    capability: string;
    agentName: string;
    result: any;
    status: 'completed' | 'failed';
    durationMs: number;
    error?: string;
}

export interface PipelineRecord {
    id: string;
    status: 'running' | 'completed' | 'failed';
    steps: PipelineStep[];
    results: PipelineStepResult[];
    input: any;
    finalResult?: any;
    createdAt: number;
    updatedAt: number;
}
