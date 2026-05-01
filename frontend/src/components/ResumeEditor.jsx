import { Box } from "@mui/material";
import TipTapEditor from "./TipTapEditor";
import AIChat from "./AIChat";

export default function ResumeEditor({ chatOpen, onEditorReady }) {
  return (
    <Box
      sx={{
        flex: 1,
        display: "flex",
        flexDirection: "row",
        overflow: "hidden",
        height: "100%", // 🔥 important
      }}
    >

      {/* LEFT CHAT */}
      {chatOpen && (
        <Box
          sx={{
            width: 320,
            borderRight: "1px solid #ddd",
            display: "flex",
            flexDirection: "column",
            height: "100%",
          }}
        >
          <AIChat />
        </Box>
      )}

      {/* MAIN EDITOR */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
        }}
      >
        <TipTapEditor onEditorReady={onEditorReady} />
      </Box>

    </Box>
  );
}