import React from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Layout from "@/components/Layout";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Dashboard from "@/pages/Dashboard";
import Habits from "@/pages/Habits";
import Tasks from "@/pages/Tasks";
import Rewards from "@/pages/Rewards";
import History from "@/pages/History";
import Achievements from "@/pages/Achievements";

const TOAST_OPTIONS = {
  style: {
    border: "2px solid #1E1E24",
    borderRadius: "12px",
    boxShadow: "4px 4px 0 0 #1E1E24",
    background: "white",
    color: "#1E1E24",
    fontWeight: 700,
  },
};

function AuthGate({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/" replace />;
  return children;
}

function Shell({ children }) {
  return (
    <ProtectedRoute>
      <Layout>{children}</Layout>
    </ProtectedRoute>
  );
}

function App() {
  return (
    <div className="App">
      <AuthProvider>
        <BrowserRouter>
          <Toaster position="top-right" toastOptions={TOAST_OPTIONS} />
          <Routes>
            <Route path="/login" element={<AuthGate><Login /></AuthGate>} />
            <Route path="/register" element={<AuthGate><Register /></AuthGate>} />
            <Route path="/" element={<Shell><Dashboard /></Shell>} />
            <Route path="/habits" element={<Shell><Habits /></Shell>} />
            <Route path="/tasks" element={<Shell><Tasks /></Shell>} />
            <Route path="/rewards" element={<Shell><Rewards /></Shell>} />
            <Route path="/achievements" element={<Shell><Achievements /></Shell>} />
            <Route path="/history" element={<Shell><History /></Shell>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </div>
  );
}

export default App;
