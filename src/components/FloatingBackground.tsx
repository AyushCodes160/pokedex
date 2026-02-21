import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { PokeballIcon, UltraBallIcon } from './Icons';

interface FloatingBallProps {
    type: 'pokeball' | 'ultraball';
    size: number;
    initialX: string;
    initialY: string;
    duration: number;
    delay: number;
}

const FloatingBall = ({ type, size, initialX, initialY, duration, delay }: FloatingBallProps) => {
    const Icon = type === 'pokeball' ? PokeballIcon : UltraBallIcon;

    return (
        <motion.div
            className="absolute opacity-10 pointer-events-none z-0"
            style={{
                width: size,
                height: size,
                left: initialX,
                top: initialY,
            }}
            animate={{
                y: [0, -40, 0],
                rotate: [0, 360],
                scale: [1, 1.1, 1],
            }}
            transition={{
                duration,
                repeat: Infinity,
                delay,
                ease: "easeInOut"
            }}
        >
            <Icon className="w-full h-full" />
        </motion.div>
    );
};

export const FloatingBackground = ({ theme }: { theme: 'light' | 'dark' }) => {
    const isDark = theme === 'dark';

    // Create a stable set of background balls
    const balls = useMemo(() => {
        return Array.from({ length: 15 }).map((_, i) => ({
            id: i,
            size: Math.random() * 100 + 50,
            initialX: `${Math.random() * 100}%`,
            initialY: `${Math.random() * 100}%`,
            duration: Math.random() * 10 + 15,
            delay: Math.random() * 5,
        }));
    }, []);

    return (
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 transition-colors duration-500">
            {balls.map((ball) => (
                <FloatingBall
                    key={ball.id}
                    type={isDark ? 'ultraball' : 'pokeball'}
                    {...ball}
                />
            ))}
        </div>
    );
};
