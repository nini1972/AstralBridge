"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { AgentCard as AgentType } from "@shared/types";
import StatusBadge from "@/components/StatusBadge";
import { Zap, Users } from "lucide-react";

interface CapabilityGroup {
    name: string;
    agents: AgentType[];
}

export default function CapabilitiesPage() {
    const [groups, setGroups] = useState<CapabilityGroup[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.getAgents()
            .then((agents) => {
                const map = new Map<string, AgentType[]>();
                agents.forEach((agent) => {
                    agent.capabilities.forEach((cap) => {
                        if (!map.has(cap)) map.set(cap, []);
                        map.get(cap)!.push(agent);
                    });
                });
                setGroups(
                    Array.from(map.entries())
                        .sort((a, b) => b[1].length - a[1].length)
                        .map(([name, agents]) => ({ name, agents }))
                );
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col gap-2">
                <h1 className="text-4xl font-display font-bold text-white tracking-tighter">
                    Capability <span className="text-solar-gold">Explorer</span>
                </h1>
                <p className="text-orbit-silver/60">
                    {groups.length} unique capabilities mapped across the network.
                </p>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="glass-card p-6 h-36 animate-pulse bg-white/5" />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {groups.map((group) => (
                        <div key={group.name} className="glass-card p-6 group hover:border-solar-gold/30 transition-all duration-500">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-solar-gold/10 rounded-xl group-hover:bg-solar-gold/20 transition-colors">
                                        <Zap className="w-5 h-5 text-solar-gold" />
                                    </div>
                                    <div>
                                        <h3 className="text-white font-bold font-display">{group.name}</h3>
                                        <p className="text-xs text-orbit-silver/50 mt-0.5">
                                            {group.agents.length} agent{group.agents.length !== 1 ? "s" : ""}
                                        </p>
                                    </div>
                                </div>
                                <span className="text-2xl font-display font-bold text-solar-gold/30">
                                    {group.agents.length}
                                </span>
                            </div>

                            <div className="space-y-2 mt-4 border-t border-white/5 pt-4">
                                {group.agents.map((agent) => (
                                    <div key={agent.name} className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Users className="w-3.5 h-3.5 text-orbit-silver/40" />
                                            <span className="text-sm text-orbit-silver/70">{agent.name}</span>
                                            <span className="text-xs text-orbit-silver/30">· {agent.role}</span>
                                        </div>
                                        <StatusBadge status={agent.status} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
