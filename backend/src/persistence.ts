import fs from 'fs';
import path from 'path';
import { agents } from './store';
import { AgentCard } from '../../shared/types';

const DATA_DIR = path.join(__dirname, '..', 'data');
const AGENTS_FILE = path.join(DATA_DIR, 'agents.json');

const isSimulated = (endpoint: string) =>
    endpoint.includes('.local') || endpoint.includes('example.com');

/** Load persisted real agents from disk into the in-memory store. */
export const loadAgents = (): void => {
    try {
        if (!fs.existsSync(DATA_DIR)) {
            fs.mkdirSync(DATA_DIR, { recursive: true });
        }
        if (!fs.existsSync(AGENTS_FILE)) {
            console.log('[persistence] No agents.json found — starting fresh.');
            return;
        }
        const raw = fs.readFileSync(AGENTS_FILE, 'utf-8');
        const saved: AgentCard[] = JSON.parse(raw);
        let count = 0;
        for (const agent of saved) {
            agents.set(agent.name, agent);
            count++;
        }
        console.log(`[persistence] Loaded ${count} agent(s) from agents.json`);
    } catch (err: any) {
        console.error('[persistence] Failed to load agents.json:', err.message);
    }
};

/** Persist all real (non-simulated) agents to disk. */
export const saveAgents = (): void => {
    try {
        if (!fs.existsSync(DATA_DIR)) {
            fs.mkdirSync(DATA_DIR, { recursive: true });
        }
        const realAgents = Array.from(agents.values()).filter(
            a => !isSimulated(a.endpoint)
        );
        fs.writeFileSync(AGENTS_FILE, JSON.stringify(realAgents, null, 2), 'utf-8');
    } catch (err: any) {
        console.error('[persistence] Failed to save agents.json:', err.message);
    }
};
