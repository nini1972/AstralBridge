import { AgentLog, AgentLogType } from '../../shared/types';
import { logs } from './store';

const MAX_LOGS = 20;

/** Append a log entry for an agent, capped at MAX_LOGS. */
export const appendLog = (
    agentName: string,
    type: AgentLogType,
    message: string,
    data?: any
): void => {
    const entry: AgentLog = {
        id: Math.random().toString(36).substring(2, 9),
        agentName,
        type,
        message,
        data,
        timestamp: Date.now(),
    };

    const existing = logs.get(agentName) ?? [];
    const updated = [...existing, entry].slice(-MAX_LOGS);
    logs.set(agentName, updated);
};

/** Get all logs for an agent (newest last). */
export const getLogs = (agentName: string): AgentLog[] =>
    logs.get(agentName) ?? [];
