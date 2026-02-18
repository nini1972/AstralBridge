"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Zap, HeartPulse, GitBranch, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Agents', href: '/agents', icon: Users },
    { name: 'Capabilities', href: '/capabilities', icon: Zap },
    { name: 'Health', href: '/health', icon: HeartPulse },
    { name: 'Task Flows', href: '/task-flows', icon: GitBranch },
];

export default function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="w-64 glass-card m-4 border-r border-white/10 hidden md:flex flex-col">
            <div className="p-6">
                <h1 className="text-2xl font-display font-bold text-starlight-violet tracking-tighter">
                    AstralBridge
                </h1>
                <p className="text-xs text-orbit-silver/50 tracking-widest uppercase mt-1">
                    A2A Ecosystem
                </p>
            </div>

            <nav className="flex-1 px-4 space-y-2 mt-4">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group",
                                isActive
                                    ? "bg-starlight-violet/20 text-starlight-violet border border-starlight-violet/30"
                                    : "text-orbit-silver hover:bg-white/5 hover:text-white"
                            )}
                        >
                            <item.icon className={cn(
                                "w-5 h-5 transition-transform duration-300",
                                isActive ? "scale-110" : "group-hover:scale-110"
                            )} />
                            <span className="font-medium">{item.name}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 mt-auto">
                <div className="p-4 glass-card bg-astral-indigo/20 border border-astral-indigo/30">
                    <p className="text-xs text-orbit-silver/60">System Status</p>
                    <div className="flex items-center gap-2 mt-2">
                        <div className="w-2 h-2 rounded-full bg-cosmic-teal animate-pulse" />
                        <span className="text-sm font-medium text-cosmic-teal">Operational</span>
                    </div>
                </div>
            </div>
        </aside>
    );
}
