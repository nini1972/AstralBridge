"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { AgentCard } from "@shared/types";
import { Users, Zap, HeartPulse, GitBranch, ArrowRight } from "lucide-react";
import Link from 'next/link';

export default function DashboardPage() {
  const [stats, setStats] = useState({ agents: 0, capabilities: 0 });

  useEffect(() => {
    api.getAgents().then(data => {
      setStats({
        agents: data.length,
        capabilities: new Set(data.flatMap(a => a.capabilities)).size
      });
    }).catch(console.error);
  }, []);

  const cards = [
    { title: "Total Agents", value: stats.agents, icon: Users, color: "text-starlight-violet", href: "/agents" },
    { title: "Capabilities", value: stats.capabilities, icon: Zap, color: "text-solar-gold", href: "/capabilities" },
    { title: "System Health", value: "99.9%", icon: HeartPulse, color: "text-cosmic-teal", href: "/health" },
    { title: "Active Tasks", value: "0", icon: GitBranch, color: "text-nebula-blue", href: "/task-flows" },
  ];

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <div className="flex flex-col gap-2">
        <h1 className="text-5xl font-display font-bold text-white tracking-tighter">
          Welcome to <span className="text-starlight-violet">AstralBridge</span>
        </h1>
        <p className="text-xl text-orbit-silver/60 max-w-2xl">
          The central hub for autonomous intelligence. Monitor, route, and discover agent capabilities across the cosmic network.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {cards.map((card) => (
          <Link key={card.title} href={card.href} className="group">
            <div className="glass-card p-8 border-b-2 border-transparent group-hover:border-starlight-violet transition-all duration-500 hover:-translate-y-2">
              <div className="flex justify-between items-start mb-6">
                <div className="p-4 bg-astral-indigo/20 rounded-2xl group-hover:bg-starlight-violet/20 transition-colors">
                  <card.icon className={`w-8 h-8 ${card.color}`} />
                </div>
                <ArrowRight className="w-5 h-5 text-orbit-silver/20 group-hover:text-starlight-violet group-hover:translate-x-1 transition-all" />
              </div>
              <h3 className="text-orbit-silver/40 text-sm font-bold uppercase tracking-widest">{card.title}</h3>
              <p className="text-4xl font-display font-bold text-white mt-1">{card.value}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass-card p-10 bg-starlight-violet/5 overflow-hidden relative">
          <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-starlight-violet/10 rounded-full blur-3xl" />
          <h2 className="text-3xl font-display font-bold text-white mb-6">Getting Started</h2>
          <div className="space-y-6 relative z-10">
            {[
              { step: "01", title: "Register Agents", desc: "Connect your autonomous workers via our cosmic API." },
              { step: "02", title: "Map Capabilities", desc: "Tag agents with specific skills for discovery." },
              { step: "03", title: "Route Tasks", desc: "Use the A2A router to distribute workloads automatically." },
            ].map((s) => (
              <div key={s.step} className="flex gap-6">
                <span className="text-starlight-violet font-display font-bold text-2xl opacity-40">{s.step}</span>
                <div>
                  <h4 className="text-white font-bold text-lg">{s.title}</h4>
                  <p className="text-orbit-silver/50 text-sm">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card p-10 flex flex-col justify-center items-center text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-cosmic-teal/20 flex items-center justify-center animate-pulse">
            <Zap className="w-10 h-10 text-cosmic-teal" />
          </div>
          <h3 className="text-2xl font-display font-bold text-white">System Status: Optimal</h3>
          <p className="text-orbit-silver/60">All bridge nodes are synchronized and ready for interstellar communication.</p>
          <button className="px-8 py-3 bg-white/5 border border-white/10 rounded-xl text-white font-bold hover:bg-white/10 transition-all uppercase tracking-widest text-xs">
            View Node Logs
          </button>
        </div>
      </div>
    </div>
  );
}
