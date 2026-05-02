import { useState } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  CircularProgress
} from "@mui/material";
import { getToken } from "../auth/auth"; 
import API_URL from "../config/api";

const token = getToken();

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

    if (!token) return alert("Please login first");

    const formData = new FormData();
    formData.append("file", file);

    setUploading(true);

    try {
      const res = await fetch(`${API_URL}/upload/`, {
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

      const resume = parseResumeSafe(data.analysis);
      const html = resumeToHTML(resume);

      if (editor) {
        editor.commands.setContent(html);
      }

    } catch (err) {
      console.error(err);
      alert("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <AppBar position="static" elevation={1}>
      <Toolbar>
        <Typography sx={{ flexGrow: 1 }}>
          AI Resume Reviewer
        </Typography>

        <Box sx={{ display: "flex", gap: 1 }}>

          <Button
            variant="contained"
            onClick={() => setChatOpen((p) => !p)}
          >
            {chatOpen ? "Hide Chat" : "Show Chat"}
          </Button>

          <Button
            variant="contained"
            component="label"
            disabled={uploading}
          >
            {uploading ? (
              <Box sx={{ display: "flex", gap: 1 }}>
                <CircularProgress size={16} />
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

          <Button variant="contained" onClick={handleLogout}>
            Logout
          </Button>

        </Box>
      </Toolbar>
    </AppBar>
  );
}