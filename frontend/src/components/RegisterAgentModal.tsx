"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { AgentCard } from "@shared/types";
import { X, Plus, Loader2, CheckCircle, ChevronDown, ChevronUp } from "lucide-react";

interface RegisterAgentModalProps {
    onClose: () => void;
    onRegistered: (agent: AgentCard) => void;
}

const FIELD_CLASSES =
    "w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-orbit-silver/30 focus:outline-none focus:border-starlight-violet/60 transition-colors text-sm";

export default function RegisterAgentModal({ onClose, onRegistered }: RegisterAgentModalProps) {
    const [form, setForm] = useState({
        name: "",
        role: "",
        description: "",
        endpoint: "",
        capabilities: "",
        framework: "",
        provider: "",
        version: "",
        build: "",
        model: "",
    });
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        setForm((f) => ({ ...f, [field]: e.target.value }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name || !form.role || !form.endpoint || !form.capabilities) {
            setError("Name, Role, Endpoint and Capabilities are required.");
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const agent = await api.registerAgent({
                name: form.name.trim(),
                role: form.role.trim(),
                description: form.description.trim(),
                endpoint: form.endpoint.trim(),
                capabilities: form.capabilities.split(",").map((c) => c.trim()).filter(Boolean),
                status: "active",
                framework: form.framework.trim() || undefined,
                provider: form.provider.trim() || undefined,
                version: form.version.trim() || undefined,
                build: form.build.trim() || undefined,
                model: form.model.trim() || undefined,
            } as any);
            setSuccess(true);
            setTimeout(() => {
                onRegistered(agent);
                onClose();
            }, 800);
        } catch (err: any) {
            setError(err.message || "Registration failed.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div
                className="glass-card w-full max-w-lg p-8 space-y-6 relative"
                onClick={(e) => e.stopPropagation()}
                style={{ animation: "slideUp 0.2s ease" }}
            >
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-display font-bold text-white">Register Agent</h2>
                        <p className="text-sm text-orbit-silver/50 mt-1">
                            Connect a new autonomous worker to the bridge.
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-xl transition-colors text-orbit-silver/50 hover:text-white"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {success ? (
                    <div className="flex flex-col items-center justify-center py-10 gap-4">
                        <CheckCircle className="w-12 h-12 text-cosmic-teal" />
                        <p className="text-white font-bold text-lg">Agent Registered!</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] text-orbit-silver/50 uppercase tracking-widest font-bold">
                                    Name <span className="text-starlight-violet">*</span>
                                </label>
                                <input
                                    className={FIELD_CLASSES}
                                    placeholder="e.g. TranslatorAgent"
                                    value={form.name}
                                    onChange={set("name")}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] text-orbit-silver/50 uppercase tracking-widest font-bold">
                                    Role <span className="text-starlight-violet">*</span>
                                </label>
                                <input
                                    className={FIELD_CLASSES}
                                    placeholder="e.g. Translator"
                                    value={form.role}
                                    onChange={set("role")}
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] text-orbit-silver/50 uppercase tracking-widest font-bold">
                                Description
                            </label>
                            <textarea
                                className={FIELD_CLASSES + " resize-none"}
                                placeholder="What does this agent do?"
                                rows={2}
                                value={form.description}
                                onChange={set("description")}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] text-orbit-silver/50 uppercase tracking-widest font-bold">
                                Endpoint URL <span className="text-starlight-violet">*</span>
                            </label>
                            <input
                                className={FIELD_CLASSES}
                                placeholder="http://localhost:4003/a2a"
                                value={form.endpoint}
                                onChange={set("endpoint")}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] text-orbit-silver/50 uppercase tracking-widest font-bold">
                                Capabilities <span className="text-starlight-violet">*</span>
                                <span className="text-orbit-silver/30 normal-case tracking-normal ml-1">(comma-separated)</span>
                            </label>
                            <input
                                className={FIELD_CLASSES}
                                placeholder="translate_text, detect_language"
                                value={form.capabilities}
                                onChange={set("capabilities")}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] text-orbit-silver/50 uppercase tracking-widest font-bold">
                                    Framework
                                </label>
                                <input
                                    className={FIELD_CLASSES}
                                    placeholder="LangChain, CrewAI..."
                                    value={form.framework}
                                    onChange={set("framework")}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] text-orbit-silver/50 uppercase tracking-widest font-bold">
                                    Provider
                                </label>
                                <input
                                    className={FIELD_CLASSES}
                                    placeholder="OpenAI, Anthropic..."
                                    value={form.provider}
                                    onChange={set("provider")}
                                />
                            </div>
                        </div>

                        {/* Advanced toggle */}
                        <button
                            type="button"
                            onClick={() => setShowAdvanced(v => !v)}
                            className="flex items-center gap-2 text-xs text-orbit-silver/40 hover:text-orbit-silver/70 transition-colors"
                        >
                            {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            {showAdvanced ? "Hide" : "Show"} versioning fields
                        </button>

                        {showAdvanced && (
                            <div className="grid grid-cols-3 gap-4 p-4 bg-white/3 rounded-xl border border-white/8">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] text-orbit-silver/50 uppercase tracking-widest font-bold">Version</label>
                                    <input
                                        className={FIELD_CLASSES}
                                        placeholder="1.0.0"
                                        value={form.version}
                                        onChange={set("version")}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] text-orbit-silver/50 uppercase tracking-widest font-bold">Build</label>
                                    <input
                                        className={FIELD_CLASSES}
                                        placeholder="abc123"
                                        value={form.build}
                                        onChange={set("build")}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] text-orbit-silver/50 uppercase tracking-widest font-bold">Model</label>
                                    <input
                                        className={FIELD_CLASSES}
                                        placeholder="gpt-4o"
                                        value={form.model}
                                        onChange={set("model")}
                                    />
                                </div>
                            </div>
                        )}

                        {error && (
                            <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                                {error}
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-starlight-violet/20 border border-starlight-violet/40 rounded-xl text-white font-bold hover:bg-starlight-violet/30 transition-all disabled:opacity-40 uppercase tracking-widest text-sm"
                        >
                            {loading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Plus className="w-4 h-4" />
                            )}
                            {loading ? "Registering..." : "Register Agent"}
                        </button>
                    </form>
                )}
            </div>

            <style>{`
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}
