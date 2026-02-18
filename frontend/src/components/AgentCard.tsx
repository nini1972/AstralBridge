"use client";

import { useState } from "react";
import { AgentCard as AgentType } from "@shared/types";
import { Users, Code, Server, Clock, ChevronDown, ChevronUp, Trash2, AlertTriangle } from "lucide-react";
import StatusBadge from "./StatusBadge";
import { api } from "@/lib/api";

interface AgentCardProps {
    agent: AgentType;
    onDeleted?: (name: string) => void;
}

const isSimulated = (endpoint: string) =>
    endpoint.includes(".local") || endpoint.includes("example.com");

export default function AgentCard({ agent, onDeleted }: AgentCardProps) {
    const [expanded, setExpanded] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const handleDelete = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm(`Remove "${agent.name}" from the registry?`)) return;
        setDeleting(true);
        try {
            await api.deleteAgent(agent.name);
            onDeleted?.(agent.name);
        } catch {
            setDeleting(false);
        }
    };

    const simulated = isSimulated(agent.endpoint);

    return (
        <div className={`glass-card p-6 flex flex-col gap-4 group transition-all duration-500 ${simulated ? "hover:border-solar-gold/30" : "hover:border-starlight-violet/50"
            }`}>
            {/* Header */}
            <div className="flex justify-between items-start">
                <div className="p-3 bg-astral-indigo/40 rounded-2xl group-hover:bg-starlight-violet/20 transition-colors duration-500">
                    <Users className="w-6 h-6 text-starlight-violet" />
                </div>
                <div className="flex items-center gap-2">
                    {simulated && (
                        <span className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest rounded-full border bg-solar-gold/10 text-solar-gold border-solar-gold/30">
                            <AlertTriangle className="w-2.5 h-2.5" />
                            Simulated
                        </span>
                    )}
                    <StatusBadge status={agent.status} />
                </div>
            </div>

            {/* Name & Description */}
            <div>
                <h3 className="text-xl font-display font-bold text-white group-hover:text-starlight-violet transition-colors">
                    {agent.name}
                </h3>
                <p className="text-sm text-orbit-silver/70 mt-1 line-clamp-2">
                    {agent.description || <span className="italic text-orbit-silver/40">No description</span>}
                </p>
            </div>

            {/* Meta */}
            <div className="grid grid-cols-2 gap-3 mt-1">
                <div className="flex items-center gap-2 text-xs text-orbit-silver/60">
                    <Code className="w-3.5 h-3.5 shrink-0" />
                    <span>{agent.framework || "Generic"}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-orbit-silver/60">
                    <Server className="w-3.5 h-3.5 shrink-0" />
                    <span>{agent.provider || "Unknown"}</span>
                </div>
            </div>

            {/* Capabilities */}
            <div className="flex flex-wrap gap-2">
                {agent.capabilities.slice(0, 3).map((cap) => (
                    <span
                        key={cap}
                        className="px-2 py-1 bg-starlight-violet/10 border border-starlight-violet/20 rounded-md text-[10px] text-starlight-violet/90 font-medium"
                    >
                        {cap}
                    </span>
                ))}
                {agent.capabilities.length > 3 && (
                    <span className="text-[10px] text-orbit-silver/40 px-1 py-1">
                        +{agent.capabilities.length - 3} more
                    </span>
                )}
            </div>

            {/* Expanded Details */}
            {expanded && (
                <div className="border-t border-white/8 pt-4 space-y-3 text-xs">
                    <div>
                        <p className="text-orbit-silver/40 uppercase tracking-widest text-[10px] mb-1">Endpoint</p>
                        <p className="text-orbit-silver/80 font-mono break-all">{agent.endpoint}</p>
                    </div>
                    <div>
                        <p className="text-orbit-silver/40 uppercase tracking-widest text-[10px] mb-1">All Capabilities</p>
                        <div className="flex flex-wrap gap-1.5">
                            {agent.capabilities.map((cap) => (
                                <span key={cap} className="px-2 py-0.5 bg-starlight-violet/10 border border-starlight-violet/20 rounded text-[10px] text-starlight-violet/90">
                                    {cap}
                                </span>
                            ))}
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <p className="text-orbit-silver/40 uppercase tracking-widest text-[10px] mb-1">Role</p>
                            <p className="text-orbit-silver/80">{agent.role}</p>
                        </div>
                        <div>
                            <p className="text-orbit-silver/40 uppercase tracking-widest text-[10px] mb-1">Last Heartbeat</p>
                            <p className="text-orbit-silver/80">
                                {agent.lastHeartbeat ? new Date(agent.lastHeartbeat).toLocaleTimeString() : "—"}
                            </p>
                        </div>
                    </div>
                    {simulated && (
                        <p className="text-solar-gold/70 text-[10px] bg-solar-gold/5 border border-solar-gold/20 rounded-lg px-3 py-2">
                            ⚠ This is a simulated agent. Its endpoint does not resolve to a real server.
                        </p>
                    )}
                </div>
            )}

            {/* Footer */}
            <div className="mt-auto pt-4 border-t border-white/8 flex items-center justify-between">
                <div className="flex items-center gap-1 text-[10px] text-orbit-silver/40">
                    <Clock className="w-3 h-3" />
                    <span>{agent.lastHeartbeat ? new Date(agent.lastHeartbeat).toLocaleTimeString() : "—"}</span>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleDelete}
                        disabled={deleting}
                        className="p-1.5 hover:bg-red-500/20 rounded-lg transition-colors text-orbit-silver/30 hover:text-red-400"
                        title="Remove agent"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                        onClick={() => setExpanded((v) => !v)}
                        className="flex items-center gap-1 text-[10px] text-starlight-violet hover:underline font-bold tracking-wider uppercase"
                    >
                        {expanded ? (
                            <><ChevronUp className="w-3 h-3" /> Less</>
                        ) : (
                            <><ChevronDown className="w-3 h-3" /> Details</>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
