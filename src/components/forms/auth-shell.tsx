import Image from "next/image";
import { Logo } from "@/components/brand/logo";
import { hero, images } from "@/content/site";

export function AuthShell({
  children,
  image = "weekend",
}: {
  children: React.ReactNode;
  image?: "weekend" | "hero";
}) {
  const photo =
    image === "hero"
      ? { src: hero.image.src, alt: hero.image.alt }
      : images.weekend;

  return (
    <div className="grid min-h-full lg:grid-cols-2">
      <div className="relative hidden min-h-full lg:block">
        <Image
          src={photo.src}
          alt={photo.alt}
          fill
          priority
          sizes="50vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-navy/35" />
        <div className="absolute left-8 top-8">
          <Logo inverted />
        </div>
      </div>
      <div className="flex min-h-full flex-col bg-cream px-4 py-8 sm:px-10">
        <div className="mb-8 lg:hidden">
          <Logo />
        </div>
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-6">
          {children}
        </div>
      </div>
    </div>
  );
}
