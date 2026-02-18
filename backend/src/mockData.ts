import { agents } from './store';
import { AgentCard } from '../../shared/types';

export const loadMockData = () => {
    const mockAgents: AgentCard[] = [
        {
            name: 'Nebula-1',
            role: 'Data Miner',
            description: 'Extracts patterns from cosmic dust protocols.',
            capabilities: ['data-mining', 'pattern-recognition'],
            endpoint: 'http://nebula-1.local/a2a',
            status: 'active',
            lastHeartbeat: Date.now(),
            framework: 'LangChain',
            provider: 'OpenAI',
        },
        {
            name: 'Stellar-Gate',
            role: 'Router',
            description: 'Manages inter-stellar agent communications.',
            capabilities: ['routing', 'translation'],
            endpoint: 'http://stellar-gate.local/a2a',
            status: 'active',
            lastHeartbeat: Date.now(),
            framework: 'CrewAI',
            provider: 'Anthropic',
        },
        {
            name: 'Void-Watcher',
            role: 'Security',
            description: 'Monitors the ecosystem for anomalies.',
            capabilities: ['security', 'anomaly-detection'],
            endpoint: 'http://void-watcher.local/a2a',
            status: 'active',
            lastHeartbeat: Date.now(),
            framework: 'AutoGPT',
            provider: 'Google',
        }
    ];

    mockAgents.forEach(agent => agents.set(agent.name, agent));
};
