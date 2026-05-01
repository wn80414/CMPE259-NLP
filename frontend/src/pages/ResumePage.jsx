import { useState } from "react";
import { Box } from "@mui/material";

import PageNavBar from "../components/PageNavBar";
import ResumeEditor from "../components/ResumeEditor";
import AIChat from "../components/AIChat";

export default function ResumePage() {
  const [chatOpen, setChatOpen] = useState(true);
  const [editor, setEditor] = useState(null);

  return (
    <Box
      sx={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        bgcolor: "#f8fafc", // A very subtle cool gray background for the app body
        fontFamily: "system-ui, sans-serif",
      }}
    >
      {/* NAVBAR */}
      <Box 
        sx={{ 
          bgcolor: "white", 
          borderBottom: "1px solid #e2e8f0", // Softer modern border
          zIndex: 10 // Keeps navbar shadow/border above the main content
        }}
      >
        <PageNavBar
          chatOpen={chatOpen}
          setChatOpen={setChatOpen}
          editor={editor}
        />
      </Box>

      {/* MAIN AREA */}
      <Box sx={{ flex: 1, display: "flex", minHeight: 0, position: "relative" }}>
        
        {/* EDITOR */}
        <Box
          sx={{
            flex: 1,
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
            minHeight: 0, // IMPORTANT for scroll
            bgcolor: "white", // Keeps the editing canvas clean
          }}
        >
          <ResumeEditor onEditorReady={setEditor} />
        </Box>

        {/* CHAT */}
        {chatOpen && (
          <Box
            sx={{
              width: { xs: '100%', sm: 380, md: 400 }, // Responsive: wider on larger screens
              borderLeft: "1px solid #e2e8f0", 
              bgcolor: "white",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              boxShadow: "-4px 0 24px rgba(0,0,0,0.02)", // Subtle drop shadow casting into the editor area
              zIndex: 5,
              transition: "width 0.3s ease" // Smooth transition if you toggle it
            }}
          >
            <AIChat />
          </Box>
        )}
      </Box>
    </Box>
  );
}