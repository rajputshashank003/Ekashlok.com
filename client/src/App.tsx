import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { Analytics } from "@vercel/analytics/react"
import "./index.css";

const Landing = lazy(() => import("./screens/Landing/Landing"));
const Login = lazy(() => import("./screens/Login/Login"));
const Home = lazy(() => import("./screens/Home/Home"));
const ShlokBrowser = lazy(() => import("./screens/ShlokBrowser/ShlokBrowser"));
const ChapterVerses = lazy(() => import("./screens/ShlokBrowser/ChapterVerses"));
const VersePage = lazy(() => import("./screens/ShlokBrowser/VersePage"));
const Profile = lazy(() => import("./screens/Profile/Profile"));
const AdminDashboard = lazy(() => import("./screens/Admin/AdminDashboard"));
const AdminUsers = lazy(() => import("./screens/Admin/AdminUsers"));
const AdminSignupAttempts = lazy(() => import("./screens/Admin/AdminSignupAttempts"));

const PageLoader = () => (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "var(--cream)" }}>
        <div style={{ textAlign: "center" }}>
            <div
                style={{
                    fontFamily: "'Noto Serif Devanagari', serif",
                    fontSize: "3rem",
                    color: "var(--bhagwa)",
                    animation: "spinSlow 3s linear infinite",
                    display: "inline-block",
                }}
            >ॐ</div>
        </div>
    </div>
);

function App() {
    return (
        <>
            <Analytics />
            <Suspense fallback={<PageLoader />}>
                <Routes>
                    {/* Public */}
                    <Route path="/" element={<Landing />} />
                    <Route path="/login" element={<Login />} />

                    {/* Shlok Browse (public) */}
                    <Route path="/shloks" element={<ShlokBrowser />} />
                    <Route path="/shloks/:chapter" element={<ChapterVerses />} />
                    <Route path="/shloks/:chapter/:verse" element={<VersePage />} />

                    {/* Protected */}
                    <Route path="/home" element={<Home />} />
                    <Route path="/profile" element={<Profile />} />

                    {/* Admin */}
                    <Route path="/admin" element={<AdminDashboard />} />
                    <Route path="/admin/users" element={<AdminUsers />} />
                    <Route path="/admin/signup-attempts" element={<AdminSignupAttempts />} />

                    {/* Fallback */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </Suspense>

            <Toaster
                position="bottom-right"
                toastOptions={{
                    style: {
                        background: "white",
                        color: "var(--text-primary)",
                        border: "1px solid var(--border)",
                        boxShadow: "var(--shadow-md)",
                        borderRadius: "12px",
                        fontSize: "0.9rem",
                    },
                    success: {
                        iconTheme: { primary: "var(--bhagwa)", secondary: "white" },
                    },
                }}
            />
        </>
    );
}

export default App;
