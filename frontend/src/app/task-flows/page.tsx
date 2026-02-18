"use client";

import { useEffect, useState, useRef } from "react";
import { api } from "@/lib/api";
import { AgentCard as AgentType, RouterTask, PipelineStep, PipelineRecord, PipelineStepResult } from "@shared/types";
import JsonViewer from "@/components/JsonViewer";
import {
    GitBranch, Send, Loader2, CheckCircle, XCircle, History,
    Bot, Zap, Plus, Trash2, GripVertical, Play, ChevronDown, ChevronUp,
    ArrowRight,
} from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────
const PAYLOAD_PRESETS: Record<string, string> = {
    analyze_sentiment: JSON.stringify({ text: "The product is absolutely fantastic! I love using it every day." }, null, 2),
    summarize_text: JSON.stringify({ text: "Artificial intelligence is transforming industries across the globe. From healthcare to finance, AI-powered systems are automating complex tasks, improving accuracy, and enabling new capabilities that were previously impossible. However, this rapid advancement also raises important questions about ethics, privacy, and the future of work." }, null, 2),
    translate_text: JSON.stringify({ text: "Hello, how are you?", targetLanguage: "fr" }, null, 2),
    detect_language: JSON.stringify({ text: "Bonjour, comment allez-vous?" }, null, 2),
};
const DEFAULT_PAYLOAD = JSON.stringify({ text: "Hello, this is a test." }, null, 2);
const isSimulated = (ep: string) => ep.includes(".local") || ep.includes("example.com");

