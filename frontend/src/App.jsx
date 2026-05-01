import { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Box } from "@mui/material";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ResumePage from "./pages/ResumePage";

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsAuthenticated(!!token);
    setLoading(false);
  }, []);

  if (loading) {
    return <Box>Loading...</Box>;
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      <Route
        path="/"
        element={
          isAuthenticated ? <ResumePage /> : <Navigate to="/login" />
        }
      />
    </Routes>
  );
}