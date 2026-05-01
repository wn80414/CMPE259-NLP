import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import { Box } from "@mui/material";
import { useEffect } from "react";
import EditorNavBar from "./EditorNavbar";

export default function TipTapEditor() {

  const editor = useEditor({
    extensions: [
      StarterKit,
      TextAlign.configure({
        types: ["heading", "paragraph"],
        defaultAlignment: "left",
      }),
    ],
    content: `
      <h2>Resume</h2>
      <p>Start editing...</p>
    `,
  });

  //  Listen for PDF upload → inject into editor
  useEffect(() => {
    const handleResumeLoad = (e) => {
      const text = e.detail;
      if (!editor || !text) return;

      // Replace entire content cleanly
      editor.commands.setContent(`
        <h2>Imported Resume</h2>
        <p>${text.replace(/\n/g, "<br/>")}</p>
      `);
    };

    window.addEventListener("resume-loaded", handleResumeLoad);

    return () => {
      window.removeEventListener("resume-loaded", handleResumeLoad);
    };
  }, [editor]);

  if (!editor) return null;

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
      }}
    >
      {/* Toolbar */}
      <EditorNavBar editor={editor} />

      {/* Editor Body */}
      <Box
        sx={{
          flex: 1,
          overflow: "auto",
          p: 2,
          backgroundColor: "#fff",
          color: "#000",
        }}
      >
        <EditorContent editor={editor} />
      </Box>
    </Box>
  );
}