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
  const start = new Date(session.starts_at);
  const end = session.ends_at ? new Date(session.ends_at) : null;
  const date = start.toLocaleDateString("en-PH", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const startTime = start.toLocaleTimeString("en-PH", {
    hour: "numeric",
    minute: "2-digit",
  });
  const endTime = end
    ? end.toLocaleTimeString("en-PH", { hour: "numeric", minute: "2-digit" })
    : null;
  const tz = session.timezone ? ` · ${session.timezone}` : "";
  return endTime
    ? `${date} · ${startTime} – ${endTime}${tz}`
    : `${date} · ${startTime}${tz}`;
}
