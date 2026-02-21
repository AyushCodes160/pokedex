import React from 'react';

export const PokeballIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="45" fill="white" stroke="currentColor" strokeWidth="5" />
        <path d="M5 50 H95" stroke="currentColor" strokeWidth="5" />
        <path d="M50 5 A45 45 0 0 1 95 50 H5 A45 45 0 0 1 50 5 Z" fill="#EE1515" />
        <circle cx="50" cy="50" r="15" fill="white" stroke="currentColor" strokeWidth="5" />
        <circle cx="50" cy="50" r="10" fill="white" />
    </svg>
);

export const UltraBallIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="45" fill="white" stroke="currentColor" strokeWidth="5" />
        <path d="M5 50 H95" stroke="currentColor" strokeWidth="5" />
        <path d="M50 5 A45 45 0 0 1 95 50 H5 A45 45 0 0 1 50 5 Z" fill="#2a2a2a" />
        {/* Ultra Ball H shape */}
        <path d="M20 20 Q50 60 80 20" stroke="#FCD116" strokeWidth="8" fill="none" />
        <path d="M50 5 V25" stroke="#FCD116" strokeWidth="0" />
        <circle cx="50" cy="50" r="15" fill="white" stroke="currentColor" strokeWidth="5" />
        <circle cx="50" cy="50" r="10" fill="white" />
    </svg>
);
