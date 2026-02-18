"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { AgentCard as AgentType } from "@shared/types";
import StatusBadge from "@/components/StatusBadge";
import { HeartPulse, Clock, Wifi, WifiOff } from "lucide-react";

interface HealthEvent {
    id: number;
    time: string;
    message: string;
    type: "info" | "warn" | "ok";
}

export default function HealthPage() {
    const [agents, setAgents] = useState<AgentType[]>([]);
    const [backendOk, setBackendOk] = useState<boolean | null>(null);
    const [events, setEvents] = useState<HealthEvent[]>([]);
    const [tick, setTick] = useState(0);

    const eventCounter = useRef(0);

    const addEvent = (message: string, type: HealthEvent["type"]) => {
        setEvents((prev) => [
            { id: eventCounter.current++, time: new Date().toLocaleTimeString(), message, type },
            ...prev.slice(0, 19),
        ]);
    };

    useEffect(() => {
        const check = async () => {
            try {
                const res = await fetch("http://localhost:3001/health");
                const ok = res.ok;
                setBackendOk(ok);
                if (ok) addEvent("Backend health check passed", "ok");
            } catch {
                setBackendOk(false);
                addEvent("Backend unreachable", "warn");
            }

            try {
                const data = await api.getAgents();
                setAgents(data);
                const active = data.filter((a) => a.status === "active").length;
                addEvent(`${active}/${data.length} agents active`, "info");
            } catch {
                addEvent("Failed to fetch agent list", "warn");
            }

            setTick((t) => t + 1);
        };

        check();
        const interval = setInterval(check, 5000);
        return () => clearInterval(interval);
    }, []);

    const activeCount = agents.filter((a) => a.status === "active").length;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col gap-2">
                <h1 className="text-4xl font-display font-bold text-white tracking-tighter">
                    System <span className="text-cosmic-teal">Health</span>
                </h1>
                <p className="text-orbit-silver/60">Real-time monitoring of all bridge nodes.</p>
            </div>

            {/* Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-card p-6 flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${backendOk ? "bg-cosmic-teal/20" : "bg-red-500/20"}`}>
                        {backendOk ? <Wifi className="w-6 h-6 text-cosmic-teal" /> : <WifiOff className="w-6 h-6 text-red-400" />}
                    </div>
                    <div>
                        <p className="text-xs text-orbit-silver/50 uppercase tracking-widest">Backend</p>
                        <p className={`text-lg font-bold font-display ${backendOk ? "text-cosmic-teal" : "text-red-400"}`}>
                            {backendOk === null ? "Checking..." : backendOk ? "Online" : "Offline"}
                        </p>
                    </div>
                </div>

                <div className="glass-card p-6 flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-starlight-violet/20">
                        <HeartPulse className="w-6 h-6 text-starlight-violet animate-pulse" />
                    </div>
                    <div>
                        <p className="text-xs text-orbit-silver/50 uppercase tracking-widest">Active Agents</p>
                        <p className="text-lg font-bold font-display text-white">
                            {activeCount} / {agents.length}
                        </p>
                    </div>
                </div>

                <div className="glass-card p-6 flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-solar-gold/20">
                        <Clock className="w-6 h-6 text-solar-gold" />
                    </div>
                    <div>
                        <p className="text-xs text-orbit-silver/50 uppercase tracking-widest">Poll Cycles</p>
                        <p className="text-lg font-bold font-display text-white">{tick}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Agent Heartbeats */}
                <div className="glass-card p-6">
                    <h2 className="text-lg font-display font-bold text-white mb-4">Agent Heartbeats</h2>
                    <div className="space-y-3">
                        {agents.length === 0 ? (
                            <p className="text-orbit-silver/40 text-sm">No agents registered.</p>
                        ) : (
                            agents.map((agent) => (
                                <div key={agent.name} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                                    <div>
                                        <p className="text-sm font-medium text-white">{agent.name}</p>
                                        <p className="text-xs text-orbit-silver/40">{agent.role}</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs text-orbit-silver/40">
                                            {agent.lastHeartbeat ? new Date(agent.lastHeartbeat).toLocaleTimeString() : "—"}
                                        </span>
                                        <StatusBadge status={agent.status} />
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Event Stream */}
                <div className="glass-card p-6">
                    <h2 className="text-lg font-display font-bold text-white mb-4">Event Stream</h2>
                    <div className="space-y-2 max-h-72 overflow-y-auto custom-scrollbar">
                        {events.length === 0 ? (
                            <p className="text-orbit-silver/40 text-sm">Waiting for events...</p>
                        ) : (
                            events.map((ev) => (
                                <div key={ev.id} className="flex items-start gap-3 text-xs">
                                    <span className="text-orbit-silver/30 shrink-0 font-mono">{ev.time}</span>
                                    <span className={
                                        ev.type === "ok" ? "text-cosmic-teal" :
                                            ev.type === "warn" ? "text-solar-gold" :
                                                "text-orbit-silver/70"
                                    }>
                                        {ev.message}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