// ─── Shared sub-components ────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
    const styles: Record<string, string> = {
        completed: "bg-cosmic-teal/20 text-cosmic-teal border-cosmic-teal/30",
        failed: "bg-red-500/20 text-red-400 border-red-500/30",
        processing: "bg-solar-gold/20 text-solar-gold border-solar-gold/30",
        running: "bg-solar-gold/20 text-solar-gold border-solar-gold/30",
    };
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${styles[status] ?? "bg-white/10 text-white border-white/20"}`}>
            {(status === "processing" || status === "running") && <Loader2 className="w-3 h-3 animate-spin" />}
            {status === "completed" && <CheckCircle className="w-3 h-3" />}
            {status === "failed" && <XCircle className="w-3 h-3" />}
            {status}
        </span>
    );
}

// ─── Pipeline step node ───────────────────────────────────────────────────────
function PipelineStepNode({
    step, index, total, result, isActive,
}: {
    step: PipelineStep; index: number; total: number;
    result?: PipelineStepResult; isActive: boolean;
}) {
    const [open, setOpen] = useState(false);
    const done = result?.status === "completed";
    const failed = result?.status === "failed";
    const running = isActive && !result;

    return (
        <div className="flex items-start gap-0">
            <div className="flex flex-col items-center">
                {/* Node circle */}
                <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-500 ${done ? "bg-cosmic-teal/20 border-cosmic-teal text-cosmic-teal" :
                        failed ? "bg-red-500/20 border-red-500 text-red-400" :
                            running ? "bg-solar-gold/20 border-solar-gold text-solar-gold animate-pulse" :
                                "bg-white/5 border-white/20 text-orbit-silver/40"
                    }`}>
                    {done ? <CheckCircle className="w-4 h-4" /> :
                        failed ? <XCircle className="w-4 h-4" /> :
                            running ? <Loader2 className="w-4 h-4 animate-spin" /> :
                                <span className="text-xs font-bold">{index + 1}</span>}
                </div>
                {/* Connector line */}
                {index < total - 1 && (
                    <div className={`w-0.5 h-8 mt-1 transition-all duration-700 ${done ? "bg-cosmic-teal/50" : "bg-white/10"}`} />
                )}
            </div>

            {/* Step card */}
            <div className={`ml-4 mb-2 flex-1 rounded-xl border p-4 transition-all duration-300 ${done ? "border-cosmic-teal/30 bg-cosmic-teal/5" :
                    failed ? "border-red-500/30 bg-red-500/5" :
                        running ? "border-solar-gold/30 bg-solar-gold/5" :
                            "border-white/8 bg-white/3"
                }`}>
                <div className="flex items-center justify-between gap-2">
                    <div>
                        <span className="text-xs text-orbit-silver/40 uppercase tracking-widest">Step {index + 1}</span>
                        <p className="text-sm font-semibold text-white mt-0.5">{step.capability}</p>
                        {result?.agentName && (
                            <p className="text-[10px] text-orbit-silver/40 mt-0.5">via {result.agentName} · {result.durationMs}ms</p>
                        )}
                    </div>
                    {result && (
                        <button onClick={() => setOpen(v => !v)} className="text-orbit-silver/40 hover:text-white transition-colors">
                            {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                    )}
                </div>
                {result?.error && (
                    <p className="text-xs text-red-400 mt-2 bg-red-500/10 rounded-lg px-3 py-2">{result.error}</p>
                )}
                {open && result?.result && (
                    <div className="mt-3 border-t border-white/8 pt-3">
                        <pre className="text-[11px] text-starlight-violet/80 font-mono overflow-x-auto leading-relaxed">
                            {JSON.stringify(result.result, null, 2)}
                        </pre>
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Pipeline Builder ─────────────────────────────────────────────────────────
function PipelineBuilder({ allCapabilities }: { allCapabilities: string[] }) {
    const [steps, setSteps] = useState<Array<{ id: string; capability: string; paramsJson: string }>>([
        { id: "s1", capability: "", paramsJson: "" },
    ]);
    const [inputJson, setInputJson] = useState(JSON.stringify({ text: "Hello, how are you today?" }, null, 2));
    const [pipeline, setPipeline] = useState<PipelineRecord | null>(null);
    const [running, setRunning] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const dragIdx = useRef<number | null>(null);
    const pollRef = useRef<NodeJS.Timeout | null>(null);

    const addStep = () => setSteps(s => [...s, { id: `s${Date.now()}`, capability: "", paramsJson: "" }]);
    const removeStep = (id: string) => setSteps(s => s.filter(st => st.id !== id));
    const updateStep = (id: string, field: "capability" | "paramsJson", value: string) =>
        setSteps(s => s.map(st => st.id === id ? { ...st, [field]: value } : st));

    // Drag-to-reorder
    const onDragStart = (i: number) => { dragIdx.current = i; };
    const onDragOver = (e: React.DragEvent, i: number) => {
        e.preventDefault();
        if (dragIdx.current === null || dragIdx.current === i) return;
        setSteps(s => {
            const next = [...s];
            const [moved] = next.splice(dragIdx.current!, 1);
            next.splice(i, 0, moved);
            dragIdx.current = i;
            return next;
        });
    };
    const onDragEnd = () => { dragIdx.current = null; };

    const runPipeline = async () => {
        setError(null);
        setPipeline(null);

        // Validate
        if (steps.some(s => !s.capability)) {
            setError("All steps must have a capability selected.");
            return;
        }
        let parsedInput: any;
        try { parsedInput = JSON.parse(inputJson); }
        catch { setError("Input JSON is invalid."); return; }

        const pipelineSteps: PipelineStep[] = steps.map(s => {
            const step: PipelineStep = { capability: s.capability };
            if (s.paramsJson.trim()) {
                try { step.params = JSON.parse(s.paramsJson); } catch { /* ignore bad params */ }
            }
            return step;
        });

        setRunning(true);
        try {
            const record = await api.runPipeline(pipelineSteps, parsedInput);
            setPipeline(record);

            // Poll until done
            pollRef.current = setInterval(async () => {
                try {
                    const updated = await api.getPipeline(record.id);
                    setPipeline(updated);
                    if (updated.status !== "running") {
                        clearInterval(pollRef.current!);
                        setRunning(false);
                    }
                } catch {
                    clearInterval(pollRef.current!);
                    setRunning(false);
                }
            }, 1000);
        } catch (err: any) {
            setError(err.message || "Failed to start pipeline.");
            setRunning(false);
        }
    };

    // Cleanup on unmount
    useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

    const activeStepIndex = pipeline ? pipeline.results.length : -1;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* ── Builder ── */}
            <div className="glass-card p-8 space-y-6">
                <div className="flex items-center gap-3">
                    <GitBranch className="w-5 h-5 text-starlight-violet" />
                    <h2 className="text-lg font-display font-bold text-white">Pipeline Builder</h2>
                </div>

                {/* Steps */}
                <div className="space-y-3">
                    <label className="text-xs text-orbit-silver/50 uppercase tracking-widest font-bold">Steps</label>
                    {steps.map((step, i) => (
                        <div
                            key={step.id}
                            draggable
                            onDragStart={() => onDragStart(i)}
                            onDragOver={e => onDragOver(e, i)}
                            onDragEnd={onDragEnd}
                            className="flex items-start gap-2 p-3 rounded-xl border border-white/8 bg-white/3 cursor-grab active:cursor-grabbing group"
                        >
                            <GripVertical className="w-4 h-4 text-orbit-silver/20 mt-2.5 shrink-0 group-hover:text-orbit-silver/40 transition-colors" />
                            <div className="flex-1 space-y-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] text-orbit-silver/30 font-mono w-4">{i + 1}</span>
                                    <select
                                        title={`Step ${i + 1} capability`}
                                        value={step.capability}
                                        onChange={e => updateStep(step.id, "capability", e.target.value)}
                                        className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-starlight-violet/50 appearance-none cursor-pointer"
                                    >
                                        <option value="" className="bg-gray-900">Select capability...</option>
                                        {allCapabilities.map(cap => (
                                            <option key={cap} value={cap} className="bg-gray-900">{cap}</option>
                                        ))}
                                    </select>
                                    <button
                                        onClick={() => removeStep(step.id)}
                                        disabled={steps.length === 1}
                                        className="p-1.5 hover:bg-red-500/20 rounded-lg text-orbit-silver/30 hover:text-red-400 transition-colors disabled:opacity-20"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                                {step.capability && (
                                    <input
                                        className="w-full px-3 py-1.5 bg-white/3 border border-white/8 rounded-lg text-orbit-silver/60 text-xs font-mono placeholder-orbit-silver/20 focus:outline-none focus:border-white/20"
                                        placeholder='Extra params JSON, e.g. {"targetLanguage":"fr"}'
                                        value={step.paramsJson}
                                        onChange={e => updateStep(step.id, "paramsJson", e.target.value)}
                                    />
                                )}
                            </div>
                        </div>
                    ))}
                    <button
                        onClick={addStep}
                        className="w-full flex items-center justify-center gap-2 py-2.5 border border-dashed border-white/15 rounded-xl text-orbit-silver/40 hover:text-white hover:border-white/30 transition-all text-sm"
                    >
                        <Plus className="w-4 h-4" /> Add Step
                    </button>
                </div>

                {/* Input */}
                <div className="space-y-2">
                    <label className="text-xs text-orbit-silver/50 uppercase tracking-widest font-bold">Initial Input (JSON)</label>
                    <textarea
                        title="Initial pipeline input JSON"
                        rows={4}
                        value={inputJson}
                        onChange={e => setInputJson(e.target.value)}
                        className="w-full px-4 py-3 bg-void-black/50 border border-white/10 rounded-xl text-starlight-violet font-mono text-sm focus:outline-none focus:border-starlight-violet/50 transition-colors resize-none"
                    />
                </div>

                {error && (
                    <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{error}</p>
                )}

                <button
                    onClick={runPipeline}
                    disabled={running || steps.some(s => !s.capability)}
                    className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-starlight-violet/20 border border-starlight-violet/30 rounded-xl text-white font-bold hover:bg-starlight-violet/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed uppercase tracking-widest text-sm"
                >
                    {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                    {running ? "Running Pipeline..." : "Run Pipeline"}
                </button>
            </div>

            {/* ── Progress ── */}
            <div className="glass-card p-8 space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <ArrowRight className="w-5 h-5 text-nebula-blue" />
                        <h2 className="text-lg font-display font-bold text-white">Execution</h2>
                    </div>
                    {pipeline && <StatusBadge status={pipeline.status} />}
                </div>

                {!pipeline ? (
                    <div className="flex flex-col items-center justify-center h-48 gap-3 text-orbit-silver/30">
                        <GitBranch className="w-10 h-10" />
                        <p className="text-sm">Build a pipeline and click Run to see execution here.</p>
                    </div>
                ) : (
                    <div className="space-y-1">
                        {pipeline.steps.map((step, i) => (
                            <PipelineStepNode
                                key={i}
                                step={step}
                                index={i}
                                total={pipeline.steps.length}
                                result={pipeline.results[i]}
                                isActive={i === activeStepIndex}
                            />
                        ))}

                        {pipeline.status === "completed" && pipeline.finalResult && (
                            <div className="mt-4 p-4 rounded-xl border border-cosmic-teal/30 bg-cosmic-teal/5">
                                <p className="text-xs text-cosmic-teal uppercase tracking-widest font-bold mb-2">Final Result</p>
                                <pre className="text-[11px] text-white/80 font-mono overflow-x-auto leading-relaxed">
                                    {JSON.stringify(pipeline.finalResult, null, 2)}
                                </pre>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function TaskFlowsPage() {
    const [agents, setAgents] = useState<AgentType[]>([]);
    const [activeTab, setActiveTab] = useState<"dispatch" | "pipeline">("dispatch");

    // Dispatch state
    const [capability, setCapability] = useState("");
    const [targetAgent, setTargetAgent] = useState("");
    const [payload, setPayload] = useState(DEFAULT_PAYLOAD);
    const [task, setTask] = useState<RouterTask | null>(null);
    const [taskHistory, setTaskHistory] = useState<RouterTask[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        api.getAgents().then(setAgents).catch(console.error);
        api.getTasks().then(setTaskHistory).catch(console.error);
    }, []);

    const realAgents = agents.filter(a => a.status === "active" && !isSimulated(a.endpoint));
    const allCapabilities = Array.from(new Set(realAgents.flatMap(a => a.capabilities))).sort();
    const capableAgents = capability ? realAgents.filter(a => a.capabilities.includes(capability)) : realAgents;

    const handleCapabilityChange = (cap: string) => {
        setCapability(cap);
        setTargetAgent("");
        setPayload(PAYLOAD_PRESETS[cap] ?? DEFAULT_PAYLOAD);
    };

    const handleSubmit = async () => {
        if (!capability) return;
        setLoading(true);
        setError(null);
        setTask(null);
        try {
            let parsedPayload: any;
            try { parsedPayload = JSON.parse(payload); }
            catch { setError("Invalid JSON payload."); setLoading(false); return; }

            const submitted = await api.submitTask(capability, parsedPayload, targetAgent || undefined);
            setTask(submitted);
            setTaskHistory(prev => [submitted, ...prev]);

            if (submitted.status === "processing") {
                const poll = setInterval(async () => {
                    try {
                        const updated = await api.getTaskStatus(submitted.id);
                        setTask(updated);
                        setTaskHistory(prev => prev.map(t => t.id === updated.id ? updated : t));
                        if (updated.status !== "processing") clearInterval(poll);
                    } catch { clearInterval(poll); }
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
            {/* Header */}
            <div className="flex flex-col gap-2">
                <h1 className="text-4xl font-display font-bold text-white tracking-tighter">
                    Task <span className="text-nebula-blue">Flows</span>
                </h1>
                <p className="text-orbit-silver/60">Dispatch tasks or run multi-agent pipelines via the A2A router.</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 p-1 bg-white/5 rounded-xl w-fit border border-white/8">
                {(["dispatch", "pipeline"] as const).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all capitalize ${activeTab === tab
                                ? "bg-starlight-violet/20 text-white border border-starlight-violet/30"
                                : "text-orbit-silver/50 hover:text-white"
                            }`}
                    >
                        {tab === "dispatch" ? "Single Dispatch" : "Pipeline"}
                    </button>
                ))}
            </div>

            {/* ── Single Dispatch Tab ── */}
            {activeTab === "dispatch" && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Dispatcher */}
                    <div className="glass-card p-8 space-y-6">
                        <div className="flex items-center gap-3 mb-2">
                            <GitBranch className="w-5 h-5 text-nebula-blue" />
                            <h2 className="text-lg font-display font-bold text-white">Task Dispatcher</h2>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs text-orbit-silver/50 uppercase tracking-widest font-bold">Capability</label>
                            <select
                                id="capability-select"
                                title="Select a capability"
                                value={capability}
                                onChange={e => handleCapabilityChange(e.target.value)}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-nebula-blue/50 transition-colors appearance-none cursor-pointer"
                            >
                                <option value="" className="bg-gray-900">Select a capability...</option>
                                {allCapabilities.map(cap => (
                                    <option key={cap} value={cap} className="bg-gray-900">{cap}</option>
                                ))}
                            </select>
                            {allCapabilities.length === 0 && (
                                <p className="text-xs text-orbit-silver/40 mt-1">No real agents online. Start SentimentAgent or SummarizerAgent.</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs text-orbit-silver/50 uppercase tracking-widest font-bold flex items-center gap-2">
                                <Bot className="w-3.5 h-3.5" />
                                Target Agent
                                <span className="text-orbit-silver/30 normal-case font-normal tracking-normal">(optional — auto-routes if blank)</span>
                            </label>
                            <select
                                id="agent-select"
                                title="Select target agent"
                                value={targetAgent}
                                onChange={e => setTargetAgent(e.target.value)}
                                disabled={!capability}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-nebula-blue/50 transition-colors appearance-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                <option value="" className="bg-gray-900">Auto-route to best agent</option>
                                {capableAgents.map(a => (
                                    <option key={a.name} value={a.name} className="bg-gray-900">
                                        {a.name}{a.version ? ` (v${a.version})` : ""}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs text-orbit-silver/50 uppercase tracking-widest font-bold flex items-center gap-2">
                                <Zap className="w-3.5 h-3.5" />
                                Payload (JSON)
                                {capability && PAYLOAD_PRESETS[capability] && (
                                    <span className="text-nebula-blue/70 normal-case font-normal tracking-normal text-[10px]">✦ preset loaded</span>
                                )}
                            </label>
                            <textarea
                                id="payload-textarea"
                                title="JSON payload for the task"
                                value={payload}
                                onChange={e => setPayload(e.target.value)}
                                rows={6}
                                className="w-full px-4 py-3 bg-void-black/50 border border-white/10 rounded-xl text-starlight-violet font-mono text-sm focus:outline-none focus:border-nebula-blue/50 transition-colors resize-none custom-scrollbar"
                            />
                        </div>

                        {error && (
                            <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{error}</p>
                        )}

                        <button
                            id="dispatch-btn"
                            onClick={handleSubmit}
                            disabled={loading || !capability}
                            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-nebula-blue/20 border border-nebula-blue/30 rounded-xl text-white font-bold hover:bg-nebula-blue/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed uppercase tracking-widest text-sm"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            {loading ? "Dispatching..." : "Dispatch Task"}
                        </button>
                    </div>

                    {/* Result + History */}
                    <div className="space-y-6">
                        {task && (
                            <div className="glass-card p-6 space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-display font-bold text-white">Result</h3>
                                    <StatusBadge status={task.status} />
                                </div>
                                {task.result ? (
                                    <JsonViewer data={task.result} />
                                ) : (
                                    <div className="flex items-center gap-2 text-orbit-silver/40 text-sm">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Waiting for agent response...
                                    </div>
                                )}
                                <p className="text-[10px] text-orbit-silver/30 font-mono">
                                    Task ID: {task.id} · Agent: {task.assignedAgent ?? "—"}
                                </p>
                            </div>
                        )}

                        <div className="glass-card p-6 space-y-4">
                            <div className="flex items-center gap-2">
                                <History className="w-4 h-4 text-orbit-silver/40" />
                                <h3 className="font-display font-bold text-white">Task History</h3>
                                <span className="text-xs text-orbit-silver/30">({taskHistory.length})</span>
                            </div>
                            <div className="space-y-2 max-h-80 overflow-y-auto custom-scrollbar pr-1">
                                {taskHistory.length === 0 ? (
                                    <p className="text-orbit-silver/40 text-sm py-4 text-center">No tasks dispatched yet.</p>
                                ) : taskHistory.map(t => (
                                    <div key={t.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${t.id === task?.id ? "border-nebula-blue/30 bg-nebula-blue/5" : "border-white/6 bg-white/2"}`}>
                                        <div className={t.status === "completed" ? "text-cosmic-teal" : t.status === "failed" ? "text-red-400" : "text-solar-gold"}>
                                            {t.status === "completed" ? <CheckCircle className="w-4 h-4" /> : t.status === "failed" ? <XCircle className="w-4 h-4" /> : <Loader2 className="w-4 h-4 animate-spin" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-white truncate">{t.capability}</p>
                                            <p className="text-[10px] text-orbit-silver/30 font-mono">{t.id} · {t.assignedAgent}</p>
                                        </div>
                                        <StatusBadge status={t.status} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Pipeline Tab ── */}
            {activeTab === "pipeline" && (
                <PipelineBuilder allCapabilities={allCapabilities} />
            )}
        </div>
    );
}
