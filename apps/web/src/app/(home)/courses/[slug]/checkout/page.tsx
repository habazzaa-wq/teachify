import { notFound } from "next/navigation";
import { publicCourseServerService } from "@/features/public-course/server-services";
import { CoursePaymentPage } from "@/features/public-course/components/CoursePaymentPage";

interface CourseCheckoutPageProps {
  params: Promise<{ slug: string }>;
}

export default async function CourseCheckoutPage({ params }: CourseCheckoutPageProps) {
  const { slug } = await params;
  const course = await publicCourseServerService.getBySlug(slug);

  if (!course) notFound();

  return <CoursePaymentPage slug={slug} initialCourse={course} />;
}
