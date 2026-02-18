"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { AgentCard as AgentType, RouterTask } from "@shared/types";
import JsonViewer from "@/components/JsonViewer";
import { GitBranch, Send, Loader2, CheckCircle, XCircle } from "lucide-react";

export default function TaskFlowsPage() {
    const [agents, setAgents] = useState<AgentType[]>([]);
    const [capability, setCapability] = useState("");
    const [payload, setPayload] = useState('{\n  "text": "Hello, this is a great day!"\n}');
    const [task, setTask] = useState<RouterTask | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        api.getAgents().then(setAgents).catch(console.error);
    }, []);

    const allCapabilities = Array.from(
        new Set(agents.flatMap((a) => a.capabilities))
    ).sort();

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

            const submitted = await api.submitTask(capability, parsedPayload);
            setTask(submitted);

            // Poll for result
            if (submitted.status === "processing") {
                const poll = setInterval(async () => {
                    try {
                        const updated = await api.getTaskStatus(submitted.id);
                        setTask(updated);
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

                    <div className="space-y-2">
                        <label className="text-xs text-orbit-silver/50 uppercase tracking-widest font-bold">
                            Capability
                        </label>
                        <select
                            value={capability}
                            onChange={(e) => setCapability(e.target.value)}
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-nebula-blue/50 transition-colors appearance-none cursor-pointer"
                        >
                            <option value="" className="bg-gray-900">Select a capability...</option>
                            {allCapabilities.map((cap) => (
                                <option key={cap} value={cap} className="bg-gray-900">{cap}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs text-orbit-silver/50 uppercase tracking-widest font-bold">
                            Payload (JSON)
                        </label>
                        <textarea
                            value={payload}
                            onChange={(e) => setPayload(e.target.value)}
                            rows={6}
                            className="w-full px-4 py-3 bg-void-black/50 border border-white/10 rounded-xl text-starlight-violet font-mono text-sm focus:outline-none focus:border-nebula-blue/50 transition-colors resize-none custom-scrollbar"
                        />
                    </div>

                    <button
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
                            <div className="grid grid-cols-2 gap-4">
                                {[
                                    { label: "Task ID", value: task.id },
                                    { label: "Status", value: task.status },
                                    { label: "Capability", value: task.capability },
                                    { label: "Agent", value: task.assignedAgent || "—" },
                                ].map(({ label, value }) => (
                                    <div key={label} className="bg-white/5 rounded-xl p-3">
                                        <p className="text-[10px] text-orbit-silver/40 uppercase tracking-widest">{label}</p>
                                        <p className={`text-sm font-bold mt-1 ${value === "completed" ? "text-cosmic-teal" :
                                                value === "failed" ? "text-red-400" :
                                                    value === "processing" ? "text-solar-gold" :
                                                        "text-white"
                                            }`}>
                                            {value}
                                        </p>
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

            {/* Active Agents Reference */}
            <div className="glass-card p-6">
                <h2 className="text-sm font-bold text-orbit-silver/50 uppercase tracking-widest mb-4">
                    Available Agents
                </h2>
                <div className="flex flex-wrap gap-3">
                    {agents.filter(a => a.status === "active").map((agent) => (
                        <div key={agent.name} className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-lg">
                            <div className="w-1.5 h-1.5 rounded-full bg-cosmic-teal" />
                            <span className="text-sm text-white font-medium">{agent.name}</span>
                            <span className="text-xs text-orbit-silver/40">{agent.capabilities.join(", ")}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
