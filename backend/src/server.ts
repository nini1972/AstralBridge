import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import agentRoutes from './routes/agents';
import routerRoutes from './routes/router';
import { loadMockData } from './mockData';
import { loadAgents } from './persistence';

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

app.listen(PORT, () => {
    console.log(`AstralBridge Backend running on port ${PORT}`);
});
