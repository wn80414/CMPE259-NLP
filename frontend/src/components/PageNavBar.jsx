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
import { ResumeSchema } from "../schema/ResumeSchema";

const token = getToken();

import { parseResumeSafe, resumeToHTML } from "../utils/ResumeFormatter";

export default function PageNavBar({ chatOpen, setChatOpen, resume, setResume }) {

  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    console.log("Saving resume:", resume);
    if (!token) return alert("Please login first");

    const resumeId = localStorage.getItem("resume_id");
    if (!resumeId) return alert("No resume found. Upload first.");

    setSaving(true);

    try {
      const res = await fetch(`${API_URL}/save`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(resume),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.detail || "Save failed");
        return;
      }

      alert("Resume saved successfully!");
      localStorage.setItem("resume_id", data.id);
    } catch (err) {
      console.error("Save Error:", err);
      alert("Failed to save resume.");
    } finally {
      setSaving(false);
    }
  };
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
      console.log(data.id);
      if (data.id) {
        localStorage.setItem("resume_id", data.id);
      }

      const parsedData = ResumeSchema.parse(data.data);

      setResume(parsedData);

      alert("Resume parsed and loaded into editor!");

    } catch (err) {
      console.error("Upload Error:", err);
      alert("Upload failed. Ensure the server returned valid JSON.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <AppBar position="static" elevation={1}>
      <Toolbar>
        <Typography sx={{ flexGrow: 1 }}>
          SWE Resume Reviewer
        </Typography>

        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving || uploading}
          >
            {saving ? (
              <Box sx={{ display: "flex", gap: 1 }}>
                <CircularProgress size={16} />
                Saving
              </Box>
            ) : (
              "Save Resume"
            )}
          </Button>
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