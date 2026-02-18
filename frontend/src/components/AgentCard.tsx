"use client";

import { AgentCard as AgentType } from "@shared/types";
import { Users, Code, Server, Clock } from "lucide-react";
import StatusBadge from "./StatusBadge";
import { formatDistanceToNow } from "date-fns"; // I'll need to install date-fns

interface AgentCardProps {
    agent: AgentType;
}

export default function AgentCard({ agent }: AgentCardProps) {
    return (
        <div className="glass-card p-6 flex flex-col gap-4 group hover:border-starlight-violet/50 transition-all duration-500">
            <div className="flex justify-between items-start">
                <div className="p-3 bg-astral-indigo/30 rounded-2xl group-hover:bg-starlight-violet/20 transition-colors duration-500">
                    <Users className="w-6 h-6 text-starlight-violet" />
                </div>
                <StatusBadge status={agent.status} />
            </div>

            <div>
                <h3 className="text-xl font-display font-bold text-white group-hover:text-starlight-violet transition-colors">
                    {agent.name}
                </h3>
                <p className="text-sm text-orbit-silver/70 mt-1 line-clamp-2">
                    {agent.description}
                </p>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-2">
                <div className="flex items-center gap-2 text-xs text-orbit-silver/50">
                    <Code className="w-3.5 h-3.5" />
                    <span>{agent.framework || "Generic"}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-orbit-silver/50">
                    <Server className="w-3.5 h-3.5" />
                    <span>{agent.provider || "Unknown"}</span>
                </div>
            </div>

            <div className="flex flex-wrap gap-2 mt-2">
                {agent.capabilities.slice(0, 3).map((capability) => (
                    <span
                        key={capability}
                        className="px-2 py-1 bg-white/5 border border-white/10 rounded-md text-[10px] text-orbit-silver/80"
                    >
                        {capability}
                    </span>
                ))}
                {agent.capabilities.length > 3 && (
                    <span className="text-[10px] text-orbit-silver/40 px-1 py-1">
                        +{agent.capabilities.length - 3} more
                    </span>
                )}
            </div>

            <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between text-[10px] text-orbit-silver/40">
                <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>Updated {new Date(agent.lastHeartbeat).toLocaleTimeString()}</span>
                </div>
                <button className="text-starlight-violet hover:underline font-bold tracking-wider uppercase">
                    Details
                </button>
            </div>
        </div>
    );
}
