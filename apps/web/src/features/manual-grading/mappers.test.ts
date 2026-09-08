import { describe, expect, it } from "vitest";
import { formatDateTime, mapGradeResult, mapGradingAnswer, mapQueueItem, parseScoreInput } from "./mappers";

describe("parseScoreInput", () => {
  it("accepts a score inside the allowed range", () => {
    expect(parseScoreInput("4", 4)).toEqual({ ok: true, value: 4 });
  });

  it("rejects an empty input so a grade can never be silently cleared", () => {
    expect(parseScoreInput("", 4)).toEqual({ ok: false, error: "يرجى إدخال الدرجة." });
    expect(parseScoreInput("   ", 4)).toEqual({ ok: false, error: "يرجى إدخال الدرجة." });
  });

  it("rejects negative and over-max scores, mirroring StoreManualGradeRequest", () => {
    expect(parseScoreInput("-1", 4).ok).toBe(false);
    expect(parseScoreInput("5", 4)).toEqual({ ok: false, error: "الدرجة لا تتجاوز 4 نقطة." });
  });
});

describe("mapQueueItem", () => {
  it("coerces ids to strings and keeps status/page count", () => {
    const item = mapQueueItem({
      id: 77,
      examAttemptId: 11,
      examQuestionId: 33,
      questionId: 9,
      gradingStatus: "partially_graded",
      answerMode: "image_pages",
      points: "3",
      pageCount: null,
      student: null,
      answeredAt: null,
      scoreUrl: "/media/x",
    });

    expect(item.id).toBe("77");
    expect(item.examAttemptId).toBe("11");
    expect(item.gradingStatus).toBe("partially_graded");
    expect(item.points).toBe(3);
    expect(item.pageCount).toBeNull();
    expect(item.student).toBeNull();
  });

  it("maps a nested student object", () => {
    const item = mapQueueItem({
      id: 1,
      examAttemptId: 2,
      examQuestionId: 3,
      questionId: 4,
      gradingStatus: "pending_manual_review",
      answerMode: "image_pages",
      points: 10,
      student: { id: 5, name: "أحمد" },
      answeredAt: "2026-01-02T03:04:05.000000Z",
      scoreUrl: "",
    });

    expect(item.student).toEqual({ id: "5", name: "أحمد" });
  });
});

describe("mapGradingAnswer", () => {
  const raw = {
    attemptId: 1,
    examQuestionId: 2,
    answerId: 3,
    answerMode: "image_pages",
    gradingStatus: "graded",
    manualScore: 7,
    feedback: "إجابة جيدة",
    gradedBy: { id: 42, name: "المعلم" },
    gradedAt: "2026-01-02T03:04:05.000000Z",
    pages: [
      { id: 10, pageOrder: 1, capturedAt: "2026-01-01T00:00:00Z", width: 100, height: 200, mimeType: "image/jpeg", url: "/media/p1" },
      { id: 11, pageOrder: 2, capturedAt: null, width: null, height: null, mimeType: null, url: "/media/p2" },
    ],
  };

  it("carries grading fields so regrade can prefill the form", () => {
    const mapped = mapGradingAnswer(raw);

    expect(mapped.gradingStatus).toBe("graded");
    expect(mapped.manualScore).toBe(7);
    expect(mapped.feedback).toBe("إجابة جيدة");
    expect(mapped.gradedBy).toEqual({ id: "42", name: "المعلم" });
    expect(mapped.gradedAt).toBe("2026-01-02T03:04:05.000000Z");
    expect(mapped.pages).toHaveLength(2);
    const second = mapped.pages[1];
    expect(second?.pageOrder).toBe(2);
    expect(second?.width).toBeNull();
  });

  it("defaults to null grading fields on an unanswered review", () => {
    const mapped = mapGradingAnswer({
      attemptId: 1,
      examQuestionId: 2,
      answerId: 3,
      answerMode: "image_pages",
      gradingStatus: "pending_manual_review",
      pages: [],
    });

    expect(mapped.manualScore).toBeNull();
    expect(mapped.feedback).toBeNull();
    expect(mapped.gradedBy).toBeNull();
    expect(mapped.gradedAt).toBeNull();
  });
});

describe("mapGradeResult", () => {
  it("maps the nested answer plus the recalculated attempt", () => {
    const result = mapGradeResult({
      answer: {
        id: 3,
        gradingStatus: "graded",
        manualScore: 6,
        feedback: null,
        gradedBy: null,
        gradedAt: null,
      },
      attempt: { score: 80, maxScore: 100, percentage: 80, passed: true },
    });

    expect(result.answerId).toBe("3");
    expect(result.manualScore).toBe(6);
    expect(result.feedback).toBeNull();
    expect(result.attempt.percentage).toBe(80);
    expect(result.attempt.passed).toBe(true);
  });

  it("tolerates a detached payload shape", () => {
    const result = mapGradeResult({});
    expect(result.answerId).toBe("");
    expect(result.manualScore).toBeNull();
    expect(result.attempt.percentage).toBeNull();
    expect(result.attempt.passed).toBe(false);
  });
});

describe("formatDateTime", () => {
  it("returns a dash for missing or invalid dates", () => {
    expect(formatDateTime(null)).toBe("—");
    expect(formatDateTime("not-a-date")).toBe("—");
  });

  it("formats a valid ISO date in Arabic", () => {
    expect(formatDateTime("2026-01-02T03:04:05.000000Z")).toMatch(/2026/);
  });
});