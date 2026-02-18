"use client";

import { useState } from "react";
import { Copy, Check, ChevronDown, ChevronRight } from "lucide-react";

interface JsonViewerProps {
    data: any;
    title?: string;
}

export default function JsonViewer({ data, title }: JsonViewerProps) {
    const [copied, setCopied] = useState(false);
    const [isExpanded, setIsExpanded] = useState(true);

    const handleCopy = () => {
        navigator.clipboard.writeText(JSON.stringify(data, null, 2));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="bg-void-black/50 border border-white/5 rounded-xl overflow-hidden mt-3">
            <div
                className="flex items-center justify-between px-4 py-2 border-b border-white/5 bg-white/5 cursor-pointer hover:bg-white/10 transition-colors"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-2">
                    {isExpanded ? <ChevronDown className="w-4 h-4 text-orbit-silver/40" /> : <ChevronRight className="w-4 h-4 text-orbit-silver/40" />}
                    <span className="text-[10px] font-bold text-orbit-silver/60 uppercase tracking-widest">
                        {title || "Result Data"}
                    </span>
                </div>
                <button
                    onClick={(e) => { e.stopPropagation(); handleCopy(); }}
                    className="p-1.5 hover:bg-white/10 rounded-md transition-colors"
                >
                    {copied ? <Check className="w-3 h-3 text-cosmic-teal" /> : <Copy className="w-3 h-3 text-orbit-silver/40" />}
                </button>
            </div>

            {isExpanded && (
                <div className="p-4 overflow-x-auto max-h-60 custom-scrollbar">
                    <pre className="text-xs font-mono text-starlight-violet leading-relaxed">
                        {JSON.stringify(data, null, 2)}
                    </pre>
                </div>
            )}
        </div>
    );
}
