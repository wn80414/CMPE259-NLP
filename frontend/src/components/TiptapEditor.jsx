import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import { Box } from "@mui/material";
import { useEffect } from "react";
import EditorNavBar from "./EditorNavBar";
import { resumeToHTML } from "../utils/ResumeFormatter";

export default function TipTapEditor({ resume, onEditorReady }) {

  const editor = useEditor({
    extensions: [
      StarterKit,
      TextAlign.configure({
        types: ["heading", "paragraph"],
        defaultAlignment: "left",
      }),
    ],
    content: "<h2>Resume Editor</h2><p>Upload a resume to begin</p>",
  });

  // expose editor
  useEffect(() => {
    if (editor && onEditorReady) {
      onEditorReady(editor);
    }
  }, [editor, onEditorReady]);

  // set content safely
  useEffect(() => {
    if (!editor || !resume) return;

    const html = resumeToHTML(resume);
    editor.commands.setContent(html);

  }, [resume, editor]);

  if (!editor) return null;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <EditorNavBar editor={editor} />

      {/* Editor wrapper */}
      <Box
        sx={{
          flex: 1,
          minHeight: 0, 
          overflow: "hidden",
          backgroundColor: "#fff",
          color: "#000",
        }}
      >
        <EditorContent editor={editor} />
      </Box>

      {/* Global CSS fix for TipTap scroll */}
      <style>{`
        .ProseMirror {
          height: 100%;
          max-height: 100%;
          overflow-y: auto;
          padding: 16px;
          outline: none;
        }
      `}</style>
    </Box>
  );
}