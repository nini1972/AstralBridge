"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { AgentCard, RouterTask } from "@shared/types";
import { Users, Zap, HeartPulse, GitBranch, ArrowRight, Activity, Clock, CheckCircle, XCircle, Loader2 } from "lucide-react";
import Link from "next/link";

// ─── helpers ──────────────────────────────────────────────────────────────────
const isSimulated = (a: AgentCard) =>
  a.endpoint.includes(".local") || a.endpoint.includes("example.com");

const timeAgo = (ms: number): string => {
  const diff = Date.now() - ms;
  if (diff < 60_000) return `${Math.floor(diff / 1000)}s ago`;
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  return `${Math.floor(diff / 3_600_000)}h ago`;
};

const statusColor = (status: string) => {
  if (status === "completed") return "text-cosmic-teal bg-cosmic-teal/10";
  if (status === "failed") return "text-red-400 bg-red-400/10";
  return "text-solar-gold bg-solar-gold/10";
};

const StatusIcon = ({ status }: { status: string }) => {
  if (status === "completed") return <CheckCircle className="w-3.5 h-3.5" />;
  if (status === "failed") return <XCircle className="w-3.5 h-3.5" />;
  return <Loader2 className="w-3.5 h-3.5 animate-spin" />;
};

// ─── component ────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [agents, setAgents] = useState<AgentCard[]>([]);
  const [tasks, setTasks] = useState<RouterTask[]>([]);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const refresh = useCallback(async () => {
    try {
      const [agentData, taskData] = await Promise.all([
        api.getAgents(),
        api.getTasks().catch(() => [] as RouterTask[]),
      ]);
      setAgents(agentData);
      setTasks(taskData);
      setLastRefresh(new Date());
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 10_000);
    return () => clearInterval(id);
  }, [refresh]);

  // ── derived stats ──
  const realAgents = agents.filter(a => !isSimulated(a));
  const simAgents = agents.filter(a => isSimulated(a));
  const allCaps = agents.flatMap(a => a.capabilities);
  const uniqueCaps = [...new Set(allCaps)];
  const activeTasks = tasks.filter(t => t.status !== "completed" && t.status !== "failed").length;
  const recentTasks = [...tasks].reverse().slice(0, 5);

  // capability → how many agents support it
  const capCounts = uniqueCaps.map(cap => ({
    cap,
    count: agents.filter(a => a.capabilities.includes(cap)).length,
  }));
  const maxCapCount = Math.max(...capCounts.map(c => c.count), 1);

  const statCards = [
    {
      title: "Total Agents",
      value: agents.length,
      sub: `${realAgents.length} real · ${simAgents.length} simulated`,
      icon: Users,
      color: "text-starlight-violet",
      glow: "group-hover:shadow-starlight-violet/20",
      href: "/agents",
    },
    {
      title: "Capabilities",
      value: uniqueCaps.length,
      sub: `across ${agents.length} agents`,
      icon: Zap,
      color: "text-solar-gold",
      glow: "group-hover:shadow-solar-gold/20",
      href: "/capabilities",
    },
    {
      title: "System Health",
      value: "99.9%",
      sub: "all nodes operational",
      icon: HeartPulse,
      color: "text-cosmic-teal",
      glow: "group-hover:shadow-cosmic-teal/20",
      href: "/health",
    },
    {
      title: "Active Tasks",
      value: activeTasks,
      sub: `${tasks.length} total dispatched`,
      icon: GitBranch,
      color: "text-nebula-blue",
      glow: "group-hover:shadow-nebula-blue/20",
      href: "/task-flows",
    },
  ];

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">

      {/* ── Header ── */}
      <div className="flex items-end justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="text-5xl font-display font-bold text-white tracking-tighter">
            Welcome to <span className="text-starlight-violet">AstralBridge</span>
          </h1>
          <p className="text-lg text-orbit-silver/60 max-w-2xl">
            The central hub for autonomous intelligence. Monitor, route, and discover agent capabilities across the cosmic network.
          </p>
        </div>
        <div className="hidden lg:flex items-center gap-2 text-xs text-orbit-silver/40 shrink-0">
          <Activity className="w-3.5 h-3.5 text-cosmic-teal animate-pulse" />
          <span>Live · refreshed {timeAgo(lastRefresh.getTime())}</span>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card) => (
          <Link key={card.title} href={card.href} className="group">
            <div className={`glass-card p-7 border-b-2 border-transparent group-hover:border-starlight-violet transition-all duration-500 hover:-translate-y-1 hover:shadow-xl ${card.glow}`}>
              <div className="flex justify-between items-start mb-5">
                <div className="p-3 bg-astral-indigo/20 rounded-xl group-hover:bg-starlight-violet/15 transition-colors">
                  <card.icon className={`w-6 h-6 ${card.color}`} />
                </div>
                <ArrowRight className="w-4 h-4 text-orbit-silver/20 group-hover:text-starlight-violet group-hover:translate-x-1 transition-all" />
              </div>
              <h3 className="text-orbit-silver/40 text-xs font-bold uppercase tracking-widest">{card.title}</h3>
              <p className="text-4xl font-display font-bold text-white mt-1">{card.value}</p>
              <p className="text-xs text-orbit-silver/40 mt-2">{card.sub}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* ── Bottom Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Capability Breakdown */}
        <div className="glass-card p-7 flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-display font-bold text-white">Capabilities</h2>
            <span className="text-xs text-orbit-silver/40 uppercase tracking-widest">{uniqueCaps.length} total</span>
          </div>
          {capCounts.length === 0 ? (
            <p className="text-orbit-silver/40 text-sm">No agents registered yet.</p>
          ) : (
            <div className="space-y-4">
              {capCounts.map(({ cap, count }) => (
                <div key={cap}>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-sm text-orbit-silver/80 font-medium truncate pr-2">{cap}</span>
                    <span className="text-xs text-orbit-silver/40 shrink-0">{count} agent{count !== 1 ? "s" : ""}</span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-starlight-violet to-nebula-blue rounded-full transition-all duration-700"
                      style={{ width: `${(count / maxCapCount) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Live Agent Feed */}
        <div className="glass-card p-7 flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-display font-bold text-white">Live Agents</h2>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-cosmic-teal animate-pulse" />
              <span className="text-xs text-orbit-silver/40">{agents.length} online</span>
            </div>
          </div>
          <div className="space-y-3 overflow-y-auto max-h-72 custom-scrollbar pr-1">
            {agents.length === 0 ? (
              <p className="text-orbit-silver/40 text-sm">No agents connected.</p>
            ) : (
              agents.map((agent) => (
                <div key={agent.name} className="flex items-start gap-3 p-3 rounded-xl bg-white/3 hover:bg-white/6 transition-colors">
                  <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${isSimulated(agent) ? "bg-solar-gold/60" : "bg-cosmic-teal animate-pulse"}`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-white truncate">{agent.name}</span>
                      {isSimulated(agent) && (
                        <span className="text-[10px] text-solar-gold/70 bg-solar-gold/10 px-1.5 py-0.5 rounded-full shrink-0">sim</span>
                      )}
                    </div>
                    <p className="text-xs text-orbit-silver/40 mt-0.5">{agent.role}</p>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {agent.capabilities.map(cap => (
                        <span key={cap} className="text-[10px] text-starlight-violet/80 bg-starlight-violet/10 px-1.5 py-0.5 rounded-full">{cap}</span>
                      ))}
                    </div>
                    {agent.lastHeartbeat && (
                      <div className="flex items-center gap-1 mt-1.5">
                        <Clock className="w-2.5 h-2.5 text-orbit-silver/30" />
                        <span className="text-[10px] text-orbit-silver/30">{timeAgo(agent.lastHeartbeat)}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Tasks */}
        <div className="glass-card p-7 flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-display font-bold text-white">Recent Tasks</h2>
            <Link href="/task-flows" className="text-xs text-starlight-violet/70 hover:text-starlight-violet transition-colors">
              View all →
            </Link>
          </div>
          <div className="space-y-3 overflow-y-auto max-h-72 custom-scrollbar pr-1">
            {recentTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 gap-3">
                <GitBranch className="w-8 h-8 text-orbit-silver/20" />
                <p className="text-orbit-silver/40 text-sm text-center">No tasks dispatched yet.<br />Head to Task Flows to get started.</p>
              </div>
            ) : (
              recentTasks.map((task) => (
                <div key={task.id} className="flex items-start gap-3 p-3 rounded-xl bg-white/3 hover:bg-white/6 transition-colors">
                  <div className={`mt-0.5 flex items-center justify-center shrink-0 ${statusColor(task.status)}`}>
                    <StatusIcon status={task.status} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-mono text-orbit-silver/60 truncate">{task.id}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium shrink-0 ${statusColor(task.status)}`}>
                        {task.status}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-white mt-0.5 truncate">{task.capability}</p>
                    {task.assignedAgent && (
                      <p className="text-xs text-orbit-silver/40 mt-0.5">→ {task.assignedAgent}</p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
