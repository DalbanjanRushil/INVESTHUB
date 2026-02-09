
"use client";

import { useSession, signOut } from "next-auth/react";
import { useEffect } from "react";
import { toast } from "sonner";

export default function SessionGuard() {
    const { data: session } = useSession();

    useEffect(() => {
        if (session?.user?.status === "BLOCKED") {
            toast.error("Access Denied: Your account has been suspended.");
            signOut({ callbackUrl: "/login", redirect: true });
        }
    }, [session]);

    return null;
}
