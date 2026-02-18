"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { AgentCard as AgentType, RouterTask } from "@shared/types";
import JsonViewer from "@/components/JsonViewer";
import { GitBranch, Send, Loader2, CheckCircle, XCircle, History, Bot, Zap } from "lucide-react";

// Payload presets keyed by capability
const PAYLOAD_PRESETS: Record<string, string> = {
    analyze_sentiment: JSON.stringify({ text: "The product is absolutely fantastic! I love using it every day." }, null, 2),
    summarize: JSON.stringify({ text: "Artificial intelligence is transforming industries across the globe. From healthcare to finance, AI-powered systems are automating complex tasks, improving accuracy, and enabling new capabilities that were previously impossible. However, this rapid advancement also raises important questions about ethics, privacy, and the future of work." }, null, 2),
    translate_text: JSON.stringify({ text: "Hello, how are you?", targetLanguage: "fr" }, null, 2),
    detect_language: JSON.stringify({ text: "Bonjour, comment allez-vous?" }, null, 2),
    classify: JSON.stringify({ text: "Breaking news: Scientists discover new exoplanet in habitable zone.", categories: ["science", "politics", "sports", "entertainment"] }, null, 2),
    extract_entities: JSON.stringify({ text: "Elon Musk announced that Tesla will open a new factory in Austin, Texas next year." }, null, 2),
};

const DEFAULT_PAYLOAD = JSON.stringify({ text: "Hello, this is a test." }, null, 2);

const isSimulated = (endpoint: string) =>
    endpoint.includes(".local") || endpoint.includes("example.com");

