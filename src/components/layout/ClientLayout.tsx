"use client";
import { useEffect, useState } from "react";
import Header from "../layout/Header";
import Footer from "../layout/Footer";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
    const [isAdmin, setIsAdmin] = useState(false);
    useEffect(() => {
        if (typeof window !== "undefined") {
        setIsAdmin(window.location.pathname.startsWith("/admin"));
        }
    }, []);
        return (
            <>
                {!isAdmin && <Header isAdmin={isAdmin} />}
                {children}
                {!isAdmin && <Footer />}
            </>
        );
    }
