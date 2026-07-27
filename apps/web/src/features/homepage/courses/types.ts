export interface HomepageCourse {
  id: string;
  title: string;
  slug: string;
  subtitle: string | null;
  shortDescription: string | null;
  thumbnail: string | null;
  coverImage: string | null;
  difficulty: string;
  pricingType: string;
  price: number | null;
  discountPrice: number | null;
  currency: string | null;
  duration: number | null;
  certificateEnabled: boolean;
  featured: boolean;
  instructor: {
    id: string;
    name: string;
    avatar: string | null;
  } | null;
  category: {
    id: string;
    name: string;
    slug: string;
  } | null;
  studentsCount: number;
  lessonsCount: number;
  sectionsCount: number;
}

export interface PublicCoursesResponse {
  data: HomepageCourse[];
}
