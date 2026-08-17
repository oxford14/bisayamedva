import Link from "next/link";
import { CheckCircle2, Lock, Video } from "lucide-react";
import {
  coreBeginnerBundle,
  deepDiveBundle,
  deepDivePricingSummary,
  deepDiveTopics,
  type CatalogBundle,
  type CatalogTopic,
} from "@/content/courses";
import { Button } from "@/components/ui/button";
import { MemberStatusBadge } from "@/components/member/ui";
import { cn, formatPeso } from "@/lib/utils";
import type { MemberEnrollment } from "@/lib/member/data";

function ownsCoreEnrollment(enrollments: MemberEnrollment[]) {
  return enrollments.some(
    (e) =>
      e.status === "ACTIVE" ||
      e.status === "COMPLETED" ||
      e.status === "PENDING_PAYMENT",
  );
}

function primaryOwned(enrollments: MemberEnrollment[]) {
  const priority = ["ACTIVE", "PENDING_PAYMENT", "COMPLETED", "CANCELLED"];
  return (
    [...enrollments].sort((a, b) => {
      const ai = priority.indexOf(a.status);
      const bi = priority.indexOf(b.status);
      if (ai !== bi) return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    })[0] ?? null
  );
}

function BundleThumb({
  locked,
  label,
  accent,
}: {
  locked?: boolean;
  label: string;
  accent: "core" | "dive";
}) {
  return (
    <div
      className={cn(
        "relative flex h-36 items-end overflow-hidden rounded-xl px-4 py-3",
        accent === "core"
          ? "bg-[linear-gradient(135deg,#5b6d49_0%,#3f4a32_55%,#a2ac82_120%)]"
          : "bg-[linear-gradient(135deg,#455338_0%,#2f3826_50%,#5b6d49_100%)]",
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.35), transparent 45%), radial-gradient(circle at 80% 0%, rgba(162,172,130,0.5), transparent 40%)",
        }}
      />
      {locked ? (
        <div className="absolute inset-0 flex items-center justify-center bg-navy/35 backdrop-blur-[1px]">
          <span className="flex size-12 items-center justify-center rounded-full bg-white/90 text-navy shadow-sm">
            <Lock className="size-5" aria-hidden />
          </span>
        </div>
      ) : null}
      <p className="relative z-[1] text-sm font-semibold text-cream">{label}</p>
    </div>
  );
}

function TopicList({ topics }: { topics: CatalogTopic[] }) {
  return (
    <ul className="mt-3 space-y-2">
      {topics.map((topic) => (
        <li key={topic.id} className="flex gap-2 text-sm text-muted">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-navy/55" aria-hidden />
          <span>
            <span className="font-medium text-ink">{topic.title}</span>
            {topic.price > 0 ? (
              <span className="ml-1 text-xs text-muted">
                · {formatPeso(topic.price)}
              </span>
            ) : null}
          </span>
        </li>
      ))}
    </ul>
  );
}

