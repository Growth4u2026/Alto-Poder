import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Alta · Growth4u",
    short_name: "Alta",
    description: "Sua sócia de negócios digital, com o método da Laís Lucena.",
    lang: "pt-BR",
    start_url: "/",
    display: "standalone",
    background_color: "#fbf8fd",
    theme_color: "#7b3fbf",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
  };
}
