import Image from "next/image";
import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { authCopy, images } from "@/content/site";

export function AuthShell({
  children,
}: {
  children: React.ReactNode;
  /** Kept for call-site compatibility; unused in card layout. */
  image?: "weekend" | "hero";
}) {
  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-x-clip bg-sand px-4 py-10 sm:px-6 lg:px-8">
      {/* Soft page wash */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_10%,rgba(162,172,130,0.35),transparent_50%),radial-gradient(ellipse_at_90%_90%,rgba(91,109,73,0.12),transparent_45%)]"
      />

      <div className="relative z-10 w-full max-w-5xl">
        <div className="relative grid overflow-visible rounded-[1.75rem] bg-white shadow-[0_24px_80px_rgba(47,56,38,0.14)] lg:grid-cols-[0.92fr_1.08fr]">
          {/* Left welcome panel */}
          <aside className="relative overflow-hidden rounded-t-[1.75rem] bg-cream lg:min-h-[34rem] lg:rounded-l-[1.75rem] lg:rounded-tr-none">
            <Image
              src={images.auth.wave.src}
              alt=""
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 45vw"
              className="object-cover object-center opacity-90"
            />
            <div className="absolute inset-0 bg-linear-to-b from-cream/40 via-transparent to-cream/70 lg:bg-linear-to-br lg:from-cream/30 lg:via-transparent lg:to-navy/10" />

            {/* Decorative rings */}
            <div
              aria-hidden
              className="pointer-events-none absolute top-[18%] right-[12%] size-24 rounded-full border border-navy/15 sm:size-32"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute top-[28%] right-[22%] size-10 rounded-full border border-teal-bright/50"
            />

            <div className="relative z-10 flex h-full flex-col px-7 pt-8 pb-4 sm:px-9 sm:pt-10 lg:pb-0">
              <div>
                <h2 className="font-display text-[clamp(2.4rem,5vw,3.4rem)] leading-none font-semibold tracking-tight text-ink">
                  {authCopy.shell.welcome.replace("!", "")}
                  <span className="text-teal-bright">!</span>
                </h2>
                <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted sm:text-base">
                  {authCopy.shell.support}
                </p>
              </div>

              {/* Character — overlaps into form on desktop */}
              <div className="relative mt-4 flex flex-1 items-end justify-center lg:mt-0 lg:justify-start">
                <div className="relative z-20 h-[14rem] w-[11rem] sm:h-[16rem] sm:w-[12.5rem] lg:absolute lg:-bottom-6 lg:-right-16 lg:h-[22rem] lg:w-[17rem] xl:-right-20 xl:h-[24rem] xl:w-[18.5rem]">
                  <Image
                    src={images.auth.character.src}
                    alt={images.auth.character.alt}
                    fill
                    priority
                    sizes="(max-width: 1024px) 200px, 300px"
                    className="object-contain object-bottom drop-shadow-[0_18px_40px_rgba(47,56,38,0.22)]"
                  />
                </div>
              </div>
            </div>
          </aside>

          {/* Right form panel */}
          <div className="relative z-30 flex flex-col rounded-b-[1.75rem] bg-white px-6 py-8 sm:px-10 sm:py-10 lg:rounded-r-[1.75rem] lg:rounded-bl-none lg:px-12 lg:py-12">
            <div className="mb-7">
              <Logo />
              <Link
                href="/"
                className="mt-2 inline-block text-xs font-medium text-muted transition-colors hover:text-navy"
              >
                Back to home
              </Link>
            </div>
            <div className="flex flex-1 flex-col justify-center">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
