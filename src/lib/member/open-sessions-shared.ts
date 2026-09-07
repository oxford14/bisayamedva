import { formatSessionWhenLabel } from "@/lib/datetime";

export type OpenFutureSessionCourse = {
  id: string;
  title: string;
  slug: string | null;
  price: number | null;
  currency: string | null;
  status: string | null;
};

export type OpenFutureSession = {
  id: string;
  title: string;
  starts_at: string;
  ends_at: string | null;
  timezone: string | null;
  format: string | null;
  meeting_url: string | null;
  status: string | null;
  course: OpenFutureSessionCourse;
};

export function courseCheckoutWithSession(slug: string, sessionId: string) {
  return `/member/checkout/${slug}?session=${encodeURIComponent(sessionId)}`;
}

export function formatOpenSessionWhen(session: {
  starts_at: string;
  ends_at: string | null;
  timezone: string | null;
}) {
  return formatSessionWhenLabel(
    session.starts_at,
    session.ends_at,
    session.timezone,
  );
}
