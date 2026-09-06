import { z } from "zod";

export const examFormSchema = z.object({
  title: z.string().min(1, "العنوان مطلوب").max(255),
  slug: z.string().max(255).optional(),
  description: z.string().optional(),
  category: z.string().max(120).optional(),
  visibility: z.enum(["private", "organization", "public"]).default("private"),
  language: z.string().max(10).default("ar"),
  duration: z.number().int().min(0).nullable().optional(),
  passingScore: z.number().int().min(0).max(100).default(60),
  attemptLimit: z.number().int().min(1).nullable().optional(),
  shuffleQuestions: z.boolean().default(false),
  shuffleChoices: z.boolean().default(false),
  showResults: z.boolean().default(true),
  showCorrectAnswers: z.boolean().default(true),
  allowReview: z.boolean().default(true),
  negativeMarking: z.boolean().default(false),
  certificateEligible: z.boolean().default(false),
  randomQuestionPool: z.record(z.unknown()).optional(),
  pinned: z.boolean().default(false),
  featured: z.boolean().default(false),
});

export type ExamFormValues = z.infer<typeof examFormSchema>;

export const questionFormSchema = z.object({
  title: z.string().min(1, "العنوان مطلوب").max(500),
  slug: z.string().max(500).optional(),
  description: z.string().optional(),
  type: z.enum([
    "single_choice",
    "multiple_choice",
    "true_false",
    "short_answer",
    "essay",
    "fill_blank",
    "matching",
    "ordering",
    "numeric",
    "file_upload",
    "coding",
  ]),
  difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
  categoryId: z.number().int().positive().nullable().optional(),
  bankId: z.number().int().positive().nullable().optional(),
  tags: z.array(z.string().max(64)).default([]),
  points: z.number().int().min(0).default(1),
  estimatedTime: z.number().int().min(0).nullable().optional(),
  language: z.string().max(10).default("ar"),
  visibility: z.enum(["private", "organization", "public"]).default("private"),
  shuffleOptions: z.boolean().default(true),
  explanation: z.string().optional(),
  hint: z.string().optional(),
  content: z.record(z.unknown()).default({}),
});

export type QuestionFormValues = z.infer<typeof questionFormSchema>;

export const categoryFormSchema = z.object({
  name: z.string().min(1, "الاسم مطلوب").max(255),
  slug: z.string().max(255).optional(),
  description: z.string().optional(),
  color: z.string().max(32).optional(),
  icon: z.string().max(64).optional(),
  parentId: z.number().int().positive().nullable().optional(),
  sortOrder: z.number().int().min(0).default(0),
  status: z.enum(["active", "inactive", "archived"]).default("active"),
});

export type CategoryFormValues = z.infer<typeof categoryFormSchema>;

export const bankFormSchema = z.object({
  name: z.string().min(1, "الاسم مطلوب").max(255),
  slug: z.string().max(255).optional(),
  description: z.string().optional(),
  categoryId: z.number().int().positive().nullable().optional(),
  visibility: z.enum(["private", "organization", "public"]).default("private"),
});

export type BankFormValues = z.infer<typeof bankFormSchema>;
