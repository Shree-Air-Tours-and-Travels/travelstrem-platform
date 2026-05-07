// src/components/AuthWrapper.jsx
import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { initAuth, logout as logoutAction } from "../../../redux/authSlice.js";
import Header from "../../ProfilePage/header.jsx";
import Routers from "../../Routers/Routers.js";
import Footer from "../../ProfilePage/footer.jsx";
import ChatWidget from "../../../Featured/ChatBot/ChatWidget.jsx";

/**
 * AuthWrapper
 * - Always render Header so user can click Login/Home immediately.
 * - Mount Routers always; ProtectedRoute handles redirects.
 * - While auth is initializing, show a lightweight loading area for main content
 *   so the header/footer remain visible and active.
 */
const AuthWrapper = () => {
    const dispatch = useDispatch();
    const { loading } = useSelector((state) => state.auth || {});
    const initCalled = useRef(false);
    const [showInitializing, setShowInitializing] = useState(false);

    useEffect(() => {
        // ensure initAuth only called once (defensive)
        if (!initCalled.current) {
            initCalled.current = true;
            dispatch(initAuth()).catch((err) => {
                console.error("initAuth error:", err);
            });
        }
    }, [dispatch]);

    useEffect(() => {
        const handler = () => dispatch(logoutAction());
        window.addEventListener("app:logout", handler);
        return () => window.removeEventListener("app:logout", handler);
    }, [dispatch]);

    useEffect(() => {
        let timer;
        if (loading) {
            // after 120 seconds, change text
            timer = setTimeout(() => setShowInitializing(true), 120000);
        } else {
            setShowInitializing(false);
        }
        return () => clearTimeout(timer);
    }, [loading]);

    return (
        <div>
            <Header />
            <main style={{ minHeight: "calc(100vh - 200px)" }}>
                {loading ? (
                    <div
                        style={{
                            height: "60vh",
                            display: "grid",
                            placeItems: "center",
                            textAlign: "center",
                        }}
                    >
                        <div>
                            {!showInitializing ? (
                                <>
                                    <div style={{ fontSize: 18, fontWeight: 500, marginBottom: 8 }}>
                                        The pipeline is currently in progress
                                    </div>
                                    <div style={{ color: "#666" }}>
                                        It may take up to <strong>120 seconds</strong>. Please wait…
                                    </div>
                                </>
                            ) : (
                                <div style={{ fontSize: 16, color: "#444" }}>Initializing…</div>
                            )}
                        </div>
                    </div>
                ) : (
                    <Routers />
                )}
            </main>
            <ChatWidget floating  />
            <Footer />
        </div>
    );
};

export default AuthWrapper;
