"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/cn";

export const QUICK_EMOJIS = ["👍", "❤️", "😂", "👏", "🔥", "🎯", "👀"];

const EMOJI_SET: Array<[string, string]> = [
  ["thumbs up", "👍"], ["thumbs down", "👎"], ["heart", "❤️"], ["smile", "😄"],
  ["laugh", "😂"], ["joy", "🤣"], ["wink", "😉"], ["blush", "😊"],
  ["thinking", "🤔"], ["surprised", "😮"], ["cool", "😎"], ["love", "😍"],
  ["cry", "😢"], ["angry", "😡"], ["wow", "😲"], ["sad", "😞"],
  ["party", "🥳"], ["fire", "🔥"], ["clap", "👏"], ["ok", "👌"],
  ["pray", "🙏"], ["fist", "👊"], ["wave", "👋"], ["muscle", "💪"],
  ["handshake", "🤝"], ["star", "⭐"], ["sparkles", "✨"], ["boom", "💥"],
  ["rocket", "🚀"], ["trophy", "🏆"], ["medal", "🏅"], ["crown", "👑"],
  ["gem", "💎"], ["money", "💰"], ["book", "📚"], ["pen", "✏️"],
  ["phone", "📱"], ["computer", "💻"], ["bulb", "💡"], ["gear", "⚙️"],
  ["lightning", "⚡"], ["drop", "💧"], ["tree", "🌳"], ["flower", "🌸"],
  ["sun", "☀️"], ["moon", "🌙"], ["cloud", "☁️"], ["rainbow", "🌈"],
  ["check", "✅"], ["cross", "❌"], ["exclamation", "❗"], ["question", "❓"],
  ["info", "ℹ️"], ["pin", "📌"], ["paperclip", "📎"], ["envelope", "📧"],
  ["bell", "🔔"], ["calendar", "📅"], ["clock", "⏰"], ["home", "🏠"],
  ["heart_eyes", "😍"], ["sleepy", "😴"], ["sick", "🤒"], ["nervous", "😰"],
  ["sweat", "😅"], ["sunglasses", "😎"], ["robot", "🤖"], ["alien", "👽"],
  ["ghost", "👻"], ["poop", "💩"], ["eyes", "👀"], ["ear", "👂"],
  ["dog", "🐶"], ["cat", "🐱"], ["lion", "🦁"], ["fox", "🦊"],
  ["bear", "🐻"], ["panda", "🐼"], ["frog", "🐸"], ["penguin", "🐧"],
  ["eagle", "🦅"], ["owl", "🦉"], ["shark", "🦈"], ["whale", "🐳"],
  ["camel", "🐫"], ["horse", "🐴"], ["cake", "🍰"], ["pizza", "🍕"],
  ["burger", "🍔"], ["coffee", "☕"], ["tea", "🍵"], ["apple", "🍎"],
  ["orange", "🍊"], ["grapes", "🍇"], ["watermelon", "🍉"], ["lemon", "🍋"],
  ["soccer", "⚽"], ["basketball", "🏀"], ["tennis", "🎾"], ["game", "🎮"],
  ["dice", "🎲"], ["sport", "🏆"], ["music", "🎵"], ["mic", "🎤"],
  ["video", "🎬"], ["camera", "📷"], ["art", "🎨"], ["palette", "🎨"],
  ["flag", "🚩"], ["target", "🎯"], ["dart", "🎯"], ["gift", "🎁"],
  ["balloon", "🎈"], ["confetti", "🎉"], ["cigarette", "🚭"], ["warning", "⚠️"],
];

/** Lightweight emoji grid used for reactions and composer input. */
export function EmojiPicker({
  onSelect,
  onClose,
  className,
}: {
  onSelect: (emoji: string) => void;
  onClose: () => void;
  className?: string;
}) {
  const [query, setQuery] = useState("");

  const emojis = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return EMOJI_SET;
    return EMOJI_SET.filter(([name]) => name.includes(q));
  }, [query]);

  return (
    <>
      <div className="fixed inset-0 z-30" onClick={onClose} />
      <div
        dir="ltr"
        className={cn(
          "absolute z-40 w-72 rounded-2xl border border-border bg-popover p-2 shadow-lg",
          className,
        )}
      >
        <div className="relative mb-2">
          <Search className="absolute start-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="بحث"
            className="w-full rounded-lg border border-border bg-background py-1.5 pe-2 ps-8 text-sm outline-none placeholder:text-muted-foreground focus:border-primary"
          />
        </div>
        <div className="grid max-h-52 grid-cols-8 gap-0.5 overflow-y-auto">
          {emojis.map(([name, emoji]) => (
            <button
              key={emoji}
              type="button"
              title={name}
              onClick={() => {
                onSelect(emoji);
                onClose();
              }}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-xl transition-colors hover:bg-muted"
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
