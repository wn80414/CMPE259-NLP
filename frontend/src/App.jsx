import { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Box } from "@mui/material";
import { createClient } from "@supabase/supabase-js";

import PageNavBar from "./components/PageNavBar";
import ResumeEditor from "./components/ResumeEditor";
import AIChat from "./components/AIChat";

import Login from "./pages/Login";
import Signup from "./pages/Signup";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export default function App() {
  const [chatOpen, setChatOpen] = useState(true);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription?.unsubscribe();
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
          session ? (
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