"use client";

import { useEffect, useState } from "react";

export default function ClientTime() {
    const [time, setTime] = useState<string>("");

    useEffect(() => {
        setTime(new Date().toLocaleTimeString());

        const interval = setInterval(() => {
            setTime(new Date().toLocaleTimeString());
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    if (!time) return <span className="text-sm font-mono opacity-0">00:00:00 AM</span>; // Avoid layout shift

    return <span className="text-sm font-mono">{time}</span>;
}
