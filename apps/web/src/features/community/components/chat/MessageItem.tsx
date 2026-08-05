"use client";

import { memo, useState } from "react";
import {
  BadgeCheck,
  Bookmark,
  Check,
  CheckCheck,
  Copy,
  Edit,
  Flag,
  MessageSquareReply,
  MoreHorizontal,
  Pin,
  PinOff,
  Send,
  Share2,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { toast } from "@/lib/toast";
import {
  AppDropdownMenu,
  AppDropdownMenuContent,
  AppDropdownMenuItem,
  AppDropdownMenuLabel,
  AppDropdownMenuSeparator,
  AppDropdownMenuTrigger,
} from "@/components/ui/AppDropdown";
import { AppConfirmDialog } from "@/components/ui/AppConfirmDialog";
import { formatClock, formatTooltip } from "../../utils/time";
import { useCurrentMember } from "../../hooks/useCurrentMember";
import { useMessageActions } from "./MessageActionsContext";
import { MessageContent } from "./MessageContent";
import { AttachmentGrid } from "./AttachmentView";
import { ReactionBar } from "./Reactions";
import { QUICK_EMOJIS } from "./EmojiPicker";
import { MemberAvatar, RoleBadge } from "../atoms";
import type { CommunityMessage } from "../../types";

interface MessageItemProps {
  message: CommunityMessage;
  resolveMessage: (id: string | null) => CommunityMessage | null;
  onReply: (message: CommunityMessage) => void;
  onOpenThread: (message: CommunityMessage) => void;
  compact?: boolean;
}

/** A single chat bubble with hover actions, reactions and moderation. */
export const MessageItem = memo(function MessageItem({
  message,
  resolveMessage,
  onReply,
  onOpenThread,
  compact = false,
}: MessageItemProps) {
  const { memberId, canModerate } = useCurrentMember();
  const actions = useMessageActions();
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const isOwn = message.author?.id === memberId;
  const isSending = message.status === "sending";
  const bookmarked = Boolean(message.metadata?.bookmarked);
  const replied = resolveMessage(message.reply_to_message_id);

  const toggleFlag = (
    fn: { mutate: (v: { messageId: string; value: boolean }) => void },
    value: boolean,
  ) => fn.mutate({ messageId: message.id, value: !value });

  const copyMessage = async () => {
    try {
      await navigator.clipboard.writeText(message.body_text ?? message.body);
      toast.success("تم نسخ الرسالة");
    } catch {
      toast.error("تعذّر النسخ");
    }
  };

  const shareMessage = async () => {
    const text = message.body_text ?? message.body;
    if (navigator.share) {
      try {
        await navigator.share({ text });
        return;
      } catch {
        // cancelled
      }
    }
    await copyMessage();
  };

  return (
    <div
      className={cn(
        "group relative flex gap-3 px-4 py-2 transition-colors hover:bg-accent/30",
        isSending && "opacity-70",
      )}
    >
      <MemberAvatar
        name={message.author?.name}
        avatar={message.avatar ?? message.author?.avatar}
        size={compact ? "sm" : "md"}
        className="mt-1"
      />

      <div className="min-w-0 flex-1">
        {/* Flags */}
        {(message.pinned || message.announcement || message.solved || message.official_answer || message.accepted_answer || message.highlighted) && (
          <div className="mb-1 flex flex-wrap gap-1">
            {message.announcement && <FlagBadge label="إعلان" className="bg-amber-500/10 text-amber-600 ring-amber-500/25" />}
            {message.pinned && <FlagBadge label="مثبتة" icon={<Pin className="h-3 w-3" />} className="bg-primary/10 text-primary ring-primary/25" />}
            {message.official_answer && <FlagBadge label="إجابة رسمية" icon={<BadgeCheck className="h-3 w-3" />} className="bg-sky-500/10 text-sky-600 ring-sky-500/25" />}
            {message.accepted_answer && <FlagBadge label="إجابة مقبولة" icon={<Check className="h-3 w-3" />} className="bg-emerald-500/10 text-emerald-600 ring-emerald-500/25" />}
            {message.solved && <FlagBadge label="تم الحل" icon={<CheckCheck className="h-3 w-3" />} className="bg-violet-500/10 text-violet-600 ring-violet-500/25" />}
            {message.highlighted && <FlagBadge label="مميزة" icon={<Sparkles className="h-3 w-3" />} className="bg-fuchsia-500/10 text-fuchsia-600 ring-fuchsia-500/25" />}
          </div>
        )}

        {/* Author row */}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <span className="text-sm font-bold text-foreground">
            {message.author?.name ?? "عضو"}
          </span>
          <RoleBadge role={message.author?.role ?? message.role} />
          <span
            className="text-[10px] text-muted-foreground"
            title={formatTooltip(message.created_at)}
          >
            {formatClock(message.created_at)}
          </span>
          {message.edited && (
            <span className="text-[10px] italic text-muted-foreground/70">(معدّلة)</span>
          )}
          {isSending && <span className="text-[10px] text-muted-foreground">جارٍ الإرسال…</span>}
        </div>

        {/* Reply-to quote */}
        {replied && (
          <button
            type="button"
            onClick={() => {
              // Scroll handling is delegated to the virtualized list via onOpenThread-less jump:
              document
                .getElementById(`community-message-${replied.id}`)
                ?.scrollIntoView({ behavior: "smooth", block: "center" });
            }}
            className="mb-1 flex max-w-md items-start gap-2 rounded-lg border-s-2 border-primary/50 bg-muted/50 px-2.5 py-1.5 text-start"
          >
            <MessageSquareReply className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <span className="min-w-0">
              <span className="block text-[11px] font-bold text-primary">
                رد على {replied.author?.name ?? "رسالة"}
              </span>
              <span className="line-clamp-1 block text-xs text-muted-foreground">
                {replied.body_text ?? replied.body}
              </span>
            </span>
          </button>
        )}

        {/* Body */}
        {editing ? (
          <EditBox
            initial={message.body}
            onCancel={() => setEditing(false)}
            onSave={(body) => {
              actions.editMessage.mutate(
                { messageId: message.id, body, content_type: message.content_type },
                { onSuccess: () => setEditing(false) },
              );
            }}
          />
        ) : (
          <MessageContent body={message.body} content_type={message.content_type} />
        )}

        <AttachmentGrid attachments={message.attachments} />

        <ReactionBar message={message} />

        {/* Hover action row */}
        <div
          className={cn(
            "mt-1 flex items-center gap-0.5 opacity-100 lg:opacity-0 lg:transition-opacity lg:group-hover:opacity-100",
          )}
        >
          {QUICK_EMOJIS.slice(0, 4).map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => actions.toggleReaction.mutate({ messageId: message.id, emoji })}
              className="rounded-md px-1 py-0.5 text-sm transition-transform hover:scale-125"
            >
              {emoji}
            </button>
          ))}

          <ActionIconButton label="رد" onClick={() => onReply(message)}>
            <MessageSquareReply className="h-3.5 w-3.5" />
          </ActionIconButton>

          {(message.reply_count > 0 || message.thread_count > 0) && (
            <ActionIconButton
              label={`${message.reply_count} ردود`}
              onClick={() => onOpenThread(message)}
            >
              <MessageSquareReply className="h-3.5 w-3.5 text-primary" />
            </ActionIconButton>
          )}

          <ActionIconButton label="نسخ" onClick={copyMessage}>
            <Copy className="h-3.5 w-3.5" />
          </ActionIconButton>
          <ActionIconButton label="مشاركة" onClick={shareMessage}>
            <Share2 className="h-3.5 w-3.5" />
          </ActionIconButton>

          {!bookmarked && (
            <ActionIconButton
              label="مفضلة"
              onClick={() => actions.bookmark.mutate({ message, bookmark: true })}
            >
              <Bookmark className="h-3.5 w-3.5" />
            </ActionIconButton>
          )}

          <MoreMenu
            message={message}
            isOwn={isOwn}
            canModerate={canModerate}
            bookmarked={bookmarked}
            onToggleBookmark={() =>
              actions.bookmark.mutate({ message, bookmark: !bookmarked })
            }
            onEdit={() => setEditing(true)}
            onDelete={() => setConfirmDelete(true)}
            onTogglePin={() => toggleFlag(actions.pinMessage, message.pinned)}
            onToggleSolve={() => toggleFlag(actions.solveMessage, message.solved)}
            onToggleAccept={() => toggleFlag(actions.acceptMessage, message.accepted_answer)}
            onToggleOfficial={() => toggleFlag(actions.officialMessage, message.official_answer)}
            onToggleHighlight={() => toggleFlag(actions.highlightMessage, message.highlighted)}
            onReport={() => toast.info("تم إرسال البلاغ إلى المشرفين")}
          />
        </div>
      </div>

      {/* Id anchor for reply jump */}
      <span id={`community-message-${message.id}`} className="absolute" />

      <AppConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="حذف الرسالة"
        description="سيتم حذف الرسالة نهائياً ولا يمكن التراجع."
        confirmLabel="حذف"
        cancelLabel="إلغاء"
        destructive
        loading={actions.deleteMessage.isPending}
        onConfirm={() => {
          actions.deleteMessage.mutate(message);
          setConfirmDelete(false);
        }}
      />
    </div>
  );
});

