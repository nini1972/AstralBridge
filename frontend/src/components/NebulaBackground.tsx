'use client';

import React from 'react';

const NebulaBackground: React.FC = () => {
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden bg-void-black">
            {/* Base Nebula Gradients */}
            <div className="absolute inset-0 opacity-40">
                <div
                    className="absolute top-[-10%] left-[-10%] w-[70%] h-[70%] rounded-full opacity-30 animate-pulse-slow"
                    style={{
                        background: 'radial-gradient(circle, #2A2E6E 0%, transparent 70%)',
                        filter: 'blur(100px)',
                    }}
                />
                <div
                    className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full opacity-20 animate-drift-slow"
                    style={{
                        background: 'radial-gradient(circle, #2EC4B6 0%, transparent 70%)',
                        filter: 'blur(120px)',
                    }}
                />
                <div
                    className="absolute top-[20%] right-[10%] w-[50%] h-[50%] rounded-full opacity-15 animate-pulse-slow"
                    style={{
                        background: 'radial-gradient(circle, #6C63FF 0%, transparent 70%)',
                        filter: 'blur(80px)',
                    }}
                />
                <div
                    className="absolute bottom-[20%] left-[10%] w-[40%] h-[40%] rounded-full opacity-10 animate-drift-slow"
                    style={{
                        background: 'radial-gradient(circle, #F2C94C 0%, transparent 70%)',
                        filter: 'blur(150px)',
                    }}
                />
            </div>

            {/* Subtle Noise / Grain Overlay */}
            <div className="absolute inset-0 opacity-[0.03] contrast-150 brightness-150"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                }}
            />

            {/* Drifting Stars/Particles */}
            <div className="absolute inset-0">
                {mounted && [...Array(20)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute w-1 h-1 bg-white rounded-full opacity-20 animate-twinkle"
                        style={{
                            top: `${Math.random() * 100}%`,
                            left: `${Math.random() * 100}%`,
                            animationDelay: `${Math.random() * 5}s`,
                            animationDuration: `${3 + Math.random() * 4}s`,
                        }}
                    />
                ))}
            </div>

            <style jsx>{`
                @keyframes pulse-slow {
                    0%, 100% { transform: scale(1); opacity: 0.3; }
                    50% { transform: scale(1.1); opacity: 0.4; }
                }
                @keyframes drift-slow {
                    0%, 100% { transform: translate(0, 0); }
                    50% { transform: translate(20px, -20px); }
                }
                @keyframes twinkle {
                    0%, 100% { opacity: 0.2; transform: scale(1); }
                    50% { opacity: 0.5; transform: scale(1.2); }
                }
                .animate-pulse-slow { animation: pulse-slow 20s infinite ease-in-out; }
                .animate-drift-slow { animation: drift-slow 25s infinite ease-in-out; }
                .animate-twinkle { animation: twinkle 5s infinite ease-in-out; }
            `}</style>
        </div>
    );
};

export default NebulaBackground;
