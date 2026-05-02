import { useState } from "react";
import { Box, TextField, Button, Typography } from "@mui/material";
import API_URL from "../config/api";

export default function Signup() {
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: ""
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSignup = async () => {
    await fetch(`${API_URL}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });

    alert("Signup successful! Now login.");
  };

  return (
    <Box sx={{ maxWidth: 400, mx: "auto", mt: 10 }}>
      <Typography variant="h4" mb={2}>Sign Up</Typography>

      <TextField
        fullWidth
        name="username"
        label="Username"
        onChange={handleChange}
        sx={{ mb: 2 }}
      />

      <TextField
        fullWidth
        name="email"
        label="Email"
        onChange={handleChange}
        sx={{ mb: 2 }}
      />

      <TextField
        fullWidth
        name="password"
        label="Password"
        type="password"
        onChange={handleChange}
        sx={{ mb: 2 }}
      />

      <Button fullWidth variant="contained" onClick={handleSignup}>
        Sign Up
      </Button>
    </Box>
  );
}