function FlagBadge({
  label,
  icon,
  className,
}: {
  label: string;
  icon?: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-1.5 py-px text-[10px] font-bold ring-1 ring-inset",
        className,
      )}
    >
      {icon}
      {label}
    </span>
  );
}

function ActionIconButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      {children}
    </button>
  );
}

interface MoreMenuProps {
  message: CommunityMessage;
  isOwn: boolean;
  canModerate: boolean;
  bookmarked: boolean;
  onToggleBookmark: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onTogglePin: () => void;
  onToggleSolve: () => void;
  onToggleAccept: () => void;
  onToggleOfficial: () => void;
  onToggleHighlight: () => void;
  onReport: () => void;
}

function MoreMenu({
  message,
  isOwn,
  canModerate,
  bookmarked,
  onToggleBookmark,
  onEdit,
  onDelete,
  onTogglePin,
  onToggleSolve,
  onToggleAccept,
  onToggleOfficial,
  onToggleHighlight,
  onReport,
}: MoreMenuProps) {
  const moderating = canModerate;

  return (
    <AppDropdownMenu>
      <AppDropdownMenuTrigger asChild>
        <button
          type="button"
          title="المزيد"
          aria-label="المزيد"
          className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <MoreHorizontal className="h-3.5 w-3.5" />
        </button>
      </AppDropdownMenuTrigger>
      <AppDropdownMenuContent align="end" className="w-44">
        {isOwn && (
          <>
            <AppDropdownMenuItem onSelect={onEdit}>
              <Edit className="ms-0 me-2 h-4 w-4" />
              تعديل
            </AppDropdownMenuItem>
            <AppDropdownMenuItem
              className="text-destructive focus:text-destructive"
              onSelect={onDelete}
            >
              <Trash2 className="ms-0 me-2 h-4 w-4" />
              حذف
            </AppDropdownMenuItem>
            <AppDropdownMenuSeparator />
          </>
        )}

        <AppDropdownMenuItem onSelect={onToggleBookmark}>
          <Bookmark className="ms-0 me-2 h-4 w-4" />
          {bookmarked ? "إزالة من المفضلة" : "إضافة للمفضلة"}
        </AppDropdownMenuItem>

        {moderating && (
          <>
            <AppDropdownMenuSeparator />
            <AppDropdownMenuLabel className="px-2 py-1 text-[10px] uppercase text-muted-foreground">
              إشراف
            </AppDropdownMenuLabel>
            <AppDropdownMenuItem onSelect={onTogglePin}>
              {message.pinned ? <PinOff className="ms-0 me-2 h-4 w-4" /> : <Pin className="ms-0 me-2 h-4 w-4" />}
              {message.pinned ? "إلغاء التثبيت" : "تثبيت"}
            </AppDropdownMenuItem>
            <AppDropdownMenuItem onSelect={onToggleSolve}>
              <CheckCheck className="ms-0 me-2 h-4 w-4" />
              {message.solved ? "إلغاء الحل" : "تحديد كحل"}
            </AppDropdownMenuItem>
            <AppDropdownMenuItem onSelect={onToggleAccept}>
              <Check className="ms-0 me-2 h-4 w-4" />
              {message.accepted_answer ? "إلغاء القبول" : "إجابة مقبولة"}
            </AppDropdownMenuItem>
            <AppDropdownMenuItem onSelect={onToggleOfficial}>
              <BadgeCheck className="ms-0 me-2 h-4 w-4" />
              {message.official_answer ? "إزالة الرسمية" : "إجابة رسمية"}
            </AppDropdownMenuItem>
            <AppDropdownMenuItem onSelect={onToggleHighlight}>
              <Sparkles className="ms-0 me-2 h-4 w-4" />
              {message.highlighted ? "إزالة التمييز" : "تمييز الرسالة"}
            </AppDropdownMenuItem>
          </>
        )}

        {!isOwn && (
          <>
            <AppDropdownMenuSeparator />
            <AppDropdownMenuItem
              className="text-destructive focus:text-destructive"
              onSelect={onReport}
            >
              <Flag className="ms-0 me-2 h-4 w-4" />
              الإبلاغ
            </AppDropdownMenuItem>
          </>
        )}
      </AppDropdownMenuContent>
    </AppDropdownMenu>
  );
}

function EditBox({
  initial,
  onCancel,
  onSave,
}: {
  initial: string;
  onCancel: () => void;
  onSave: (body: string) => void;
}) {
  const [value, setValue] = useState(initial);
  return (
    <div className="flex flex-col gap-2">
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        autoFocus
        dir="auto"
        rows={3}
        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onSave(value)}
          disabled={!value.trim()}
          className="flex h-8 items-center gap-1 rounded-lg bg-primary px-3 text-xs font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          <Send className="h-3.5 w-3.5" />
          حفظ
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex h-8 items-center gap-1 rounded-lg px-3 text-xs font-semibold hover:bg-muted"
        >
          <X className="h-3.5 w-3.5" />
          إلغاء
        </button>
      </div>
    </div>
  );
}
