import { ClosingSection } from "@/features/home/closing-section";
import { FigmaSection } from "@/features/home/figma-section";
import { GenerateSection } from "@/features/home/generate-section";
import { Guardrails } from "@/features/home/guardrails";
import { HeroSection } from "@/features/home/hero-section";
import { InstructionsSection } from "@/features/home/instructions-section";
import { ObjectionsSection } from "@/features/home/objections-section";
import { SiteFooter } from "@/features/home/site-footer";
import { SiteHeader } from "@/features/home/site-header";
import { ToolboxSection } from "@/features/home/toolbox-section";

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main>
        <HeroSection />
        <ToolboxSection />
        <FigmaSection />
        <GenerateSection />
        <Guardrails />
        <InstructionsSection />
        <ObjectionsSection />
        <ClosingSection />
      </main>
      <SiteFooter />
    </>
  );
}
