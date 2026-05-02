import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import { Box, GlobalStyles } from "@mui/material";
import { useEffect } from "react";
import API_URL from "../config/api";

export default function TipTapEditor({ onEditorReady }) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
    ],
    content: "<h2>Resume</h2><p>Start writing...</p>",
  });

  useEffect(() => {
    if (editor && onEditorReady) {
      onEditorReady(editor);
    }
  }, [editor, onEditorReady]);

  if (!editor) return null;

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        width: "100%",
        overflow: "hidden", // important: no scroll here
        border: "1px solid #ccc",
        borderRadius: 1,
      }}
    >
      {/* Toolbar */}
      <Box
        sx={{
          flexShrink: 0,
          borderBottom: "1px solid #eee",
          p: 0.5,
        }}
      />

      {/* Editor ONLY (no scrolling) */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          minHeight: 0,
          overflow: "hidden"
        }}
      >
        <EditorContent editor={editor} />
      </Box>

      {/* TipTap base styling */}
      <GlobalStyles
        styles={{
          ".ProseMirror": {
            height: "100%",
            width: "100%",
            padding: "20px",
            outline: "none",
            lineHeight: "1.6",
          },
        }}
      />
    </Box>
  );
}