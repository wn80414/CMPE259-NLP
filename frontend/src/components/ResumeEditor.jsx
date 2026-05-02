import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";

import {
  Box,
  Paper,
  Button,
  Typography,
  Drawer,
  IconButton,
  Fab,
  Badge,
  Chip,
} from "@mui/material";

import LightbulbIcon from "@mui/icons-material/Lightbulb";
import CloseIcon from "@mui/icons-material/Close";

import { useEffect, useRef, useState, useCallback } from "react";
import EditorNavBar from "./EditorNavBar";

export default function ResumeEditor({
  onEditorReady,
  onTextChange,
  suggestions = [],
  setSuggestions,
}) {
  const [panelOpen, setPanelOpen] = useState(false);
  const scrollRef = useRef(null);

  /* ---------------- EDITOR ---------------- */

  const editor = useEditor({
    extensions: [
      StarterKit,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
    ],
    content: "<h2>Resume Editor</h2><p>Upload a resume to begin</p>",
    onUpdate: ({ editor }) => {
      onTextChange?.(editor.getText());
    },
  });

  /* ---------------- INIT ---------------- */

  useEffect(() => {
    if (!editor) return;
    onEditorReady?.(editor);
    onTextChange?.(editor.getText());
  }, [editor]);

  /* ---------------- HELPERS ---------------- */

  const updateSuggestionStatus = useCallback((id, status) => {
    setSuggestions?.((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status } : s))
    );
  }, [setSuggestions]);

  const getTextRange = useCallback(
    (searchText) => {
      if (!editor || !searchText) return null;

      const text = editor.getText();
      const start = text.indexOf(searchText);

      if (start === -1) return null;

      return { from: start, to: start + searchText.length };
    },
    [editor]
  );

  const saveScroll = () => scrollRef.current?.scrollTop || 0;
  const restoreScroll = (pos) => {
    requestAnimationFrame(() => {
      if (scrollRef.current) scrollRef.current.scrollTop = pos;
    });
  };

  /* ---------------- HIGHLIGHTS ---------------- */

  useEffect(() => {
    if (!editor) return;

    editor.commands.selectAll();
    editor.commands.unsetHighlight();

    suggestions.forEach((s) => {
      if (s.status !== "pending") return;

      const range = getTextRange(s.old_text);
      if (!range) return;

      editor
        .chain()
        .setTextSelection(range)
        .setHighlight({ color: "#fff59d" })
        .run();
    });

    editor.commands.blur();
  }, [editor, suggestions, getTextRange]);

  /* ---------------- ACTIONS ---------------- */

  const acceptSuggestion = (item) => {
    const scroll = saveScroll();

    const range = getTextRange(item.old_text);
    if (!range) {
      updateSuggestionStatus(item.id, "missing");
      return;
    }

    editor
      .chain()
      .focus(false)
      .setTextSelection(range)
      .deleteSelection()
      .insertContent(item.new_text)
      .run();

    updateSuggestionStatus(item.id, "accepted");
    restoreScroll(scroll);
  };

  const rejectSuggestion = (item) => {
    updateSuggestionStatus(item.id, "rejected");
  };

  /* ---------------- DATA ---------------- */

  const pending = suggestions.filter((s) => s.status === "pending");

  if (!editor) return null;

  return (
    <>
      {/* EDITOR WRAPPER */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
          position: "relative",
        }}
      >
        <EditorNavBar editor={editor} />

        {/* SCROLL CONTAINER (ONLY ONE) */}
        <Box
          ref={scrollRef}
          sx={{
            flex: 1,
            minHeight: 0,
            overflow: "auto",
            p: 3,
          }}
        >
          <EditorContent editor={editor} />
        </Box>

        {/* FLOAT BUTTON */}
        <Badge
          badgeContent={pending.length}
          color="error"
          sx={{ position: "absolute", bottom: 20, right: 20 }}
        >
          <Fab color="primary" onClick={() => setPanelOpen(true)}>
            <LightbulbIcon />
          </Fab>
        </Badge>
      </Box>

      {/* DRAWER */}
      <Drawer
        anchor="right"
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        PaperProps={{ sx: { width: 380, p: 2 } }}
      >
        <Box display="flex" justifyContent="space-between" mb={2}>
          <Typography fontWeight={700}>AI Suggestions</Typography>
          <IconButton onClick={() => setPanelOpen(false)}>
            <CloseIcon />
          </IconButton>
        </Box>

        {pending.length === 0 && (
          <Typography sx={{ p: 1 }} color="text.secondary">
            No pending suggestions.
          </Typography>
        )}

        {pending.map((item) => (
          <Paper key={item.id} sx={{ p: 2, mb: 2 }}>
            <Chip label={item.category} size="small" sx={{ mb: 1 }} />

            <Typography fontSize={12} fontWeight={700}>
              Before
            </Typography>
            <Box sx={{ bgcolor: "#fee2e2", p: 1, borderRadius: 1 }}>
              {item.old_text}
            </Box>

            <Typography fontSize={12} fontWeight={700} mt={1}>
              After
            </Typography>
            <Box sx={{ bgcolor: "#dcfce7", p: 1, borderRadius: 1 }}>
              {item.new_text}
            </Box>

            <Typography fontSize={12} color="text.secondary" mt={1}>
              {item.reason}
            </Typography>

            <Box display="flex" gap={1} mt={2}>
              <Button
                variant="contained"
                onClick={() => acceptSuggestion(item)}
              >
                Change
              </Button>
              <Button onClick={() => rejectSuggestion(item)}>
                Keep
              </Button>
            </Box>
          </Paper>
        ))}
      </Drawer>
    </>
  );
}