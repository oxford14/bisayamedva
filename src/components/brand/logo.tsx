import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({
  className,
  inverted = false,
}: {
  className?: string;
  inverted?: boolean;
}) {
  return (
    <Link
      href="/"
      className={cn("inline-flex items-center cursor-pointer", className)}
      aria-label="Bisaya MedVA home"
    >
      <Image
        src={
          inverted
            ? "/images/brand/logo-on-dark.png"
            : "/images/brand/logo-on-light.png"
        }
        alt="Bisaya MedVA"
        width={2032}
        height={976}
        className="h-10 w-auto sm:h-11"
        priority
      />
    </Link>
  );
}
