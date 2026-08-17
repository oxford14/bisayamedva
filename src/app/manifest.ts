import type { MetadataRoute } from "next";
import { site } from "@/content/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: site.name,
    short_name: "Bisaya MedVA",
    description:
      "Medical VA training in Bisaya-English. Learn Medical Billing and grow your career with Bisaya MedVA.",
    start_url: "/",
    display: "standalone",
    background_color: "#f5f6f0",
    theme_color: "#5b6d49",
    orientation: "portrait-primary",
    lang: "ceb",
    categories: ["education", "business"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
