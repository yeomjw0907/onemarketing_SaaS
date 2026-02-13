"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import Image from "@tiptap/extension-image";
import { cn } from "@/lib/utils";
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  Heading1, Heading2, Heading3,
  List, ListOrdered, Quote, Code, Minus,
  Link as LinkIcon, Image as ImageIcon, Highlighter,
  AlignLeft, AlignCenter, AlignRight,
  Undo2, Redo2,
} from "lucide-react";

interface TiptapEditorProps {
  content?: string;
  onChange?: (html: string) => void;
  placeholder?: string;
  editable?: boolean;
  className?: string;
}

export function TiptapEditor({
  content = "",
  onChange,
  placeholder = "내용을 작성하세요...",
  editable = true,
  className,
}: TiptapEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Placeholder.configure({ placeholder }),
      Underline,
      Link.configure({ openOnClick: false, HTMLAttributes: { class: "text-primary underline" } }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Highlight.configure({ multicolor: false }),
      Image.configure({ inline: false }),
    ],
    content,
    editable,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: cn(
          "prose prose-sm sm:prose-base max-w-none focus:outline-none",
          "prose-headings:font-semibold prose-headings:tracking-tight",
          "prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg",
          "prose-p:leading-relaxed prose-p:my-2",
          "prose-blockquote:border-l-4 prose-blockquote:border-primary/30 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-muted-foreground",
          "prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:font-mono",
          "prose-pre:bg-muted prose-pre:p-4 prose-pre:rounded-lg",
          "prose-ul:list-disc prose-ol:list-decimal",
          "prose-a:text-primary prose-a:underline",
          "prose-img:rounded-lg prose-img:max-w-full",
          "prose-hr:border-border",
          "min-h-[300px]",
        ),
      },
    },
  });

  if (!editor) return null;

  const addLink = () => {
    const url = window.prompt("URL을 입력하세요:");
    if (url) {
      editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    }
  };

  const addImage = () => {
    const url = window.prompt("이미지 URL을 입력하세요:");
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  const ToolBtn = ({
    onClick, active, children, title,
  }: { onClick: () => void; active?: boolean; children: React.ReactNode; title: string }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        "p-1.5 rounded-md transition-colors",
        active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      {children}
    </button>
  );

  const iconSize = "h-4 w-4";

  return (
    <div className={cn("border rounded-lg overflow-hidden bg-background", className)}>
      {/* 툴바 */}
      {editable && (
        <div className="flex items-center gap-0.5 flex-wrap border-b px-2 py-1.5 bg-muted/30">
          {/* Undo/Redo */}
          <ToolBtn onClick={() => editor.chain().focus().undo().run()} title="되돌리기"><Undo2 className={iconSize} /></ToolBtn>
          <ToolBtn onClick={() => editor.chain().focus().redo().run()} title="다시실행"><Redo2 className={iconSize} /></ToolBtn>
          <div className="w-px h-5 bg-border mx-1" />

          {/* Text style */}
          <ToolBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="굵게"><Bold className={iconSize} /></ToolBtn>
          <ToolBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="기울임"><Italic className={iconSize} /></ToolBtn>
          <ToolBtn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")} title="밑줄"><UnderlineIcon className={iconSize} /></ToolBtn>
          <ToolBtn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive("strike")} title="취소선"><Strikethrough className={iconSize} /></ToolBtn>
          <ToolBtn onClick={() => editor.chain().focus().toggleHighlight().run()} active={editor.isActive("highlight")} title="형광펜"><Highlighter className={iconSize} /></ToolBtn>
          <div className="w-px h-5 bg-border mx-1" />

          {/* Headings */}
          <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive("heading", { level: 1 })} title="제목 1"><Heading1 className={iconSize} /></ToolBtn>
          <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })} title="제목 2"><Heading2 className={iconSize} /></ToolBtn>
          <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive("heading", { level: 3 })} title="제목 3"><Heading3 className={iconSize} /></ToolBtn>
          <div className="w-px h-5 bg-border mx-1" />

          {/* Lists & blocks */}
          <ToolBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} title="글머리 목록"><List className={iconSize} /></ToolBtn>
          <ToolBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} title="번호 목록"><ListOrdered className={iconSize} /></ToolBtn>
          <ToolBtn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")} title="인용"><Quote className={iconSize} /></ToolBtn>
          <ToolBtn onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive("codeBlock")} title="코드 블록"><Code className={iconSize} /></ToolBtn>
          <ToolBtn onClick={() => editor.chain().focus().setHorizontalRule().run()} title="구분선"><Minus className={iconSize} /></ToolBtn>
          <div className="w-px h-5 bg-border mx-1" />

          {/* Align */}
          <ToolBtn onClick={() => editor.chain().focus().setTextAlign("left").run()} active={editor.isActive({ textAlign: "left" })} title="왼쪽 정렬"><AlignLeft className={iconSize} /></ToolBtn>
          <ToolBtn onClick={() => editor.chain().focus().setTextAlign("center").run()} active={editor.isActive({ textAlign: "center" })} title="가운데 정렬"><AlignCenter className={iconSize} /></ToolBtn>
          <ToolBtn onClick={() => editor.chain().focus().setTextAlign("right").run()} active={editor.isActive({ textAlign: "right" })} title="오른쪽 정렬"><AlignRight className={iconSize} /></ToolBtn>
          <div className="w-px h-5 bg-border mx-1" />

          {/* Insert */}
          <ToolBtn onClick={addLink} active={editor.isActive("link")} title="링크"><LinkIcon className={iconSize} /></ToolBtn>
          <ToolBtn onClick={addImage} title="이미지"><ImageIcon className={iconSize} /></ToolBtn>
        </div>
      )}

      {/* 에디터 본문 */}
      <div className="px-6 py-4">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

// 읽기 전용 렌더러 (보기 페이지용)
export function TiptapViewer({ content }: { content: string }) {
  return <TiptapEditor content={content} editable={false} className="border-0" />;
}
