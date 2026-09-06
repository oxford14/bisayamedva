import { saveReferralCommissions } from "@/app/(admin)/admin/actions";
import { ActionForm } from "@/components/admin/action-form";
import { AdminPageHeader } from "@/components/admin/ui";
import { Field, selectClassName } from "@/components/forms/field";
import { Input } from "@/components/ui/input";
import { site } from "@/content/site";
import { listCourseReferralCommissions } from "@/lib/referrals/data";
import { requireSuperAdmin } from "@/lib/supabase/auth";
import { formatPeso } from "@/lib/utils";

export default async function SettingsPage() {
  await requireSuperAdmin();
  const commissions = await listCourseReferralCommissions();

  return (
    <div>
      <AdminPageHeader
        title="Settings"
        description="Application identity and per-course referral commission."
      />

      <div className="grid gap-4 rounded-2xl border border-border bg-white p-5 sm:grid-cols-2">
        <div>
          <p className="text-xs font-semibold tracking-wide text-muted uppercase">
            App URL
          </p>
          <p className="mt-1 text-sm">{process.env.NEXT_PUBLIC_APP_URL ?? site.url}</p>
        </div>
        <div>
          <p className="text-xs font-semibold tracking-wide text-muted uppercase">
            Support email
          </p>
          <p className="mt-1 text-sm">{site.email}</p>
        </div>
      </div>

      <section className="mt-8 rounded-2xl border border-border bg-white p-5">
        <h2 className="font-display text-xl font-semibold text-ink">
          Referral commission
        </h2>
        <p className="mt-1 max-w-2xl text-sm text-muted">
          Set individual commission per course. Fixed pesos or percent of what
          the referred friend paid. Disabled or 0 means no payout for that
          course.
        </p>

        {commissions.length === 0 ? (
          <p className="mt-4 text-sm text-muted">
            Publish a course first to set referral commission.
          </p>
        ) : (
          <ActionForm
            action={saveReferralCommissions}
            submitLabel="Save referral commissions"
            className="mt-5"
          >
            <div className="space-y-4">
              {commissions.map((course) => (
                <div
                  key={course.courseId}
                  className="grid gap-3 rounded-xl border border-border p-4 md:grid-cols-[minmax(0,1.4fr)_8rem_8rem_auto] md:items-end"
                >
                  <input
                    type="hidden"
                    name="course_ids"
                    value={course.courseId}
                  />
                  <div>
                    <p className="font-medium text-ink">{course.title}</p>
                    <p className="mt-0.5 text-xs text-muted">
                      Course price {formatPeso(course.price)}
                    </p>
                  </div>
                  <Field
                    label="Type"
                    htmlFor={`mode_${course.courseId}`}
                  >
                    <select
                      id={`mode_${course.courseId}`}
                      name={`mode_${course.courseId}`}
                      defaultValue={course.mode}
                      className={selectClassName}
                    >
                      <option value="FIXED">Fixed ₱</option>
                      <option value="PERCENT">Percent %</option>
                    </select>
                  </Field>
                  <Field
                    label="Value"
                    htmlFor={`value_${course.courseId}`}
                  >
                    <Input
                      id={`value_${course.courseId}`}
                      name={`value_${course.courseId}`}
                      type="number"
                      min="0"
                      step="0.01"
                      defaultValue={course.value}
                    />
                  </Field>
                  <label className="flex h-12 items-center gap-2 text-sm font-medium text-navy">
                    <input
                      type="checkbox"
                      name={`enabled_${course.courseId}`}
                      defaultChecked={course.enabled}
                      className="size-4 accent-[var(--navy)]"
                    />
                    Enabled
                  </label>
                </div>
              ))}
            </div>
          </ActionForm>
        )}
      </section>
    </div>
  );
}