'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import Highlight from '@tiptap/extension-highlight';
import Typography from '@tiptap/extension-typography';
import { useEffect } from 'react';
import { Bold, Italic, Strikethrough, Highlighter, Undo, Redo } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useUIStore } from '@/stores/uiStore';

interface NovelEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  readOnly?: boolean;
}

export function NovelEditor({ content, onChange, placeholder, readOnly }: NovelEditorProps) {
  const { editorFontSize, editorLineHeight, editorFontFamily } = useUIStore();

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        codeBlock: false,
        code: false,
        blockquote: {
          HTMLAttributes: {
            class: 'border-l-4 border-primary/30 pl-4 italic',
          },
        },
      }),
      Placeholder.configure({
        placeholder: placeholder || '여기에 이야기를 작성하세요...',
        emptyEditorClass: 'is-editor-empty',
      }),
      CharacterCount,
      Highlight.configure({
        multicolor: true,
      }),
      Typography,
    ],
    content,
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html);
    },
    editorProps: {
      attributes: {
        class: 'novel-editor prose prose-lg max-w-none focus:outline-none min-h-full',
        style: `font-family: ${editorFontFamily}; font-size: ${editorFontSize}px; line-height: ${editorLineHeight};`,
      },
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content, { emitUpdate: false });
    }
  }, [content, editor]);

  useEffect(() => {
    if (editor) {
      editor.setOptions({
        editorProps: {
          attributes: {
            class: 'novel-editor prose prose-lg max-w-none focus:outline-none min-h-full',
            style: `font-family: ${editorFontFamily}; font-size: ${editorFontSize}px; line-height: ${editorLineHeight};`,
          },
        },
      });
    }
  }, [editor, editorFontSize, editorLineHeight, editorFontFamily]);

  if (!editor) {
    return null;
  }

  return (
    <div className="flex flex-col h-full">
      {/* 툴바 */}
      {!readOnly && (
        <div className="flex items-center gap-1 p-2 border-b bg-muted/30">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => editor.chain().focus().toggleBold().run()}
            data-active={editor.isActive('bold')}
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            data-active={editor.isActive('italic')}
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            data-active={editor.isActive('strike')}
          >
            <Strikethrough className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => editor.chain().focus().toggleHighlight().run()}
            data-active={editor.isActive('highlight')}
          >
            <Highlighter className="h-4 w-4" />
          </Button>

          <Separator orientation="vertical" className="h-6 mx-2" />

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
          >
            <Undo className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
          >
            <Redo className="h-4 w-4" />
          </Button>

          <div className="ml-auto text-xs text-muted-foreground">
            {editor.storage.characterCount.characters().toLocaleString()}자 / {editor.storage.characterCount.words()} 단어
          </div>
        </div>
      )}

      {/* 에디터 */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-3xl mx-auto">
          <EditorContent editor={editor} className="min-h-full" />
        </div>
      </div>

      <style jsx global>{`
        .novel-editor {
          min-height: 100%;
        }

        .novel-editor p {
          margin-bottom: 1em;
        }

        .novel-editor p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: hsl(var(--muted-foreground));
          pointer-events: none;
          height: 0;
        }

        .novel-editor:focus {
          outline: none;
        }

        .novel-editor blockquote {
          border-left: 4px solid hsl(var(--primary) / 0.3);
          padding-left: 1rem;
          font-style: italic;
          margin: 1rem 0;
        }

        .novel-editor strong {
          font-weight: 600;
        }

        .novel-editor em {
          font-style: italic;
        }

        .novel-editor mark {
          background-color: hsl(var(--primary) / 0.2);
          padding: 0.125rem 0.25rem;
          border-radius: 0.125rem;
        }

        [data-active="true"] {
          background-color: hsl(var(--primary) / 0.1);
        }
      `}</style>
    </div>
  );
}
