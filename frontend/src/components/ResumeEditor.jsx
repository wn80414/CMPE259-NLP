import { Box } from "@mui/material";
import TipTapEditor from "./TipTapEditor";
import AIChat from "./AIChat";

export default function ResumeEditor({ chatOpen }) {
  return (
    <Box
      sx={{
        flex: 1,
        display: "flex",
        flexDirection: "row",
        overflow: "hidden",
      }}
    >

      {/* LEFT CHAT (conditional) */}
      {chatOpen && (
        <Box
          sx={{
            width: 320,
            borderRight: "1px solid #ddd",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <AIChat />
        </Box>
      )}

      {/* MAIN EDITOR ALWAYS FULL WIDTH WHEN CLOSED */}
      <Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <TipTapEditor />
      </Box>

    </Box>
  );
}