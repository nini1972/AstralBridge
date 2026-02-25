'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { AgentCard, PipelineRecord } from '@shared/types';

interface CosmicGraphProps {
    agents: AgentCard[];
    activePipelines?: PipelineRecord[];
}

const CapabilityGlyph: React.FC<{ skillId: string; radius: number; duration: number; delay: number }> = ({ skillId, radius, duration, delay }) => {
    // Guard: skip rendering if skillId is missing
    if (!skillId) return null;

    const getPath = (id: string): string => {
        if (!id) return "M20,10 A10,10 0 1,1 19.9,10";
        const sid = id.toLowerCase();
        if (sid.includes('translate')) return "M2,10 Q10,0 18,10 T34,10";
        if (sid.includes('detect')) return "M10,10 A10,10 0 1,0 30,10 A10,10 0 1,0 10,10 M20,5 L20,15 M15,10 L25,10";
        if (sid.includes('sentiment')) return "M5,20 Q20,5 35,20 Q20,35 5,20";
        if (sid.includes('summarize')) return "M5,5 L35,5 M10,15 L30,15 M15,25 L25,25";
        if (sid.includes('analyze')) return "M10,30 L10,10 L30,30 L30,10";
        return "M20,10 A10,10 0 1,1 19.9,10";
    };

    const color = useMemo(() => {
        const sid = skillId ? skillId.toLowerCase() : '';
        if (sid.includes('translate')) return 'text-nebula-blue';
        if (sid.includes('sentiment')) return 'text-starlight-violet';
        if (sid.includes('summarize')) return 'text-solar-gold';
        return 'text-cosmic-teal';
    }, [skillId]);

    const pathD = getPath(skillId);

    return (
        <motion.g
            animate={{ rotate: [0, 360] }}
            transition={{ duration, repeat: Infinity, ease: "linear", delay }}
            style={{ transformOrigin: '0px 0px' }}
        >
            <motion.path
                d={pathD}
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                className={color}
                style={{ transform: `translate(${radius}px, 0px)` }}
                animate={{
                    opacity: [0.3, 0.7, 0.3],
                    scale: [0.9, 1.1, 0.9],
                    strokeWidth: [1, 2, 1],
                }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />
        </motion.g>
    );
};

const AgentStar: React.FC<{ agent: AgentCard; x: number; y: number }> = ({ agent, x, y }) => {
    return (
        <g transform={`translate(${x}, ${y})`}>
            <motion.circle
                r="35"
                fill="none"
                stroke="url(#starHalo)"
                strokeWidth="20"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: [0.2, 0.4, 0.2], scale: [0.9, 1.1, 0.9] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                style={{ filter: 'blur(10px)' }}
            />

            <motion.circle
                r="6"
                fill="#FFF"
                className="drop-shadow-[0_0_8px_rgba(255,200,200,0.8)]"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />

            {(agent.skills || []).filter(skill => !!skill?.id).map((skill, idx) => (
                <CapabilityGlyph
                    key={skill.id || idx}
                    skillId={skill.id}
                    radius={45 + idx * 12}
                    duration={15 + idx * 5}
                    delay={idx * 0.5}
                />
            ))}

            <foreignObject x="-60" y="55" width="120" height="40">
                <div className="text-center">
                    <p className="text-[10px] font-bold text-white/90 truncate uppercase tracking-tighter">
                        {agent.name}
                    </p>
                    <p className="text-[8px] text-orbit-silver/50 truncate">
                        {agent.role}
                    </p>
                </div>
            </foreignObject>
        </g>
    );
};

const ConnectionFilament: React.FC<{ start: { x: number; y: number }; end: { x: number; y: number }; isActive?: boolean }> = ({ start, end, isActive }) => {
    const [mounted, setMounted] = React.useState(false);
    React.useEffect(() => setMounted(true), []);

    // Guard: skip rendering if coordinates are invalid
    if (!start || !end ||
        typeof start.x !== 'number' || typeof start.y !== 'number' ||
        typeof end.x !== 'number' || typeof end.y !== 'number' ||
        isNaN(start.x) || isNaN(start.y) || isNaN(end.x) || isNaN(end.y)
    ) return null;

    const midX = (start.x + end.x) / 2;
    const midY = (start.y + end.y) / 2;
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1; // avoid /0
    const ox = -dy * 0.15;
    const oy = dx * 0.15;

    return (
        <g>
            <motion.path
                d={`M${start.x},${start.y} Q${midX + ox},${midY + oy} ${end.x},${end.y}`}
                fill="none"
                stroke={isActive ? "rgba(108, 99, 255, 0.2)" : "rgba(108, 99, 255, 0.08)"}
                strokeWidth={isActive ? "2" : "1.2"}
                animate={{
                    d: [
                        `M${start.x},${start.y} Q${midX + ox},${midY + oy} ${end.x},${end.y}`,
                        `M${start.x},${start.y} Q${midX + ox * 1.2},${midY + oy * 1.2} ${end.x},${end.y}`,
                        `M${start.x},${start.y} Q${midX + ox},${midY + oy} ${end.x},${end.y}`,
                    ]
                }}
                transition={{
                    duration: mounted ? 10 + Math.random() * 5 : 12,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
            />

            <motion.path
                d={`M${start.x},${start.y} Q${midX + ox},${midY + oy} ${end.x},${end.y}`}
                fill="none"
                stroke="url(#filamentGradient)"
                strokeWidth={isActive ? "3" : "2.5"}
                strokeDasharray="50 150"
                animate={{
                    strokeDashoffset: [400, 0],
                    opacity: isActive ? [0.4, 0.9, 0.4] : [0.2, 0.5, 0.2],
                }}
                transition={{
                    duration: isActive ? dist / 60 : dist / 30,
                    repeat: Infinity,
                    ease: "linear",
                }}
                style={{ filter: isActive ? 'blur(2px)' : 'blur(1px)' }}
            />
        </g>
    );
};

const CosmicGraph: React.FC<CosmicGraphProps> = ({ agents, activePipelines }) => {
    const nodes = useMemo(() => {
        return agents.map((agent, i) => {
            const angle = (i / agents.length) * Math.PI * 2;
            const radius = 220;
            return {
                agent,
                x: 400 + Math.cos(angle) * radius,
                y: 350 + Math.sin(angle) * radius,
            };
        });
    }, [agents]);

    const nodeMap = useMemo(() => {
        const map: Record<string, { x: number; y: number }> = {};
        nodes.forEach(n => {
            // Store both exact and normalized (lowercase trimmed) keys for resilient lookup
            const key = n.agent.name;
            const normKey = key.trim().toLowerCase();
            map[key] = { x: n.x, y: n.y };
            map[normKey] = { x: n.x, y: n.y };
        });
        return map;
    }, [nodes]);

    const connections = useMemo(() => {
        const lines: { start: { x: number; y: number }; end: { x: number; y: number }; isActive: boolean }[] = [];
        const seen = new Set<string>();

        if (activePipelines && activePipelines.length > 0) {
            activePipelines.forEach(pipe => {
                for (let i = 0; i < pipe.results.length - 1; i++) {
                    const rawCurrent = pipe.results[i]?.agentName;
                    const rawNext = pipe.results[i + 1]?.agentName;
                    if (!rawCurrent || !rawNext) continue;
                    // Try exact match first, then normalized
                    const startNode = nodeMap[rawCurrent] ?? nodeMap[rawCurrent.trim().toLowerCase()];
                    const endNode = nodeMap[rawNext] ?? nodeMap[rawNext.trim().toLowerCase()];
                    if (startNode && endNode) {
                        lines.push({ start: startNode, end: endNode, isActive: true });
                        seen.add(`${rawCurrent}-${rawNext}`);
                    }
                }
            });
        }

        if (nodes.length > 1) {
            for (let i = 0; i < nodes.length; i++) {
                const next = (i + 1) % nodes.length;
                const key = `${nodes[i].agent.name}-${nodes[next].agent.name}`;
                if (!seen.has(key)) {
                    lines.push({ start: nodes[i], end: nodes[next], isActive: false });
                }
            }
        }
        return lines;
    }, [nodes, nodeMap, activePipelines]);

    if (agents.length === 0) return null;

    return (
        <div className="w-full h-[700px] relative overflow-hidden glass-card shadow-2xl bg-void-black/20">
            <svg
                viewBox="0 0 800 700"
                className="w-full h-full"
                xmlns="http://www.w3.org/2000/svg"
            >
                <defs>
                    <radialGradient id="starHalo">
                        <stop offset="0%" stopColor="#FFC1CC" stopOpacity="0.8" />
                        <stop offset="100%" stopColor="transparent" />
                    </radialGradient>
                    <linearGradient id="filamentGradient" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor="#6C63FF" stopOpacity="0" />
                        <stop offset="50%" stopColor="#4DA8DA" stopOpacity="0.8" />
                        <stop offset="100%" stopColor="#6C63FF" stopOpacity="0" />
                    </linearGradient>
                </defs>

                {connections.map((conn, i) => (
                    <ConnectionFilament key={i} start={conn.start} end={conn.end} isActive={conn.isActive} />
                ))}

                {nodes.map((node) => (
                    <AgentStar key={node.agent.name} agent={node.agent} x={node.x} y={node.y} />
                ))}
            </svg>

            <div className="absolute inset-0 pointer-events-none opacity-[0.03] contrast-150"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                }}
            />
        </div>
    );
};

export default CosmicGraph;
