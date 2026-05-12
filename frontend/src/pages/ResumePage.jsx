import { useState, useMemo } from "react";
import { Box } from "@mui/material";

import PageNavBar from "../components/PageNavBar";
import JSONEditor from "../components/JSONEditor";
import AIChat from "../components/AIChat";
import JSONPreview from "../components/JSONPreview";

import { ResumeSchema } from "../schema/ResumeSchema";

export default function ResumePage() {
  const [chatOpen, setChatOpen] = useState(true);

  // initialize once
  const initialResume = useMemo(
    () => ResumeSchema.parse({}),
    []
  );

  const [resume, setResume] = useState(initialResume);

  // SINGLE SOURCE OF TRUTH
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
      <Box
        sx={{
          bgcolor: "white",
          borderBottom: "1px solid #e2e8f0",
          zIndex: 10,
          flexShrink: 0,
        }}
      >
        <PageNavBar
          chatOpen={chatOpen}
          setChatOpen={setChatOpen}
          setResume={setResume}
        />
      </Box>

      {/* MAIN */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          minHeight: 0,
          overflow: "hidden",
        }}
      >
        {/* MAIN CONTENT */}
        <Box
          sx={{
            flex: 1,
            display: "flex",
            minWidth: 0,
            overflow: "hidden",
          }}
        >
          {/* EDITOR */}
          <Box
            sx={{
              flex: "0 0 58%",
              height: "100%",
              overflowY: "auto",
              borderRight: "1px solid #e2e8f0",
              bgcolor: "#f8f9fa",
            }}
          >
            <JSONEditor
              resume={resume}
              setResume={setResume}
              suggestions={suggestions}
              setSuggestions={setSuggestions}
            />
          </Box>

          {/* PREVIEW */}
          <Box
            sx={{
              flex: "0 0 42%",
              height: "100%",
              bgcolor: "#1e1e1e",
              display: { xs: "none", lg: "block" },
              minWidth: 0,
              overflow: "auto",
            }}
          >
            <JSONPreview data={resume} />
          </Box>
        </Box>

        {/* CHAT */}
        {chatOpen && (
          <Box
            sx={{
              width: { xs: "100%", sm: 380, md: 400 },
              flexShrink: 0,
              borderLeft: "1px solid #e2e8f0",
              bgcolor: "white",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              boxShadow: "-4px 0 24px rgba(0,0,0,0.02)",
            }}
          >
            <AIChat
              resume={resume}
              setResume={setResume}
              suggestions={suggestions}
              setSuggestions={setSuggestions}
            />
          </Box>
        )}
      </Box>
    </Box>
  );
}