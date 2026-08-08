"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AtSign,
  Mic,
  Paperclip,
  Send,
  Smile,
  Square,
  Trash2,
  X,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { toast } from "@/lib/toast";
import { useSendMessage } from "../../hooks/useMessageActions";
import { useTypingSender, useOnlineMembers } from "../../hooks/usePresence";
import { useCommunityUpload, useVoiceRecorder, type UploadedAsset } from "../../hooks/useMediaUpload";
import { fileExtensionOf, formatFileSize, formatDuration } from "../../utils/format";
import { MemberAvatar } from "../atoms";
import { EmojiPicker } from "./EmojiPicker";
import type { CommunityMessage, CommunityMessageContentType } from "../../types";

interface PendingAttachment {
  key: string;
  file: File | null;
  url: string;
  fileName: string;
  size: number;
  type: CommunityMessageContentType;
  mime: string;
  duration?: number;
  uploading: boolean;
}

interface ComposerProps {
  channelId: string;
  threadId?: string | null;
  replyingTo?: CommunityMessage | null;
  onCancelReply?: () => void;
}

export function Composer({
  channelId,
  threadId = null,
  replyingTo = null,
  onCancelReply,
}: ComposerProps) {
  const sendMutation = useSendMessage();
  const sendTyping = useTypingSender();
  const { uploadMany, uploading } = useCommunityUpload();
  const onlineMembers = useOnlineMembers();

  const [text, setText] = useState("");
  const [attachments, setAttachments] = useState<PendingAttachment[]>([]);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [mentionOpen, setMentionOpen] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const voice = useVoiceRecorder();
  const recording = voice.recording;

  const canSend =
    text.trim().length > 0 || attachments.length > 0;
  const sending = sendMutation.isPending || uploading;

  // Auto-grow the textarea.
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [text]);

  const reset = useCallback(() => {
    setText("");
    setAttachments([]);
    setMentionOpen(false);
    setEmojiOpen(false);
    onCancelReply?.();
  }, [onCancelReply]);

  const handleSend = useCallback(async () => {
    if (sending) return;

    // Sending while recording → finalize the voice note and ship it.
    if (recording) {
      const result = await voice.stop();
      if (!result) return;
      const file = new File([result.blob], "voice.webm", {
        type: result.blob.type || "audio/webm",
      });
      const assets = await uploadMany([file]);
      const asset = assets[0];
      if (!asset) return;
      sendMutation.mutate(
        {
          channelId,
          payload: {
            body: ".",
            content_type: "voice",
            thread_id: threadId,
            reply_to_message_id: replyingTo?.id ?? null,
            attachments: [
              {
                type: "voice",
                file_name: "voice.webm",
                mime_type: asset.mime_type,
                size_bytes: asset.size_bytes,
                duration_seconds: result.durationSeconds,
                url: asset.cdn_url,
              },
            ],
            client_message_id: `msg-${Date.now()}`,
          },
        },
        { onSuccess: () => reset() },
      );
      return;
    }

    const payloadAttachments = attachments
      .filter((a) => !a.uploading && a.url)
      .map((a) => ({
        type: a.type,
        file_name: a.fileName,
        mime_type: a.mime,
        size_bytes: a.size,
        duration_seconds: a.duration ?? null,
        url: a.url,
      }));

    const textContent = text.trim();
    if (!textContent && payloadAttachments.length === 0) return;

    const content_type: CommunityMessageContentType = inferContentType(
      textContent,
      payloadAttachments,
    );

    sendMutation.mutate(
      {
        channelId,
        payload: {
          body: textContent || ".",
          content_type,
          thread_id: threadId,
          reply_to_message_id: replyingTo?.id ?? null,
          attachments: payloadAttachments,
          client_message_id: `msg-${Date.now()}`,
        },
      },
      { onSuccess: () => reset() },
    );
  }, [
    sending,
    recording,
    voice,
    uploadMany,
    attachments,
    text,
    sendMutation,
    channelId,
    threadId,
    replyingTo,
    reset,
  ]);

  const addPendingFiles = (
    files: File[],
    forcedType?: CommunityMessageContentType,
    duration?: number,
  ) => {
    if (files.length === 0) return;
    const next: PendingAttachment[] = files.map((file, i) => {
      const type = forcedType ?? contentTypeOf(file);
      return {
        key: `${Date.now()}-${i}`,
        file,
        url: forcedType ? URL.createObjectURL(file) : "",
        fileName: file.name,
        size: file.size,
        type,
        mime: file.type,
        duration,
        uploading: true,
      };
    });
    setAttachments((prev) => [...prev, ...next]);
    void uploadFiles(next.map((a) => a.file!)).then((assets) => {
      const assetByFile = new Map(assets.map((a) => [a.original_filename, a]));
      setAttachments((prev) =>
        prev.map((a) => {
          const asset = assetByFile.get(a.file?.name ?? "");
          if (!asset) return a;
          return { ...a, url: asset.cdn_url, uploading: false };
        }),
      );
      if (assets.length > 0) {
        toast.success("تم رفع المرفقات");
      }
    });
  };

  const uploadFiles = async (files: File[]): Promise<UploadedAsset[]> => {
    try {
      return await uploadMany(files);
    } catch {
      return [];
    }
  };

  // Drop / paste handling.
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    addPendingFiles(files);
  };

  const onPaste = (e: React.ClipboardEvent) => {
    const items = Array.from(e.clipboardData?.items ?? []);
    const imageFiles = items
      .filter((item) => item.type.startsWith("image/"))
      .map((item) => item.getAsFile())
      .filter((f): f is File => Boolean(f));
    if (imageFiles.length > 0) {
      e.preventDefault();
      addPendingFiles(imageFiles);
    }
  };

  const onInputChange = (value: string) => {
    setText(value);
    if (value.trim()) {
      sendTyping(channelId, threadId);
    }
    if (value.endsWith("@")) {
      setMentionOpen(true);
    }
  };

  const pickMention = (name: string) => {
    setText((prev) => {
      const base = prev.replace(/@[^ ]*$/, "").replace(/\s+$/, "");
      return `${base} @${name} `;
    });
    setMentionOpen(false);
    textareaRef.current?.focus();
  };

  const removeAttachment = (key: string) =>
    setAttachments((prev) => prev.filter((a) => a.key !== key));

  return (
    <div
      className={cn("border-t bg-card/80 backdrop-blur", dragOver && "ring-2 ring-primary")}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={onDrop}
    >
      {dragOver && (
        <div className="mx-3 mt-2 rounded-lg border-2 border-dashed border-primary/50 bg-primary/5 p-3 text-center text-xs font-semibold text-primary">
          أفلت الملفات هنا لإرفاقها
        </div>
      )}

      {/* Reply banner */}
      {replyingTo && (
        <div className="flex items-center gap-2 border-b px-4 py-2">
          <div className="min-w-0 flex-1 truncate rounded-lg border-s-2 border-primary/50 bg-muted/60 px-3 py-1.5 text-xs">
            <span className="font-bold text-primary">رد على {replyingTo.author?.name ?? "رسالة"}: </span>
            <span className="text-muted-foreground">
              {replyingTo.body_text ?? replyingTo.body}
            </span>
          </div>
          <button
            type="button"
            onClick={onCancelReply}
            className="flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
            aria-label="إلغاء الرد"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Pending attachments */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 px-4 pt-2">
          {attachments.map((a) => (
            <div
              key={a.key}
              className="relative flex max-w-[200px] items-center gap-2 rounded-lg border bg-muted/40 px-2 py-1.5 text-xs"
            >
              {a.type === "image" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={a.url} alt="" className="h-8 w-8 rounded object-cover" />
              ) : (
                <Paperclip className="h-4 w-4 shrink-0 text-muted-foreground" />
              )}
              <span className="min-w-0">
                <span className="block max-w-[120px] truncate font-semibold">{a.fileName}</span>
                <span className="block text-[10px] text-muted-foreground">
                  {a.type === "voice" && a.duration ? formatDuration(a.duration) : formatFileSize(a.size)}
                </span>
              </span>
              {!a.uploading && (
                <button
                  type="button"
                  onClick={() => removeAttachment(a.key)}
                  className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  aria-label="إزالة"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Toolbar + input */}
      <div className="relative flex items-end gap-1 p-2.5">
        {/* Mention popover */}
        {mentionOpen && (
          <div className="absolute bottom-full start-3 z-30 mb-1 max-h-56 w-64 overflow-y-auto rounded-xl border bg-popover p-1 shadow-lg">
            <div className="px-2 py-1 text-[10px] font-bold uppercase text-muted-foreground">
              الأعضاء المتصلون
            </div>
            {(onlineMembers.data ?? []).slice(0, 8).map((member) => (
              <button
                key={member.id ?? member.name}
                type="button"
                onClick={() => pickMention(member.name ?? "عضو")}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-start text-sm hover:bg-accent"
              >
                <MemberAvatar name={member.name} avatar={member.avatar} size="xs" />
                <span className="truncate font-medium">{member.name ?? "عضو"}</span>
              </button>
            ))}
          </div>
        )}

        {/* Emoji popover */}
        {emojiOpen && (
          <div className="absolute bottom-full start-3 z-30 mb-1" dir="ltr">
            <div className="relative z-40">
              <EmojiPicker
                onSelect={(emoji: string) => {
                  setText((prev) => prev + emoji);
                  textareaRef.current?.focus();
                }}
                onClose={() => setEmojiOpen(false)}
              />
            </div>
          </div>
        )}

        <ToolbarButton
          label="ملفات"
          onClick={() => fileInputRef.current?.click()}
          disabled={recording || uploading}
        >
          <Paperclip className="h-5 w-5" />
        </ToolbarButton>

        <ToolbarButton
          label="إيموجي"
          onClick={() => {
            setEmojiOpen((v) => !v);
            setMentionOpen(false);
          }}
        >
          <Smile className="h-5 w-5" />
        </ToolbarButton>

        <ToolbarButton
          label="إشارة لعضو"
          onClick={() => {
            setMentionOpen((v) => !v);
            setEmojiOpen(false);
          }}
        >
          <AtSign className="h-5 w-5" />
        </ToolbarButton>

        {recording ? (
          <div className="mx-1 flex flex-1 items-center gap-2 rounded-xl bg-destructive/10 px-3 py-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-destructive" />
            </span>
            <span className="text-xs font-bold text-destructive">تسجيل… {formatDuration(voice.elapsed)}</span>
            <div className="flex-1" />
            <button
              type="button"
              onClick={async () => {
                const result = await voice.stop();
                if (result) {
                  const file = new File([result.blob], "voice.webm", {
                    type: result.blob.type || "audio/webm",
                  });
                  addPendingFiles([file], "voice", result.durationSeconds);
                }
              }}
              className="flex items-center gap-1 rounded-lg bg-destructive px-2.5 py-1 text-xs font-bold text-destructive-foreground"
            >
              <Square className="h-3 w-3" />
              إنهاء
            </button>
            <button
              type="button"
              onClick={voice.cancel}
              className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-destructive/20"
              aria-label="إلغاء التسجيل"
            >
              <Trash2 className="h-3.5 w-3.5 text-destructive" />
            </button>
          </div>
        ) : (
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void handleSend();
              }
            }}
            onPaste={onPaste}
            placeholder={
              threadId
                ? "اكتب رداً في النقاش…"
                : "اكتب رسالتك هنا، أو أفلت صورة / ملف…"
            }
            dir="auto"
            rows={1}
            className="mx-1 min-h-10 flex-1 resize-none rounded-2xl border border-input bg-background px-3 py-2.5 text-sm outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
          />
        )}

        {!recording && (
          <ToolbarButton
            label={recording ? "" : "تسجيل صوتي"}
            onClick={() => void voice.start()}
            disabled={uploading || sending}
          >
            <Mic className="h-5 w-5" />
          </ToolbarButton>
        )}

        <button
          type="button"
          onClick={() => void handleSend()}
          disabled={!canSend || sending}
          aria-label="إرسال"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md shadow-primary/25 transition-all hover:brightness-110 active:scale-95 disabled:pointer-events-none disabled:opacity-40"
        >
          <Send className="h-5 w-5" />
        </button>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          hidden
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.zip"
          onChange={(e) => {
            const files = Array.from(e.target.files ?? []);
            addPendingFiles(files);
            e.target.value = "";
          }}
        />
      </div>

      <div className="flex items-center justify-between px-4 pb-1.5 text-[10px] text-muted-foreground">
        <span>Enter للإرسال · Shift+Enter لسطر جديد</span>
        <span className="hidden sm:inline">
          يدعم Markdown <span className="font-mono">`كود`</span> ومعادلات{" "}
          <span className="font-mono">$$KaTeX$$</span>
        </span>
      </div>
    </div>
  );
}

function ToolbarButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className="flex h-10 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary disabled:pointer-events-none disabled:opacity-40"
    >
      {children}
    </button>
  );
}

function contentTypeOf(file: File): CommunityMessageContentType {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("video/")) return "video";
  if (file.type.startsWith("audio/")) return "voice";
  const ext = fileExtensionOf(file.name);
  if (ext === "pdf") return "pdf";
  return "file";
}

function inferContentType(
  text: string,
  attachments: Array<{ type: CommunityMessageContentType }>,
): CommunityMessageContentType {
  if (text.includes("```")) return "code";
  if (/^\s*\$.*\$\s*$/.test(text) || text.includes("$$")) return "math";
  const first = attachments[0]?.type;
  if (first && (first === "image" || first === "file" || first === "pdf" || first === "voice" || first === "video")) {
    return first;
  }
  return "text";
}
