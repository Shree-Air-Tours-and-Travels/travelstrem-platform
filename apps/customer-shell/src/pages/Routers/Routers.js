// src/pages/Routers/Routers.jsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";

import AuthPage from "../AuthPage/Auth";
import Home from "../homePage/home";
import About from "../AboutPage/About";

import ToursRemote from "../../microfrontends/ToursRemote";
import CheckoutPage from "../CheckoutPage/CheckoutPage";
import ToursAdmin from "../ManageTours/ManageTours";
import DashboardPage from "../Dashboard/DashboardPage";

import SearchResultList from "../../components/SEO/SearchResultList";
import ScrollToTop from "../../components/scroll/ScrollToTop";

import ProtectedRoute from "../AuthPage/authentication/ProtectedRoute";
import RoleProtectedRoute from "./RoleProtectedRoute";

const Routers = () => {
    const { user } = useSelector((state) => state.auth || {});

    // tiny helpers to keep route definitions concise
    const authWrap = (el) => <ProtectedRoute>{el}</ProtectedRoute>;
    const roleWrap = (el, roles) => <RoleProtectedRoute allowedRoles={roles}>{el}</RoleProtectedRoute>;

    return (
        <>
            <ScrollToTop />

            <Routes>
                {/* Public */}
                <Route path="/" element={<Home />} />
                <Route path="/about" element={<About />} />
                <Route path="/search" element={<SearchResultList />} />

                {/* Auth page: redirect signed-in users to home */}
                <Route path="/auth" element={user ? <Navigate to="/" replace /> : <AuthPage />} />

                {/* Auth-protected routes */}
                <Route path="/tours/*" element={authWrap(<ToursRemote />)} />
                <Route path="/checkout/:bookingId" element={authWrap(<CheckoutPage />)} />

                {/* Dashboard / bookings */}
                <Route path="/bookings" element={authWrap(<DashboardPage />)} />
                <Route path="/bookings/:id" element={authWrap(<CheckoutPage />)} />

                {/* Role-restricted management */}
                <Route path="/admin/tours" element={roleWrap(<ToursAdmin />, ["admin"])} />
                <Route path="/agent/tours" element={roleWrap(<ToursAdmin />, ["agent"])} />
                <Route path="/manage/tours" element={roleWrap(<ToursAdmin />, ["admin", "agent"])} />

                {/* Catch-all: send authenticated users to home, unauthenticated to auth */}
                <Route path="*" element={<Navigate to={user ? "/" : "/auth"} replace />} />
            </Routes>
        </>
    );
};

export default Routers;
