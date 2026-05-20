import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CGKN Dashboard",
    short_name: "CGKN",
    description: "Sales Data Management",
    start_url: "/",
    display: "standalone",
    background_color: "#f4f6fb",
    theme_color: "#1c9706",
    icons: [
      {
        src: "/public/icon.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}