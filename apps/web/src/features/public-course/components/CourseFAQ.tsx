"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus } from "lucide-react";
import { cn } from "@/lib/cn";
import { COURSE_FAQS_DEFAULT } from "../constants";
import type { CourseFAQ } from "../types";

interface CourseFAQProps {
  faqs?: CourseFAQ[];
}

function FAQItem({
  question,
  answer,
  isOpen,
  onToggle,
}: {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border transition-colors duration-200",
        isOpen
          ? "border-primary/20 bg-primary/5"
          : "border-border/50 bg-card/60 hover:border-border",
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 p-4 text-start"
      >
        <span
          className={cn(
            "text-sm font-medium transition-colors",
            isOpen ? "text-foreground" : "text-muted-foreground",
          )}
        >
          {question}
        </span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
          className={cn(
            "flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors",
            isOpen
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground",
          )}
        >
          {isOpen ? (
            <Minus className="h-3.5 w-3.5" />
          ) : (
            <Plus className="h-3.5 w-3.5" />
          )}
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <div className="border-t border-border/40 px-4 pb-4 pt-3">
              <p className="text-sm leading-relaxed text-muted-foreground">
                {answer}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function CourseFAQ({ faqs }: CourseFAQProps) {
  const items = faqs && faqs.length > 0 ? faqs : COURSE_FAQS_DEFAULT;
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="mb-10"
    >
      <h2 className="section-title-accent mb-6 text-lg font-semibold tracking-tight">
        الأسئلة الشائعة
      </h2>

      <div className="space-y-3">
        {items.map((faq, index) => (
          <FAQItem
            key={index}
            question={faq.question}
            answer={faq.answer}
            isOpen={openIndex === index}
            onToggle={() =>
              setOpenIndex(openIndex === index ? null : index)
            }
          />
        ))}
      </div>
    </motion.section>
  );
}
