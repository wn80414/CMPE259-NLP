import { useState } from "react";
import { Box } from "@mui/material";

import PageNavBar from "../components/PageNavBar";
import ResumeEditor from "../components/ResumeEditor";
import JSONEditor from "../components/JSONEditor";
import AIChat from "../components/AIChat";
import JSONPreview from "../components/JSONPreview";
import API_URL from "../config/api";
import { ResumeSchema } from "../schema/ResumeSchema";

export default function ResumePage() {
  const [chatOpen, setChatOpen] = useState(true);
  const [resume, setResume] = useState(ResumeSchema.parse({}));
  const [suggestions, setSuggestions] = useState([]);

  return (
    <Box
      sx={{
        height: "100vh",
        width: "100vw",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        bgcolor: "#f8fafc",
      }}
    >
      {/* NAVBAR */}
      <Box sx={{ bgcolor: "white", borderBottom: "1px solid #e2e8f0", zIndex: 10 }}>
        <PageNavBar chatOpen={chatOpen} setChatOpen={setChatOpen} setResume={setResume} />
        
      </Box>

      {/* MAIN CONTENT AREA */}
      
      <Box sx={{ flex: 1, display: "flex", minHeight: 0, overflow: "hidden" }}>
        
        {/* EDITOR & PREVIEW CONTAINER (This grows/shrinks when chat toggles) */}
        <Box sx={{ 
          flex: 1, 
          display: 'flex', 
          minWidth: 0, // Allows the container to shrink below content size
          overflow: 'hidden' 
        }}>
          
          {/* LEFT: FORM SIDE */}
          <Box sx={{ 
            flex: '0 0 58%', 
            height: '100%', 
            overflowY: 'auto', 
            borderRight: '1px solid #e2e8f0',
            bgcolor: '#f8f9fa'
          }}>
            <JSONEditor resume={resume} setResume={setResume} />
          </Box>

          {/* RIGHT: JSON SIDE */}
          <Box sx={{ 
            flex: '0 0 42%', 
            height: '100%', 
            bgcolor: '#1e1e1e',
            display: { xs: 'none', lg: 'block' }, 
            minWidth: 0 
          }}>
            <JSONPreview data={resume} />
          </Box>
        </Box>

        {/* AI CHAT SIDEBAR (Pops up on the far right) */}
        {chatOpen && (
          <Box
            sx={{
              width: { xs: "100%", sm: 380, md: 400 },
              flexShrink: 0, // Prevents the chat from being squished
              borderLeft: "1px solid #e2e8f0",
              bgcolor: "white",
              display: "flex",
              flexDirection: "column",
              boxShadow: "-4px 0 24px rgba(0,0,0,0.02)",
              zIndex: 5,
            }}
          >
            <AIChat resume={resume} setSuggestions={setSuggestions} />
          </Box>
        )}
      </Box>
    </Box>
  );
}