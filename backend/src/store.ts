import { AgentCard, RouterTask, AgentLog, PipelineRecord } from '../../shared/types';

export const agents = new Map<string, AgentCard>();
export const tasks = new Map<string, RouterTask>();
export const logs = new Map<string, AgentLog[]>();
export const pipelines = new Map<string, PipelineRecord>();
