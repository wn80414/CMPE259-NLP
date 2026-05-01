import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import { Box } from "@mui/material";
import { useEffect } from "react";
import EditorNavBar from "./EditorNavBar";

export default function ResumeEditor({ onEditorReady }) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
    ],
    content: "<h2>Resume Editor</h2><p>Upload a resume to begin</p>",
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
        minHeight: 0, // IMPORTANT
      }}
    >
      {/* Toolbar */}
      <EditorNavBar editor={editor} />

      {/* Editor wrapper */}
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          display: "flex",
        }}
      >
        <EditorContent editor={editor} />
      </Box>

      {/* TipTap scroll fix */}
      <style>{`
        .ProseMirror {
          height: 100%;
          width: 100%;
          overflow-y: auto;
          padding: 16px;
          outline: none;
          box-sizing: border-box;
        }
      `}</style>
    </Box>
  );
}