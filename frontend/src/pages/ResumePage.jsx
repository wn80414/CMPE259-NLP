import { useState, useMemo } from "react";
import { Box } from "@mui/material";

import PageNavBar from "../components/PageNavBar";
import JSONEditor from "../components/JSONEditor";
import AIChat from "../components/AIChat";
import JSONPreview from "../components/JSONPreview";

import { ResumeSchema } from "../schema/ResumeSchema";

export default function ResumePage() {
  const [chatOpen, setChatOpen] = useState(true);

  const initialResume = useMemo(() => ResumeSchema.parse({}), []);
  const [resume, setResume] = useState(initialResume);
  const [suggestions, setSuggestions] = useState([]);

  const scrollToPath = (path) => {
    const element = document.getElementById(path);
    if (!element) {
      console.warn(`Element with id "${path}" not found.`);
      return;
    }

    let container = element.parentElement;
    while (container) {
      const overflow = window.getComputedStyle(container).overflowY;
      if (overflow === 'auto' || overflow === 'scroll') {
        break;
      }
      container = container.parentElement;
    }

    if (container) {
      const elementRect = element.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      const offset = elementRect.top - containerRect.top + container.scrollTop;
      container.scrollTo({
        top: offset - 20,
        behavior: 'smooth',
      });
    } else {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <Box
      sx={{
        height: "100vh",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        bgcolor: "#f8fafc",
      }}
    >
      <Box
        sx={{
          bgcolor: "white",
          borderBottom: "1px solid #e2e8f0",
          zIndex: 10,
          flexShrink: 0,
          width: "100%",   
          p: 0,            
          m: 0,            
        }}
      >
        <PageNavBar
          chatOpen={chatOpen}
          setChatOpen={setChatOpen}
          resume={resume}
          setResume={setResume}
        />
      </Box>

      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "row",
          minHeight: 0,
          overflow: "hidden",         // ensure no overflow in this row
        }}
      >
        <Box
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            minWidth: 0,
            overflow: "hidden",
          }}
        >
          <Box
            sx={{
              width: "100%",
              maxWidth: "1440px",
              px: { xs: 1, md: 2 },
              display: "flex",
              flex: "auto",
              minHeight: 0,
              overflow: "hidden",
            }}
          >
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
        </Box>

        {chatOpen && (
          <Box
            sx={{
              width: 380,
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
              onScrollToPath={scrollToPath}
            />
          </Box>
        )}
      </Box>
    </Box>
  );
}