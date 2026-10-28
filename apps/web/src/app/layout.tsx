import type { Metadata } from "next";
import { Bricolage_Grotesque, Geist, Jost, Zilla_Slab } from "next/font/google";

import { Providers } from "./providers";

import "./globals.css";

const sans = Geist({ variable: "--font-family-sans", subsets: ["latin"] });
const display = Jost({ variable: "--font-family-display", subsets: ["latin"] });
const grotesque = Bricolage_Grotesque({
  variable: "--font-family-grotesque",
  subsets: ["latin"],
  preload: false,
});
const slab = Zilla_Slab({
  variable: "--font-family-slab",
  subsets: ["latin"],
  weight: "600",
  preload: false,
});
const fontVariables = [sans, display, grotesque, slab].map((font) => font.variable).join(" ");

export const metadata: Metadata = {
  title: "Design Boilerplate",
  description:
    "A Next.js monorepo and agent toolkit for designing with your agent, built from one design system that keeps every piece on scale.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={fontVariables}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
