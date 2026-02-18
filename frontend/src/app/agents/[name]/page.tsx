"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { AgentCard, RouterTask, AgentLog } from "@shared/types";
import {
    ArrowLeft, Users, Code, Server, Clock, Zap, Globe,
    CheckCircle, XCircle, Loader2, ChevronDown, ChevronUp,
    AlertTriangle, Activity, Tag, Cpu, GitCommit,
} from "lucide-react";

// ─── helpers ──────────────────────────────────────────────────────────────────
const isSimulated = (endpoint: string) =>
    endpoint.includes(".local") || endpoint.includes("example.com");

const timeAgo = (ms: number): string => {
    const diff = Date.now() - ms;
    if (diff < 60_000) return `${Math.floor(diff / 1000)}s ago`;
    if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
    return `${Math.floor(diff / 3_600_000)}h ago`;
};

const statusColor = (status: string) => {
    if (status === "completed") return "text-cosmic-teal bg-cosmic-teal/10 border-cosmic-teal/30";
    if (status === "failed") return "text-red-400 bg-red-400/10 border-red-400/30";
    if (status === "processing") return "text-solar-gold bg-solar-gold/10 border-solar-gold/30";
    return "text-orbit-silver/60 bg-white/5 border-white/10";
};

const logTypeColor = (type: string) => {
    if (type === "register") return "text-cosmic-teal bg-cosmic-teal/10";
    if (type === "heartbeat") return "text-nebula-blue bg-nebula-blue/10";
    if (type === "task_request") return "text-starlight-violet bg-starlight-violet/10";
    if (type === "task_response") return "text-cosmic-teal bg-cosmic-teal/10";
    if (type === "task_error") return "text-red-400 bg-red-400/10";
    if (type === "delete") return "text-red-400 bg-red-400/10";
    return "text-orbit-silver/60 bg-white/5";
};

// ─── Heartbeat Sparkline ──────────────────────────────────────────────────────
function HeartbeatSparkline({ logs }: { logs: AgentLog[] }) {
    const heartbeats = logs
        .filter(l => l.type === "heartbeat")
        .slice(-20)
        .map(l => l.timestamp);

    if (heartbeats.length < 2) {
        return (
            <div className="flex items-center gap-2 text-xs text-orbit-silver/40">
                <Activity className="w-3.5 h-3.5" />
                <span>Waiting for heartbeat data...</span>
            </div>
        );
    }

    const min = Math.min(...heartbeats);
    const max = Math.max(...heartbeats);
    const range = max - min || 1;
    const W = 200;
    const H = 32;
    const pts = heartbeats.map((t, i) => {
        const x = (i / (heartbeats.length - 1)) * W;
        const y = H - ((t - min) / range) * H * 0.8 - H * 0.1;
        return `${x},${y}`;
    }).join(" ");

    return (
        <div className="flex items-center gap-3">
            <svg width={W} height={H} className="overflow-visible">
                <polyline
                    points={pts}
                    fill="none"
                    stroke="rgb(78,168,218)"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity="0.8"
                />
                {heartbeats.map((_, i) => {
                    const [x, y] = pts.split(" ")[i].split(",").map(Number);
                    return <circle key={i} cx={x} cy={y} r="2" fill="rgb(78,168,218)" opacity="0.6" />;
                })}
            </svg>
            <span className="text-xs text-orbit-silver/40">{heartbeats.length} beats</span>
        </div>
    );
}

