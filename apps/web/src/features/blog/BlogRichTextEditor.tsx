"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import type { Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import { TableKit } from "@tiptap/extension-table";
import { Markdown } from "@tiptap/markdown";
import Highlight from "@tiptap/extension-highlight";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import { TextStyleKit } from "@tiptap/extension-text-style";
import { toast } from "sonner";
import { cn } from "@/lib/cn";

type Props = {
  value: string;
  onChange: (value: string) => void;
  addImage: (file: File) => string;
};

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"]);

function isHtmlContent(content: string): boolean {
  return /^\s*<(?:p|h[1-6]|ul|ol|blockquote|pre|table|img|div|figure|hr|span)\b/i.test(content);
}

function ToolbarButton({
  label,
  active = false,
  disabled = false,
  onClick,
  className,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className={cn(
        "inline-flex h-9 items-center justify-center whitespace-nowrap rounded-lg border px-2.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40",
        active
          ? "border-primary/30 bg-primary/10 text-primary"
          : "border-transparent text-foreground/80 hover:border-border hover:bg-background hover:text-foreground",
        className,
      )}
    >
      {label}
    </button>
  );
}

export function BlogRichTextEditor({ value, onChange, addImage }: Props) {
  const editorRef = useRef<Editor | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const addImages = useCallback((files: File[], position?: number) => {
    const editor = editorRef.current;
    if (!editor || files.length === 0) return;

    const accepted: File[] = [];
    for (const file of files) {
      if (!IMAGE_TYPES.has(file.type)) {
        toast.error(`الصيغة غير مدعومة للصورة «${file.name}». اختر JPG أو PNG أو WEBP أو GIF أو AVIF.`);
      } else if (file.size > MAX_IMAGE_SIZE) {
        toast.error(`حجم الصورة «${file.name}» يتجاوز الحد المسموح (10 ميجابايت).`);
      } else {
        accepted.push(file);
      }
    }
    if (accepted.length === 0) return;

    const images = accepted.map((file) => ({
      type: "image" as const,
      attrs: { src: addImage(file), alt: file.name, title: file.name },
    }));
    const insertionPosition = position ?? editor.state.selection.from;
    const safePosition = Math.min(insertionPosition, editor.state.doc.content.size);
    editor.chain().focus().insertContentAt(safePosition, images).run();
  }, [addImage]);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Image.configure({
        allowBase64: false,
        HTMLAttributes: { class: "blog-inline-image" },
      }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TextStyleKit,
      Highlight.configure({ multicolor: true }),
      Subscript,
      Superscript,
      Placeholder.configure({ placeholder: "ابدأ الكتابة هنا… اكتب أو الصق محتواك، واسحب الصور إلى الموضع الذي تريده." }),
      TableKit.configure({ table: { resizable: true } }),
      Markdown,
    ],
    content: value,
    contentType: isHtmlContent(value) ? "html" : "markdown",
    editorProps: {
      attributes: {
        dir: "auto",
        class: "blog-editor-content prose prose-slate max-w-none min-h-[420px] px-6 py-5 text-foreground outline-none dark:prose-invert prose-headings:font-bold prose-a:text-primary prose-img:mx-auto prose-img:max-h-[640px] prose-img:rounded-xl",
        "aria-label": "محتوى المقال",
      },
      dragCopies: (event) => {
        const target = event.target;
        if (target instanceof Element && target.closest("img.blog-inline-image")) return false;
        return /Mac|iPhone|iPad/.test(navigator.platform) ? event.altKey : event.ctrlKey;
      },
      handleDrop: (view, event) => {
        if (view.dragging) return false;
        const files = Array.from(event.dataTransfer?.files ?? []).filter((file) => file.type.startsWith("image/"));
        if (files.length === 0) return false;
        event.preventDefault();
        const position = view.posAtCoords({ left: event.clientX, top: event.clientY })?.pos;
        addImages(files, position);
        return true;
      },
      handlePaste: (view, event) => {
        const files = Array.from(event.clipboardData?.files ?? []).filter((file) => file.type.startsWith("image/"));
        if (files.length === 0) return false;
        event.preventDefault();
        addImages(files, view.state.selection.from);
        return true;
      },
    },
    onUpdate: ({ editor: currentEditor }) => onChange(currentEditor.getHTML()),
  });

  useEditorState({
    editor,
    selector: ({ transactionNumber }) => transactionNumber,
  });

  useEffect(() => {
    editorRef.current = editor;
    return () => {
      editorRef.current = null;
    };
  }, [editor]);

  if (!editor) {
    return <div className="min-h-[480px] animate-pulse rounded-xl bg-muted/40" aria-label="جارٍ تجهيز محرر المقال" />;
  }

  const currentFontSize = editor.getAttributes("textStyle").fontSize as string | undefined;
  const currentFontFamily = editor.getAttributes("textStyle").fontFamily as string | undefined;
  const currentColor = editor.getAttributes("textStyle").color as string | undefined;
  const currentHighlight = editor.getAttributes("highlight").color as string | undefined;
  const selectedImage = editor.isActive("image");
  const activeTable = editor.isActive("table");

  const addLink = () => {
    const currentHref = editor.getAttributes("link").href as string | undefined;
    const href = window.prompt("أدخل رابط الصفحة", currentHref ?? "https://");
    if (href === null) return;
    if (!href.trim()) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    let url: URL;
    try {
      url = new URL(href.trim(), window.location.origin);
    } catch {
      toast.error("أدخل رابطاً صالحاً.");
      return;
    }
    if (!["https:", "mailto:"].includes(url.protocol)) {
      toast.error("الروابط المسموح بها تبدأ بـ https://.");
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url.href }).run();
  };

  return (
    <div
      className={cn("overflow-hidden rounded-xl border bg-background", dragging && "border-primary ring-2 ring-primary/20")}
      onDragEnter={(event) => {
        if (editorRef.current?.view.dragging) return;
        if (Array.from(event.dataTransfer.items).some((item) => item.type.startsWith("image/"))) {
          event.preventDefault();
          setDragging(true);
        }
      }}
      onDragOver={(event) => {
        if (editorRef.current?.view.dragging) return;
        if (Array.from(event.dataTransfer.types).includes("Files")) event.preventDefault();
      }}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false);
      }}
      onDrop={() => setDragging(false)}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
        multiple
        className="hidden"
        onChange={(event) => {
          addImages(Array.from(event.target.files ?? []));
          event.target.value = "";
        }}
      />
      <div className="border-b bg-muted/30 p-2.5">
        <div className="flex flex-wrap items-center gap-1">
          <label className="sr-only" htmlFor="blog-text-style">نوع الفقرة</label>
          <select
            id="blog-text-style"
            aria-label="نوع الفقرة"
            value={editor.isActive("heading", { level: 1 }) ? "h1" : editor.isActive("heading", { level: 2 }) ? "h2" : editor.isActive("heading", { level: 3 }) ? "h3" : editor.isActive("heading", { level: 4 }) ? "h4" : "paragraph"}
            onChange={(event) => {
              const value = event.target.value;
              if (value === "paragraph") editor.chain().focus().setParagraph().run();
              else editor.chain().focus().toggleHeading({ level: Number(value.slice(1)) as 1 | 2 | 3 | 4 }).run();
            }}
            className="h-9 rounded-lg border border-border/70 bg-background px-2 text-xs font-semibold"
          >
            <option value="paragraph">نص عادي</option>
            <option value="h1">عنوان رئيسي</option>
            <option value="h2">عنوان فرعي</option>
            <option value="h3">عنوان صغير</option>
            <option value="h4">عنوان تفصيلي</option>
          </select>
          <span className="mx-1 h-6 border-r" />
          <ToolbarButton label="عريض" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()} />
          <ToolbarButton label="مائل" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()} />
          <ToolbarButton label="تسطير" active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()} />
          <ToolbarButton label="يتوسطه خط" active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()} />
          <ToolbarButton label="مرتفع" active={editor.isActive("superscript")} onClick={() => editor.chain().focus().toggleSuperscript().run()} />
          <ToolbarButton label="منخفض" active={editor.isActive("subscript")} onClick={() => editor.chain().focus().toggleSubscript().run()} />
          <ToolbarButton label="إزالة لون النص" onClick={() => editor.chain().focus().unsetColor().run()} />
          <span className="mx-1 h-6 border-r" />
          <label className="flex h-9 items-center gap-1 rounded-lg border border-transparent px-2 text-xs font-semibold hover:border-border" title="لون النص">
            لون النص
            <input
              type="color"
              aria-label="اختيار لون النص"
              value={currentColor ?? "#202124"}
              onChange={(event) => editor.chain().focus().setColor(event.target.value).run()}
              className="h-6 w-6 cursor-pointer rounded border-0 bg-transparent p-0"
            />
          </label>
          <label className="flex h-9 items-center gap-1 rounded-lg border border-transparent px-2 text-xs font-semibold hover:border-border" title="تمييز النص">
            تمييز
            <input
              type="color"
              aria-label="اختيار لون التمييز"
              value={currentHighlight ?? "#fff176"}
              onChange={(event) => editor.chain().focus().setHighlight({ color: event.target.value }).run()}
              className="h-6 w-6 cursor-pointer rounded border-0 bg-transparent p-0"
            />
          </label>
          <ToolbarButton label="إزالة التمييز" onClick={() => editor.chain().focus().unsetHighlight().run()} />
          <select
            aria-label="حجم الخط"
            value={currentFontSize ?? ""}
            onChange={(event) => {
              const size = event.target.value;
              if (size) editor.chain().focus().setFontSize(size).run();
              else editor.chain().focus().unsetFontSize().run();
            }}
            className="h-9 rounded-lg border border-border/70 bg-background px-2 text-xs font-semibold"
          >
            <option value="">حجم الخط</option>
            <option value="12px">12</option>
            <option value="14px">14</option>
            <option value="16px">16</option>
            <option value="18px">18</option>
            <option value="24px">24</option>
            <option value="32px">32</option>
          </select>
          <select
            aria-label="نوع الخط"
            value={currentFontFamily ?? ""}
            onChange={(event) => {
              if (event.target.value) editor.chain().focus().setFontFamily(event.target.value).run();
              else editor.chain().focus().unsetFontFamily().run();
            }}
            className="h-9 rounded-lg border border-border/70 bg-background px-2 text-xs font-semibold"
          >
            <option value="">نوع الخط</option>
            <option value="Arial">Arial</option>
            <option value="Cairo">Cairo</option>
            <option value="Tahoma">Tahoma</option>
            <option value="Georgia">Georgia</option>
            <option value="Verdana">Verdana</option>
          </select>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-1 border-t border-border/60 pt-2">
          <ToolbarButton label="قائمة نقطية" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()} />
          <ToolbarButton label="قائمة مرقمة" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()} />
          <ToolbarButton label="اقتباس" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()} />
          <ToolbarButton label="كود داخل السطر" active={editor.isActive("code")} onClick={() => editor.chain().focus().toggleCode().run()} />
          <ToolbarButton label="كتلة كود" active={editor.isActive("codeBlock")} onClick={() => editor.chain().focus().toggleCodeBlock().run()} />
          <select
            aria-label="محاذاة النص"
            value={
              editor.isActive({ textAlign: "right" }) ? "right"
                : editor.isActive({ textAlign: "center" }) ? "center"
                  : editor.isActive({ textAlign: "left" }) ? "left"
                    : editor.isActive({ textAlign: "justify" }) ? "justify" : "right"
            }
            onChange={(event) => editor.chain().focus().setTextAlign(event.target.value as "left" | "center" | "right" | "justify").run()}
            className="h-9 rounded-lg border border-border/70 bg-background px-2 text-xs font-semibold"
          >
            <option value="right">محاذاة لليمين</option>
            <option value="center">توسيط</option>
            <option value="left">محاذاة لليسار</option>
            <option value="justify">ضبط النص</option>
          </select>
          <select
            aria-label="تباعد الأسطر"
            value={editor.getAttributes("textStyle").lineHeight as string | undefined ?? ""}
            onChange={(event) => {
              if (event.target.value) editor.chain().focus().setLineHeight(event.target.value).run();
              else editor.chain().focus().unsetLineHeight().run();
            }}
            className="h-9 rounded-lg border border-border/70 bg-background px-2 text-xs font-semibold"
          >
            <option value="">تباعد الأسطر</option>
            <option value="1.25">مضغوط</option>
            <option value="1.5">متوسط</option>
            <option value="1.8">واسع</option>
            <option value="2">واسع جداً</option>
          </select>
          <ToolbarButton label="إضافة رابط" active={editor.isActive("link")} onClick={addLink} />
          <ToolbarButton label="إضافة صورة داخل المقال" onClick={() => fileInputRef.current?.click()} />
          <ToolbarButton label="خط فاصل" onClick={() => editor.chain().focus().setHorizontalRule().run()} />
          <ToolbarButton label="إضافة جدول" onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} />
          <ToolbarButton label="تراجع" disabled={!editor.can().undo()} onClick={() => editor.chain().focus().undo().run()} />
          <ToolbarButton label="إعادة" disabled={!editor.can().redo()} onClick={() => editor.chain().focus().redo().run()} />
          <ToolbarButton label="مسح التنسيق" onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()} />
        </div>

        {(selectedImage || activeTable) && (
          <div className="mt-2 flex flex-wrap items-center gap-1 border-t border-border/60 pt-2" aria-label="أدوات العنصر المحدد">
            {selectedImage && (
              <>
                <span className="px-2 text-xs font-bold text-muted-foreground">حجم الصورة:</span>
                <ToolbarButton label="صغير" onClick={() => editor.chain().focus().updateAttributes("image", { width: 320, height: null }).run()} />
                <ToolbarButton label="متوسط" onClick={() => editor.chain().focus().updateAttributes("image", { width: 560, height: null }).run()} />
                <ToolbarButton label="كبير" onClick={() => editor.chain().focus().updateAttributes("image", { width: 800, height: null }).run()} />
                <ToolbarButton label="الحجم الأصلي" onClick={() => editor.chain().focus().updateAttributes("image", { width: null, height: null }).run()} />
                <ToolbarButton
                  label="تكرار الصورة"
                  onClick={() => {
                    const selection = editor.state.selection;
                    const image = editor.state.doc.nodeAt(selection.from);
                    if (image?.type.name !== "image" || selection.to !== selection.from + image.nodeSize) return;
                    editor.chain().focus().insertContentAt(selection.to, image.toJSON()).run();
                  }}
                />
                <ToolbarButton
                  label="وصف الصورة"
                  onClick={() => {
                    const alt = editor.getAttributes("image").alt as string | undefined;
                    const nextAlt = window.prompt("اكتب وصفاً للصورة", alt ?? "");
                    if (nextAlt !== null) editor.chain().focus().updateAttributes("image", { alt: nextAlt }).run();
                  }}
                />
              </>
            )}
            {activeTable && (
              <>
                <span className="px-2 text-xs font-bold text-muted-foreground">الجدول:</span>
                <ToolbarButton label="إضافة صف" onClick={() => editor.chain().focus().addRowAfter().run()} />
                <ToolbarButton label="إضافة عمود" onClick={() => editor.chain().focus().addColumnAfter().run()} />
                <ToolbarButton label="حذف الصف" onClick={() => editor.chain().focus().deleteRow().run()} />
                <ToolbarButton label="حذف العمود" onClick={() => editor.chain().focus().deleteColumn().run()} />
                <ToolbarButton label="حذف الجدول" onClick={() => editor.chain().focus().deleteTable().run()} />
              </>
            )}
          </div>
        )}
      </div>

      <div className="relative">
        <EditorContent editor={editor} />
        {dragging && (
          <div className="pointer-events-none absolute inset-3 z-10 flex items-center justify-center rounded-xl border-2 border-dashed border-primary bg-background/90 text-sm font-bold text-primary">
            أفلت الصورة هنا لإضافتها في موضع المؤشر
          </div>
        )}
      </div>
      <p className="border-t bg-muted/20 px-4 py-2 text-xs text-muted-foreground">
        الصور المضافة تظل مؤقتة أثناء التحرير، وتُرفع عند حفظ المقال أو نشره. الصور التي تحذفها قبل ذلك لن تُرفع. اسحب الصورة لنقلها، أو استخدم «تكرار الصورة» لنسخها.
      </p>
    </div>
  );
}
