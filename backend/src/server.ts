import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import agentRoutes from './routes/agents';
import routerRoutes from './routes/router';
import { loadMockData } from './mockData';
import { loadAgents, saveAgents } from './persistence';
import { agents } from './store';
import { appendLog } from './logStore';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

loadMockData();
loadAgents(); // restore persisted real agents (overwrites mock if same name)

app.use(cors());
app.use(express.json());

app.use('/agents', agentRoutes);
app.use('/a2a', routerRoutes);

app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: Date.now() });
});

// ─── Health Monitor ──────────────────────────────────────────────────────────

const STALE_THRESHOLD_MS = 60000; // 1 minute
const MONITOR_INTERVAL_MS = 30000; // 30 seconds

setInterval(() => {
    const now = Date.now();
    let changed = false;

    for (const agent of agents.values()) {
        // Only monitor "real" agents (not simulated or cloud run serverless) that are currently active
        const isSimulated = agent.endpoint.includes('.local') || agent.endpoint.includes('example.com');
        const isServerless = agent.endpoint.includes('.run.app') || agent.endpoint.includes('a.run.app');

        if (!isSimulated && !isServerless && agent.status === 'active' && (now - agent.lastHeartbeat) > STALE_THRESHOLD_MS) {
            console.log(`[health] Marking agent "${agent.name}" as inactive (stale heartbeat)`);
            agent.status = 'inactive';
            appendLog(agent.name, 'heartbeat', `Agent "${agent.name}" marked as inactive due to stale heartbeat`);
            changed = true;
        }
    }

    if (changed) {
        saveAgents();
    }
}, MONITOR_INTERVAL_MS);

// ─────────────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
    console.log(`AstralBridge Backend running on port ${PORT}`);
});
