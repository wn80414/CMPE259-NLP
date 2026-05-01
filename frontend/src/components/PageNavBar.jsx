import { useState } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  CircularProgress
} from "@mui/material";

import { parseResumeSafe, resumeToHTML } from "../utils/ResumeFormatter";

export default function PageNavBar({ chatOpen, setChatOpen, editor }) {
  const [uploading, setUploading] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    window.location.href = "/login";
  };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please login first");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setUploading(true);

    try {
      const res = await fetch("http://127.0.0.1:8000/upload/", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.detail || "Upload failed");
        return;
      }

      console.log("LLM Resume JSON:", data);

      const formatted = parseResumeSafe(data.analysis);
      console.log(formatted);
      const html = resumeToHTML(formatted);
      console.log(html);

      if (editor) {
        console.log("Setting editor content...");
        editor.commands.setContent(html);
      }

    } catch (err) {
      console.error("Upload failed:", err);
      alert("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <AppBar position="static" elevation={1}>
      <Toolbar>

        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          AI Resume Reviewer
        </Typography>

        <Box sx={{ display: "flex", gap: 1 }}>

          {/* Chat toggle */}
          <Button
            color="inherit"
            variant="outlined"
            onClick={() => setChatOpen((prev) => !prev)}
          >
            {chatOpen ? "Hide Chat" : "Show Chat"}
          </Button>

          {/* Upload */}
          <Button
            color="inherit"
            variant="contained"
            component="label"
            disabled={uploading}
          >
            {uploading ? (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <CircularProgress size={16} color="inherit" />
                Uploading
              </Box>
            ) : (
              "Upload PDF"
            )}

            <input
              hidden
              type="file"
              accept="application/pdf"
              onChange={handleUpload}
            />
          </Button>

          {/* Logout */}
          <Button
            color="inherit"
            variant="outlined"
            onClick={handleLogout}
          >
            Logout
          </Button>

        </Box>

      </Toolbar>
    </AppBar>
  );
}