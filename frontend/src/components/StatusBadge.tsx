"use client";

import { cn } from "@/lib/utils";

interface StatusBadgeProps {
    status: 'active' | 'inactive' | 'busy';
}

export default function StatusBadge({ status }: StatusBadgeProps) {
    const styles = {
        active: "bg-cosmic-teal/10 text-cosmic-teal border-cosmic-teal/30",
        inactive: "bg-orbit-silver/10 text-orbit-silver border-orbit-silver/30",
        busy: "bg-solar-gold/10 text-solar-gold border-solar-gold/30",
    };

    return (
        <span className={cn(
            "px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest rounded-full border",
            styles[status]
        )}>
            {status}
        </span>
    );
}
