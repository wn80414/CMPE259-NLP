import { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Box } from "@mui/material";

import PageNavBar from "./components/PageNavBar";
import ResumeEditor from "./components/ResumeEditor";
import AIChat from "./components/AIChat";

import Login from "./pages/Login";
import Signup from "./pages/Signup";

export default function App() {
  const [chatOpen, setChatOpen] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if token exists in localStorage
    const token = localStorage.getItem("token");
    setIsAuthenticated(!!token);
    setLoading(false);
  }, []);

  if (loading) {
    return <Box>Loading...</Box>;
  }

  return (
    <Routes>

      {/* ---------------- AUTH PAGES ---------------- */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      {/* ---------------- PROTECTED APP ---------------- */}
      <Route
        path="/"
        element={
          isAuthenticated ? (
            <Box sx={{ height: "100vh", display: "flex", flexDirection: "column" }}>

              <PageNavBar
                chatOpen={chatOpen}
                setChatOpen={setChatOpen}
              />

              <Box sx={{ flex: 1, display: "flex", overflow: "hidden" }}>

                <Box sx={{ flex: 1 }}>
                  <ResumeEditor />
                </Box>

                {chatOpen && (
                  <Box sx={{ width: 320, borderLeft: "1px solid #ddd" }}>
                    <AIChat />
                  </Box>
                )}

              </Box>
            </Box>
          ) : (
            <Navigate to="/login" />
          )
        }
      />

    </Routes>
  );
}