// ─── Log Entry ────────────────────────────────────────────────────────────────
function LogEntry({ log }: { log: AgentLog }) {
    const [open, setOpen] = useState(false);
    return (
        <div className="border border-white/6 rounded-xl overflow-hidden">
            <button
                onClick={() => setOpen(v => !v)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/3 transition-colors text-left"
            >
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${logTypeColor(log.type)}`}>
                    {log.type}
                </span>
                <span className="text-sm text-orbit-silver/80 flex-1 truncate">{log.message}</span>
                <span className="text-[10px] text-orbit-silver/30 shrink-0">{timeAgo(log.timestamp)}</span>
                {log.data && (open ? <ChevronUp className="w-3.5 h-3.5 text-orbit-silver/30 shrink-0" /> : <ChevronDown className="w-3.5 h-3.5 text-orbit-silver/30 shrink-0" />)}
            </button>
            {open && log.data && (
                <div className="px-4 pb-3 border-t border-white/6">
                    <pre className="text-[11px] text-starlight-violet/80 font-mono overflow-x-auto custom-scrollbar pt-3 leading-relaxed">
                        {JSON.stringify(log.data, null, 2)}
                    </pre>
                </div>
            )}
        </div>
    );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function AgentDetailPage() {
    const params = useParams();
    const router = useRouter();
    const name = decodeURIComponent(params.name as string);

    const [agent, setAgent] = useState<AgentCard | null>(null);
    const [agentTasks, setAgentTasks] = useState<RouterTask[]>([]);
    const [logs, setLogs] = useState<AgentLog[]>([]);
    const [notFound, setNotFound] = useState(false);
    const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

    const refresh = useCallback(async () => {
        try {
            const [a, t, l] = await Promise.all([
                api.getAgent(name),
                api.getAgentTasks(name),
                api.getAgentLogs(name),
            ]);
            setAgent(a);
            setAgentTasks(t);
            setLogs(l);
            setLastRefresh(new Date());
        } catch {
            setNotFound(true);
        }
    }, [name]);

    useEffect(() => {
        refresh();
        const id = setInterval(refresh, 10_000);
        return () => clearInterval(id);
    }, [refresh]);

    if (notFound) {
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
                <Users className="w-12 h-12 text-orbit-silver/20" />
                <p className="text-orbit-silver/50">Agent &ldquo;{name}&rdquo; not found.</p>
                <Link href="/agents" className="text-starlight-violet hover:underline text-sm">← Back to Registry</Link>
            </div>
        );
    }

    if (!agent) {
        return (
            <div className="space-y-6 animate-pulse">
                <div className="h-8 bg-white/5 rounded-xl w-48" />
                <div className="glass-card h-48" />
                <div className="grid grid-cols-2 gap-6">
                    <div className="glass-card h-64" />
                    <div className="glass-card h-64" />
                </div>
            </div>
        );
    }

    const simulated = isSimulated(agent.endpoint);
    const completedTasks = agentTasks.filter(t => t.status === "completed").length;
    const failedTasks = agentTasks.filter(t => t.status === "failed").length;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

            {/* ── Breadcrumb ── */}
            <div className="flex items-center justify-between">
                <Link
                    href="/agents"
                    className="flex items-center gap-2 text-sm text-orbit-silver/50 hover:text-white transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Agent Registry
                </Link>
                <div className="flex items-center gap-2 text-xs text-orbit-silver/30">
                    <Activity className="w-3.5 h-3.5 text-cosmic-teal animate-pulse" />
                    <span>Live · {timeAgo(lastRefresh.getTime())}</span>
                </div>
            </div>

            {/* ── Hero card ── */}
            <div className="glass-card p-8 relative overflow-hidden">
                <div className="absolute -right-24 -top-24 w-64 h-64 bg-starlight-violet/8 rounded-full blur-3xl pointer-events-none" />
                <div className="relative z-10 flex flex-col md:flex-row md:items-start gap-6">
                    {/* Icon */}
                    <div className="p-5 bg-astral-indigo/40 rounded-2xl shrink-0">
                        <Users className="w-10 h-10 text-starlight-violet" />
                    </div>

                    {/* Identity */}
                    <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-3 mb-2">
                            <h1 className="text-3xl font-display font-bold text-white tracking-tighter">{agent.name}</h1>
                            {agent.version && (
                                <span className="px-2.5 py-1 text-xs font-mono font-bold rounded-full bg-nebula-blue/10 text-nebula-blue border border-nebula-blue/20">
                                    v{agent.version}
                                </span>
                            )}
                            {simulated && (
                                <span className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-full bg-solar-gold/10 text-solar-gold border border-solar-gold/30">
                                    <AlertTriangle className="w-3 h-3" /> Simulated
                                </span>
                            )}
                            <span className={`px-2.5 py-1 text-xs font-bold rounded-full border ${statusColor(agent.status)}`}>
                                {agent.status}
                            </span>
                        </div>
                        <p className="text-orbit-silver/60 text-sm mb-1">{agent.role}</p>
                        <p className="text-orbit-silver/80 text-sm max-w-2xl">{agent.description || <span className="italic text-orbit-silver/30">No description</span>}</p>
                    </div>

                    {/* Quick stats */}
                    <div className="flex gap-6 shrink-0">
                        <div className="text-center">
                            <p className="text-2xl font-display font-bold text-white">{agentTasks.length}</p>
                            <p className="text-[10px] text-orbit-silver/40 uppercase tracking-widest">Tasks</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-display font-bold text-cosmic-teal">{completedTasks}</p>
                            <p className="text-[10px] text-orbit-silver/40 uppercase tracking-widest">Done</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-display font-bold text-red-400">{failedTasks}</p>
                            <p className="text-[10px] text-orbit-silver/40 uppercase tracking-widest">Failed</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Metadata + Capabilities ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Metadata */}
                <div className="glass-card p-7 space-y-5">
                    <h2 className="text-lg font-display font-bold text-white">Metadata</h2>
                    <div className="space-y-4">
                        {[
                            { icon: Code, label: "Framework", value: agent.framework || "Generic" },
                            { icon: Server, label: "Provider", value: agent.provider || "Unknown" },
                            { icon: Globe, label: "Endpoint", value: agent.endpoint, mono: true },
                            { icon: Clock, label: "Last Heartbeat", value: agent.lastHeartbeat ? `${new Date(agent.lastHeartbeat).toLocaleTimeString()} (${timeAgo(agent.lastHeartbeat)})` : "—" },
                        ].map(({ icon: Icon, label, value, mono }) => (
                            <div key={label} className="flex items-start gap-3">
                                <Icon className="w-4 h-4 text-orbit-silver/30 mt-0.5 shrink-0" />
                                <div className="min-w-0">
                                    <p className="text-[10px] text-orbit-silver/40 uppercase tracking-widest">{label}</p>
                                    <p className={`text-sm text-orbit-silver/80 mt-0.5 break-all ${mono ? "font-mono" : ""}`}>{value}</p>
                                </div>
                            </div>
                        ))}

                        {/* Versioning */}
                        {(agent.version || agent.build || agent.model) && (
                            <div className="pt-3 border-t border-white/6 grid grid-cols-3 gap-4">
                                {agent.version && (
                                    <div>
                                        <div className="flex items-center gap-1 mb-1">
                                            <Tag className="w-3 h-3 text-orbit-silver/30" />
                                            <p className="text-[10px] text-orbit-silver/40 uppercase tracking-widest">Version</p>
                                        </div>
                                        <p className="text-sm text-nebula-blue font-mono">v{agent.version}</p>
                                    </div>
                                )}
                                {agent.build && (
                                    <div>
                                        <div className="flex items-center gap-1 mb-1">
                                            <GitCommit className="w-3 h-3 text-orbit-silver/30" />
                                            <p className="text-[10px] text-orbit-silver/40 uppercase tracking-widest">Build</p>
                                        </div>
                                        <p className="text-sm text-orbit-silver/80 font-mono">{agent.build}</p>
                                    </div>
                                )}
                                {agent.model && (
                                    <div>
                                        <div className="flex items-center gap-1 mb-1">
                                            <Cpu className="w-3 h-3 text-orbit-silver/30" />
                                            <p className="text-[10px] text-orbit-silver/40 uppercase tracking-widest">Model</p>
                                        </div>
                                        <p className="text-sm text-orbit-silver/80">{agent.model}</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Capabilities + Heartbeat */}
                <div className="space-y-6">
                    <div className="glass-card p-7 space-y-4">
                        <h2 className="text-lg font-display font-bold text-white">Capabilities</h2>
                        <div className="flex flex-wrap gap-2">
                            {agent.capabilities.map(cap => (
                                <span key={cap} className="flex items-center gap-1.5 px-3 py-1.5 bg-starlight-violet/10 border border-starlight-violet/20 rounded-lg text-sm text-starlight-violet/90 font-medium">
                                    <Zap className="w-3 h-3" />
                                    {cap}
                                </span>
                            ))}
                        </div>
                    </div>

                    <div className="glass-card p-7 space-y-4">
                        <h2 className="text-lg font-display font-bold text-white">Heartbeat Timeline</h2>
                        <HeartbeatSparkline logs={logs} />
                        <p className="text-xs text-orbit-silver/30">Last {Math.min(logs.filter(l => l.type === "heartbeat").length, 20)} heartbeat events</p>
                    </div>
                </div>
            </div>

            {/* ── Tasks + Logs ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Recent Tasks */}
                <div className="glass-card p-7 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-display font-bold text-white">Recent Tasks</h2>
                        <span className="text-xs text-orbit-silver/40">{agentTasks.length} total</span>
                    </div>
                    <div className="space-y-2 max-h-80 overflow-y-auto custom-scrollbar pr-1">
                        {agentTasks.length === 0 ? (
                            <p className="text-orbit-silver/40 text-sm py-8 text-center">No tasks assigned yet.</p>
                        ) : agentTasks.map(task => (
                            <div key={task.id} className="flex items-start gap-3 p-3 rounded-xl bg-white/3 hover:bg-white/5 transition-colors">
                                <div className={`mt-0.5 shrink-0 ${task.status === "completed" ? "text-cosmic-teal" : task.status === "failed" ? "text-red-400" : "text-solar-gold"}`}>
                                    {task.status === "completed" ? <CheckCircle className="w-4 h-4" /> : task.status === "failed" ? <XCircle className="w-4 h-4" /> : <Loader2 className="w-4 h-4 animate-spin" />}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="text-sm font-semibold text-white truncate">{task.capability}</span>
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full border shrink-0 ${statusColor(task.status)}`}>{task.status}</span>
                                    </div>
                                    <span className="text-[10px] font-mono text-orbit-silver/30">{task.id} · {timeAgo(task.createdAt)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Logs */}
                <div className="glass-card p-7 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-display font-bold text-white">Activity Logs</h2>
                        <span className="text-xs text-orbit-silver/40">{logs.length} entries</span>
                    </div>
                    <div className="space-y-2 max-h-80 overflow-y-auto custom-scrollbar pr-1">
                        {logs.length === 0 ? (
                            <p className="text-orbit-silver/40 text-sm py-8 text-center">No logs yet.</p>
                        ) : [...logs].reverse().map(log => (
                            <LogEntry key={log.id} log={log} />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
