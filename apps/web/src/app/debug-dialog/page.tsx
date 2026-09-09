"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ExamSubmitDialog } from "@/features/exam-session/components/ExamSubmitDialog";
import { ImageAnswerCapture } from "@/features/exam-session/image-cap/components/ImageAnswerCapture";

export default function DebugDialogPage() {
  const [submitOpen, setSubmitOpen] = useState(false);
  const [now, setNow] = useState(0);
  const tickerRef = useRef(true);

  useEffect(() => {
    if (!tickerRef.current) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6">
      <div className="mb-4 flex items-center gap-3">
        <span className="text-xs text-muted-foreground">tick: {now}</span>
        <button
          type="button"
          onClick={() => setSubmitOpen(true)}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white"
        >
          تسليم الامتحان (افتح الديالوج)
        </button>
      </div>

      <AnimatePresence mode="popLayout">
        <motion.div
          key={0}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="rounded-3xl border border-border/40 bg-card/60 p-5">
            <h2 className="text-lg font-bold">سؤال مقالي تجريبي</h2>
            <ImageAnswerCapture attemptId="debug-0000" examQuestionId="debug-q-1" />
          </div>
        </motion.div>
      </AnimatePresence>

      <ExamSubmitDialog
        open={submitOpen}
        onOpenChange={setSubmitOpen}
        answeredCount={0}
        total={1}
        isOfficial={false}
        submitting={false}
        onConfirm={() => setSubmitOpen(false)}
      />
    </div>
  );
}