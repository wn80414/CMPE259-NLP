import { AppBar, Toolbar, Typography, Button, Box } from "@mui/material";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export default function PageNavBar({ chatOpen, setChatOpen }) {

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    // Get current session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      alert("Please login first");
      return;
    }

    try {
      const res = await fetch("http://127.0.0.1:8000/upload/", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        alert("Resume uploaded successfully!");
      } else {
        alert(data.detail || "Upload failed");
      }

    } catch (err) {
      console.error("Upload failed:", err);
      alert("Upload failed");
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

          {/* Upload JSON */}
          <Button
            color="inherit"
            variant="contained"
            component="label"
          >
            Upload JSON
            <input
              hidden
              type="file"
              accept="application/json"
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