function BundleCard({
  bundle,
  owned,
  ownedStatus,
}: {
  bundle: CatalogBundle;
  owned?: boolean;
  ownedStatus?: string;
}) {
  const pricing = bundle.id === "full-deep-dive" ? deepDivePricingSummary() : null;
  const locked = !bundle.available && !owned;

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-[0_8px_24px_rgba(47,56,38,0.04)]">
      <div className="p-4 pb-0">
        <BundleThumb
          locked={locked}
          label={bundle.eyebrow}
          accent={bundle.id === "core-beginner" ? "core" : "dive"}
        />
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex flex-wrap items-center gap-2">
          {bundle.id === "full-deep-dive" ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-sand px-2.5 py-1 text-[11px] font-semibold tracking-wide text-navy uppercase">
              <Video className="size-3.5" aria-hidden />
              Live Zoom
            </span>
          ) : (
            <span className="inline-flex rounded-full bg-sand px-2.5 py-1 text-[11px] font-semibold tracking-wide text-navy/70 uppercase">
              {bundle.eyebrow}
            </span>
          )}
          {owned && ownedStatus ? <MemberStatusBadge status={ownedStatus} /> : null}
          {locked ? (
            <span className="inline-flex rounded-full bg-sand px-2.5 py-1 text-[11px] font-semibold tracking-wide text-muted uppercase">
              Coming soon
            </span>
          ) : null}
        </div>

        <h3 className="mt-3 font-display text-xl font-semibold text-ink">
          {bundle.title}
        </h3>
        <p className="mt-1 text-sm text-muted">{bundle.subtitle}</p>
        <p className="mt-3 text-sm leading-relaxed text-muted">{bundle.description}</p>

        <TopicList topics={bundle.topics} />

        <div className="mt-auto border-t border-border pt-4">
          {pricing ? (
            <div className="mb-3 space-y-1">
              <p className="text-xs text-muted">
                Individual total{" "}
                <span className="line-through">{pricing.regularLabel}</span>
              </p>
              <p className="font-display text-3xl font-semibold text-navy">
                {pricing.bundleLabel}
              </p>
              <p className="text-xs font-semibold text-navy/70">
                Save {pricing.savingsLabel} ({pricing.percent}% off) as a bundle
              </p>
            </div>
          ) : (
            <p className="mb-3 font-display text-3xl font-semibold text-navy">
              {formatPeso(bundle.price)}
            </p>
          )}

          {owned ? (
            <Button variant="secondary" className="w-full" asChild>
              <Link href="/member/schedule">View schedule</Link>
            </Button>
          ) : bundle.available ? (
            <Button variant="accent" className="w-full" asChild>
              <Link href={bundle.ctaHref}>{bundle.ctaLabel}</Link>
            </Button>
          ) : (
            <Button variant="secondary" className="w-full" disabled>
              {bundle.ctaLabel}
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}

function TopicCard({ topic }: { topic: CatalogTopic }) {
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-[0_8px_24px_rgba(47,56,38,0.04)]">
      <div className="p-4 pb-0">
        <BundleThumb locked label={topic.subtitle} accent="dive" />
      </div>
      <div className="flex flex-1 flex-col p-5">
        <span className="inline-flex w-fit rounded-full bg-sand px-2.5 py-1 text-[11px] font-semibold tracking-wide text-muted uppercase">
          Locked · Coming soon
        </span>
        <h3 className="mt-3 font-semibold text-ink">{topic.title}</h3>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">
          {topic.description}
        </p>
        <div className="mt-4 flex items-end justify-between gap-3 border-t border-border pt-4">
          <p className="font-display text-2xl font-semibold text-navy">
            {formatPeso(topic.price)}
          </p>
          <Button variant="secondary" size="sm" disabled>
            Unlock later
          </Button>
        </div>
      </div>
    </article>
  );
}

export function MemberCourseCatalog({
  enrollments,
}: {
  enrollments: MemberEnrollment[];
}) {
  const owned = ownsCoreEnrollment(enrollments);
  const primary = primaryOwned(enrollments);
  const pricing = deepDivePricingSummary();

  return (
    <div className="space-y-10">
      {primary ? (
        <section>
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <h2 className="font-display text-xl font-semibold text-ink">
                Imong active training
              </h2>
              <p className="mt-1 text-sm text-muted">
                Courses you already enrolled in show here first.
              </p>
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-white p-5 shadow-[0_8px_24px_rgba(47,56,38,0.04)]">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold tracking-[0.14em] text-navy/50 uppercase">
                  {primary.course?.course_type ?? "Owned"}
                </p>
                <h3 className="mt-1 font-display text-2xl font-semibold text-ink">
                  {primary.course?.title ?? coreBeginnerBundle.title}
                </h3>
                <p className="mt-1 text-sm text-muted">
                  {primary.session?.title ?? "Session TBA"}
                </p>
              </div>
              <MemberStatusBadge status={primary.status} />
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <Button variant="accent" asChild>
                <Link href="/member/schedule">Open schedule</Link>
              </Button>
              <Button variant="secondary" asChild>
                <Link href="/member/payments">View payments</Link>
              </Button>
            </div>
          </div>
        </section>
      ) : null}

      <section>
        <div className="mb-4">
          <h2 className="font-display text-xl font-semibold text-ink">
            Course bundles
          </h2>
          <p className="mt-1 text-sm text-muted">
            Duha ka paths: Core Beginner for ₱200, then the Full Deep Dive Live Zoom
            bundle when it opens.
          </p>
        </div>
        <div className="grid gap-5 lg:grid-cols-2">
          <BundleCard
            bundle={coreBeginnerBundle}
            owned={owned}
            ownedStatus={primary?.status}
          />
          <BundleCard bundle={deepDiveBundle} />
        </div>
      </section>

      <section>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-semibold text-ink">
              Full Deep Dive topics
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-muted">
              Individual prices shown for transparency. Bundle everything for{" "}
              {pricing.bundleLabel} instead of {pricing.regularLabel} — save{" "}
              {pricing.savingsLabel}.
            </p>
          </div>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {deepDiveTopics.map((topic) => (
            <TopicCard key={topic.id} topic={topic} />
          ))}
        </div>
      </section>
    </div>
  );
}
