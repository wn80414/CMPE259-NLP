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
      }}
    >
      {/* NAVBAR */}
      <PageNavBar
        chatOpen={chatOpen}
        setChatOpen={setChatOpen}
        editor={editor}
      />

      {/* MAIN AREA */}
      <Box sx={{ flex: 1, display: "flex", minHeight: 0 }}>
        
        {/* EDITOR */}
        <Box
          sx={{
            flex: 1,
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
            minHeight: 0, // IMPORTANT for scroll
          }}
        >
          <ResumeEditor onEditorReady={setEditor} />
        </Box>

        {/* CHAT */}
        {chatOpen && (
          <Box
            sx={{
              width: 320,
              borderLeft: "1px solid #ddd",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            <AIChat />
          </Box>
        )}
      </Box>
    </Box>
  );
}