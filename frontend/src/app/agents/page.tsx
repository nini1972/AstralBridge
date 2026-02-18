"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { AgentCard as AgentType } from "@shared/types";
import AgentCard from "@/components/AgentCard";
import RegisterAgentModal from "@/components/RegisterAgentModal";
import { Users, Search, RefreshCw, Plus } from "lucide-react";

export default function AgentsPage() {
    const [agents, setAgents] = useState<AgentType[]>([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    const fetchAgents = () => {
        setLoading(true);
        api.getAgents()
            .then(setAgents)
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchAgents();
        const interval = setInterval(fetchAgents, 5000);
        return () => clearInterval(interval);
    }, []);

    const handleDeleted = (name: string) => {
        setAgents((prev) => prev.filter((a) => a.name !== name));
    };

    const handleRegistered = (agent: AgentType) => {
        setAgents((prev) => [...prev.filter((a) => a.name !== agent.name), agent]);
    };

    const filtered = agents.filter(
        (a) =>
            a.name.toLowerCase().includes(search.toLowerCase()) ||
            a.role.toLowerCase().includes(search.toLowerCase()) ||
            a.capabilities.some((c) => c.toLowerCase().includes(search.toLowerCase()))
    );

    return (
        <>
            {showModal && (
                <RegisterAgentModal
                    onClose={() => setShowModal(false)}
                    onRegistered={handleRegistered}
                />
            )}

            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="flex items-start justify-between">
                    <div className="flex flex-col gap-1">
                        <h1 className="text-4xl font-display font-bold text-white tracking-tighter">
                            Agent <span className="text-starlight-violet">Registry</span>
                        </h1>
                        <p className="text-orbit-silver/70">
                            {agents.length} agent{agents.length !== 1 ? "s" : ""} registered across the cosmic network.
                        </p>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="flex items-center gap-2 px-5 py-3 bg-starlight-violet/20 border border-starlight-violet/40 rounded-xl text-white font-bold hover:bg-starlight-violet/30 transition-all text-sm uppercase tracking-widest shrink-0"
                    >
                        <Plus className="w-4 h-4" />
                        Register Agent
                    </button>
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-orbit-silver/40" />
                        <input
                            type="text"
                            placeholder="Search agents, roles, capabilities..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-orbit-silver/40 focus:outline-none focus:border-starlight-violet/50 transition-colors text-sm"
                        />
                    </div>
                    <button
                        onClick={fetchAgents}
                        className="p-3 glass-card hover:bg-white/10 transition-colors rounded-xl"
                        title="Refresh"
                    >
                        <RefreshCw className={`w-4 h-4 text-orbit-silver/60 ${loading ? "animate-spin" : ""}`} />
                    </button>
                </div>

                {loading && agents.length === 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="glass-card p-6 h-48 animate-pulse" />
                        ))}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="glass-card p-16 flex flex-col items-center justify-center text-center gap-4">
                        <Users className="w-12 h-12 text-orbit-silver/20" />
                        <p className="text-orbit-silver/50">No agents found matching your search.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filtered.map((agent) => (
                            <AgentCard
                                key={agent.name}
                                agent={agent}
                                onDeleted={handleDeleted}
                            />
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}
