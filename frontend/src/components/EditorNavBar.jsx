import { Box, Button, Divider } from "@mui/material";
import API_URL from "../config/api";

export default function EditorNavBar({ editor }) {
  if (!editor) return null;

  return (
    <Box
      sx={{
        display: "flex",
        gap: 1,
        p: 1,
        borderBottom: "1px solid #ddd",
        backgroundColor: "#fafafa",
      }}
    >
      <Button size="small" onClick={() => editor.chain().focus().toggleBold().run()}>
        Bold
      </Button>

      <Button size="small" onClick={() => editor.chain().focus().toggleItalic().run()}>
        Italic
      </Button>

      <Button size="small" onClick={() => editor.chain().focus().toggleBulletList().run()}>
        Bullet
      </Button>

      <Button size="small" onClick={() => editor.chain().focus().setTextAlign("center").run()}>
        Center
      </Button>

      <Divider orientation="vertical" flexItem />

      <Button size="small" onClick={() => editor.chain().focus().undo().run()}>
        Undo
      </Button>

      <Button size="small" onClick={() => editor.chain().focus().redo().run()}>
        Redo
      </Button>
    </Box>
  );
}