import { useState } from "react";
import { Box, TextField, Button, Typography, Tab, Tabs } from "@mui/material";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export default function AuthPage() {
  const [tab, setTab] = useState(0);
  const [form, setForm] = useState({
    email: "",
    password: "",
    name: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleLogin = async () => {
    setLoading(true);
    setError("");
    const { data, error: loginError } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    });
    setLoading(false);
    if (loginError) {
      setError(loginError.message);
    } else {
      // Session is automatically stored by Supabase - just redirect
      window.location.href = "/";
    }
  };

  const handleSignup = async () => {
    setLoading(true);
    setError("");
    const { data, error: signupError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          name: form.name,
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    setLoading(false);
    if (signupError) {
      setError(signupError.message);
    } else {
      setError("✓ Signup successful! You can now login.");
      setTimeout(() => {
        setTab(0);
        setForm({ email: "", password: "", name: "" });
        setError("");
      }, 2000);
    }
  };

  return (
    <Box sx={{ maxWidth: 400, mx: "auto", mt: 10 }}>
      <Typography variant="h4" mb={2}>Auth</Typography>

      <Tabs value={tab} onChange={(e, newValue) => setTab(newValue)}>
        <Tab label="Login" />
        <Tab label="Signup" />
      </Tabs>

      {error && (
        <Box sx={{ 
          mt: 2, 
          p: 1.5, 
          bgcolor: error.startsWith("✓") ? "#e8f5e9" : "#ffebee", 
          color: error.startsWith("✓") ? "#2e7d32" : "#c62828", 
          borderRadius: 1 
        }}>
          <Typography variant="body2">{error}</Typography>
        </Box>
      )}

      {tab === 0 && (
        <Box>
          <TextField
            fullWidth
            name="email"
            label="Email"
            value={form.email}
            onChange={handleChange}
            sx={{ mb: 2, mt: 2 }}
          />
          <TextField
            fullWidth
            name="password"
            label="Password"
            type="password"
            value={form.password}
            onChange={handleChange}
            sx={{ mb: 2 }}
          />
          <Button fullWidth variant="contained" onClick={handleLogin} disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </Button>
        </Box>
      )}

      {tab === 1 && (
        <Box>
          <TextField
            fullWidth
            name="name"
            label="Name"
            value={form.name}
            onChange={handleChange}
            sx={{ mb: 2, mt: 2 }}
          />
          <TextField
            fullWidth
            name="email"
            label="Email"
            value={form.email}
            onChange={handleChange}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            name="password"
            label="Password"
            type="password"
            value={form.password}
            onChange={handleChange}
            sx={{ mb: 2 }}
          />
          <Button fullWidth variant="contained" onClick={handleSignup} disabled={loading}>
            {loading ? "Signing up..." : "Signup"}
          </Button>
        </Box>
      )}
    </Box>
  );
}