function StatusBadge({ status }: { status: string }) {
    const styles: Record<string, string> = {
        completed: "bg-cosmic-teal/20 text-cosmic-teal border-cosmic-teal/30",
        failed: "bg-red-500/20 text-red-400 border-red-500/30",
        processing: "bg-solar-gold/20 text-solar-gold border-solar-gold/30",
    };
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${styles[status] ?? "bg-white/10 text-white border-white/20"}`}>
            {status === "processing" && <Loader2 className="w-3 h-3 animate-spin" />}
            {status === "completed" && <CheckCircle className="w-3 h-3" />}
            {status === "failed" && <XCircle className="w-3 h-3" />}
            {status}
        </span>
    );
}

export default function TaskFlowsPage() {
    const [agents, setAgents] = useState<AgentType[]>([]);
    const [capability, setCapability] = useState("");
    const [targetAgent, setTargetAgent] = useState(""); // "" = auto-route
    const [payload, setPayload] = useState(DEFAULT_PAYLOAD);
    const [task, setTask] = useState<RouterTask | null>(null);
    const [taskHistory, setTaskHistory] = useState<RouterTask[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        api.getAgents().then(setAgents).catch(console.error);
        // Load initial task history
        api.getTasks().then(setTaskHistory).catch(console.error);
    }, []);

    // Real agents only (non-simulated, active)
    const realAgents = agents.filter(a => a.status === "active" && !isSimulated(a.endpoint));

    // Capabilities from real agents only
    const allCapabilities = Array.from(
        new Set(realAgents.flatMap((a) => a.capabilities))
    ).sort();

    // Agents that support the selected capability
    const capableAgents = capability
        ? realAgents.filter(a => a.capabilities.includes(capability))
        : realAgents;

    // Auto-fill payload preset when capability changes
    const handleCapabilityChange = (cap: string) => {
        setCapability(cap);
        setTargetAgent(""); // reset agent selection
        if (PAYLOAD_PRESETS[cap]) {
            setPayload(PAYLOAD_PRESETS[cap]);
        } else if (cap) {
            setPayload(DEFAULT_PAYLOAD);
        }
    };

    const handleSubmit = async () => {
        if (!capability) return;
        setLoading(true);
        setError(null);
        setTask(null);

        try {
            let parsedPayload: any;
            try {
                parsedPayload = JSON.parse(payload);
            } catch {
                setError("Invalid JSON payload.");
                setLoading(false);
                return;
            }

            const submitted = await api.submitTask(capability, parsedPayload, targetAgent || undefined);
            setTask(submitted);
            setTaskHistory(prev => [submitted, ...prev]);

            // Poll for result
            if (submitted.status === "processing") {
                const poll = setInterval(async () => {
                    try {
                        const updated = await api.getTaskStatus(submitted.id);
                        setTask(updated);
                        // Update history entry
                        setTaskHistory(prev => prev.map(t => t.id === updated.id ? updated : t));
                        if (updated.status !== "processing") clearInterval(poll);
                    } catch {
                        clearInterval(poll);
                    }
                }, 1000);
                setTimeout(() => clearInterval(poll), 15000);
            }
        } catch (err: any) {
            setError(err.message || "Failed to submit task.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col gap-2">
                <h1 className="text-4xl font-display font-bold text-white tracking-tighter">
                    Task <span className="text-nebula-blue">Flows</span>
                </h1>
                <p className="text-orbit-silver/60">
                    Dispatch tasks to agents via the A2A router and observe live results.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Dispatcher */}
                <div className="glass-card p-8 space-y-6">
                    <div className="flex items-center gap-3 mb-2">
                        <GitBranch className="w-5 h-5 text-nebula-blue" />
                        <h2 className="text-lg font-display font-bold text-white">Task Dispatcher</h2>
                    </div>

                    {/* Capability picker */}
                    <div className="space-y-2">
                        <label className="text-xs text-orbit-silver/50 uppercase tracking-widest font-bold">
                            Capability
                        </label>
                        <select
                            id="capability-select"
                            value={capability}
                            onChange={(e) => handleCapabilityChange(e.target.value)}
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-nebula-blue/50 transition-colors appearance-none cursor-pointer"
                        >
                            <option value="" className="bg-gray-900">Select a capability...</option>
                            {allCapabilities.map((cap) => (
                                <option key={cap} value={cap} className="bg-gray-900">{cap}</option>
                            ))}
                        </select>
                        {allCapabilities.length === 0 && (
                            <p className="text-xs text-orbit-silver/40 mt-1">
                                No real agents online. Start SentimentAgent or SummarizerAgent.
                            </p>
                        )}
                    </div>

                    {/* Agent picker */}
                    <div className="space-y-2">
                        <label className="text-xs text-orbit-silver/50 uppercase tracking-widest font-bold flex items-center gap-2">
                            <Bot className="w-3.5 h-3.5" />
                            Target Agent
                            <span className="text-orbit-silver/30 normal-case font-normal tracking-normal">(optional — auto-routes if blank)</span>
                        </label>
                        <select
                            id="agent-select"
                            value={targetAgent}
                            onChange={(e) => setTargetAgent(e.target.value)}
                            disabled={!capability}
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-nebula-blue/50 transition-colors appearance-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            <option value="" className="bg-gray-900">Auto-route to best agent</option>
                            {capableAgents.map((a) => (
                                <option key={a.name} value={a.name} className="bg-gray-900">
                                    {a.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Payload */}
                    <div className="space-y-2">
                        <label className="text-xs text-orbit-silver/50 uppercase tracking-widest font-bold flex items-center gap-2">
                            <Zap className="w-3.5 h-3.5" />
                            Payload (JSON)
                            {capability && PAYLOAD_PRESETS[capability] && (
                                <span className="text-nebula-blue/70 normal-case font-normal tracking-normal text-[10px]">
                                    ✦ preset loaded
                                </span>
                            )}
                        </label>
                        <textarea
                            id="payload-textarea"
                            value={payload}
                            onChange={(e) => setPayload(e.target.value)}
                            rows={6}
                            className="w-full px-4 py-3 bg-void-black/50 border border-white/10 rounded-xl text-starlight-violet font-mono text-sm focus:outline-none focus:border-nebula-blue/50 transition-colors resize-none custom-scrollbar"
                        />
                    </div>

                    <button
                        id="dispatch-btn"
                        onClick={handleSubmit}
                        disabled={loading || !capability}
                        className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-nebula-blue/20 border border-nebula-blue/30 rounded-xl text-white font-bold hover:bg-nebula-blue/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed uppercase tracking-widest text-sm"
                    >
                        {loading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Send className="w-4 h-4" />
                        )}
                        {loading ? "Dispatching..." : "Dispatch Task"}
                    </button>

                    {error && (
                        <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                            <XCircle className="w-4 h-4 shrink-0" />
                            {error}
                        </div>
                    )}
                </div>

                {/* Result Panel */}
                <div className="glass-card p-8 space-y-6">
                    <div className="flex items-center gap-3 mb-2">
                        <CheckCircle className="w-5 h-5 text-cosmic-teal" />
                        <h2 className="text-lg font-display font-bold text-white">Live Result</h2>
                    </div>

                    {!task ? (
                        <div className="flex flex-col items-center justify-center h-64 text-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                                <GitBranch className="w-8 h-8 text-orbit-silver/20" />
                            </div>
                            <p className="text-orbit-silver/40 text-sm">
                                Dispatch a task to see live results here.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Routing path visualization */}
                            <div className="flex items-center gap-2 text-xs text-orbit-silver/50 bg-white/5 rounded-xl px-4 py-3 border border-white/5">
                                <GitBranch className="w-3.5 h-3.5 text-nebula-blue shrink-0" />
                                <span className="text-nebula-blue font-bold">Router</span>
                                <span className="text-orbit-silver/30">→</span>
                                <span className="text-white font-bold">{task.assignedAgent || "—"}</span>
                                <span className="text-orbit-silver/30 ml-auto">via {task.capability}</span>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {[
                                    { label: "Task ID", value: task.id },
                                    { label: "Status", value: task.status, isStatus: true },
                                    { label: "Capability", value: task.capability },
                                    { label: "Agent", value: task.assignedAgent || "—" },
                                ].map(({ label, value, isStatus }) => (
                                    <div key={label} className="bg-white/5 rounded-xl p-3">
                                        <p className="text-[10px] text-orbit-silver/40 uppercase tracking-widest">{label}</p>
                                        {isStatus ? (
                                            <div className="mt-1"><StatusBadge status={value} /></div>
                                        ) : (
                                            <p className="text-sm font-bold mt-1 text-white truncate">{value}</p>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {task.result && (
                                <JsonViewer data={task.result} title="Agent Response" />
                            )}

                            {task.status === "processing" && (
                                <div className="flex items-center gap-2 text-solar-gold text-sm">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Waiting for agent response...
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Task History Panel */}
            {taskHistory.length > 0 && (
                <div className="glass-card p-6 space-y-4">
                    <div className="flex items-center gap-3">
                        <History className="w-4 h-4 text-orbit-silver/50" />
                        <h2 className="text-sm font-bold text-orbit-silver/50 uppercase tracking-widest">
                            Task History
                        </h2>
                        <span className="ml-auto text-xs text-orbit-silver/30">{taskHistory.length} task{taskHistory.length !== 1 ? "s" : ""}</span>
                    </div>
                    <div className="space-y-2">
                        {taskHistory.map((t) => (
                            <div
                                key={t.id}
                                onClick={() => setTask(t)}
                                className={`flex items-center gap-4 px-4 py-3 rounded-xl border cursor-pointer transition-all hover:bg-white/5 ${task?.id === t.id ? "border-nebula-blue/40 bg-nebula-blue/5" : "border-white/5 bg-white/[0.02]"}`}
                            >
                                <StatusBadge status={t.status} />
                                <span className="text-sm text-white font-medium flex-1 truncate">{t.capability}</span>
                                <span className="text-xs text-orbit-silver/40 shrink-0">{t.assignedAgent || "—"}</span>
                                <span className="text-xs text-orbit-silver/30 font-mono shrink-0">{t.id}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Available Agents Reference */}
            <div className="glass-card p-6">
                <h2 className="text-sm font-bold text-orbit-silver/50 uppercase tracking-widest mb-4">
                    Available Real Agents
                </h2>
                {realAgents.length === 0 ? (
                    <p className="text-sm text-orbit-silver/40">No real agents online. Simulated agents are excluded from routing.</p>
                ) : (
                    <div className="flex flex-wrap gap-3">
                        {realAgents.map((agent) => (
                            <div key={agent.name} className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-lg">
                                <div className="w-1.5 h-1.5 rounded-full bg-cosmic-teal" />
                                <span className="text-sm text-white font-medium">{agent.name}</span>
                                <span className="text-xs text-orbit-silver/40">{agent.capabilities.join(", ")}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
