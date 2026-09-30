import type { TeacherDashboardData } from "@/features/dashboard/types";

function csvCell(value: string | number): string {
  const text = String(value ?? "");
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function buildRows(data: TeacherDashboardData): Array<Array<string | number>> {
  const { summary, trends, breakdowns, filters } = data;
  const rows: Array<Array<string | number>> = [];

  rows.push([
    "ملخص الأداء",
    filters.from ?? "بداية الفترة",
    filters.to ?? "نهاية الفترة",
    filters.bucket_label,
  ]);

  rows.push(["المؤشر", "القيمة (الفترة)", "الفترة السابقة", "التغير %", "الكل"]);

  const s = [
    ["طلاب جدد", summary.students.new_period, summary.students.previous_period, summary.students.change_percent, summary.students.total],
    ["الإيرادات", summary.revenue.period, summary.revenue.previous_period, summary.revenue.change_percent, summary.revenue.total],
    ["تسجيلات جديدة", summary.enrollments.new_period, summary.enrollments.previous_period, summary.enrollments.change_percent, summary.enrollments.total],
    ["محاولات الامتحانات", summary.exams.attempts_period, summary.exams.previous_period, summary.exams.change_percent, summary.exams.attempts_total],
    ["نسبة النجاح %", summary.exams.pass_rate_period, "", "", summary.exams.pass_rate_total],
    ["متوسط الدرجات %", summary.exams.avg_score_period, "", "", ""],
    ["شهادات صادرة", summary.certificates.issued_period, summary.certificates.previous_period, summary.certificates.change_percent, summary.certificates.total],
    ["دورات مكتملة", summary.completions.period, summary.completions.previous_period, summary.completions.change_percent, summary.completions.total],
    ["متوسط الإتمام %", summary.completions.rate, "", "", ""],
    ["معاملات الإيرادات", summary.revenue.transactions_period, "", "", summary.revenue.transactions_total],
  ];
  rows.push(...s);
  rows.push([]);

  rows.push(["حصة كل فترة — الإيرادات", ...trends.revenue.map((p) => `${p.label}: ${p.value}`)]);
  rows.push(["حصة كل فترة — الطلاب الجدد", ...trends.students_new.map((p) => `${p.label}: ${p.value}`)]);
  rows.push(["حصة كل فترة — التسجيلات", ...trends.enrollments.map((p) => `${p.label}: ${p.value}`)]);
  rows.push(["حصة كل فترة — محاولات الامتحانات", ...trends.exam_attempts.map((p) => `${p.label}: ${p.value}`)]);
  rows.push([]);

  rows.push(["أفضل الدورات أداءً"]);
  rows.push(["الدورة", "طلاب الفترة", "طلاب الكل", "إتمام الفترة", "نسبة الإتمام %", "إيراد الفترة", "إيراد الكل"]);
  for (const course of breakdowns.top_courses) {
    rows.push([
      course.title,
      course.students_period,
      course.students_total,
      course.completions_period,
      course.completion_rate,
      course.revenue_period,
      course.revenue_total,
    ]);
  }
  rows.push([]);

  rows.push(["أداء الامتحانات"]);
  rows.push(["الامتحان", "محاولات الفترة", "محاولات الكل", "نجح بالفترة", "نسبة النجاح %", "متوسط الدرجة %", "آخر محاولة"]);
  for (const exam of breakdowns.exam_performance) {
    rows.push([
      exam.title,
      exam.attempts_period,
      exam.attempts_total,
      exam.passed_period,
      exam.pass_rate_period,
      exam.avg_score_period,
      exam.last_attempted_at ?? "",
    ]);
  }

  return rows;
}

export function exportTeacherDashboardCsv(data: TeacherDashboardData): void {
  const rows = buildRows(data);
  const csv = rows.map((row) => row.map(csvCell).join(",")).join("\n");
  const blob = new Blob([`\uFEFF${csv}`], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `teacher-dashboard-${data.filters.period}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export { buildRows };