import type { Metadata } from "next";
import AiPartnerGate from "../../components/AiPartnerGate";
import AiPartnerShell from "../../components/ai-partner/AiPartnerShell";

export const metadata: Metadata = {
  alternates: { canonical: "/ai-partner" },
  title: "AI Partner",
  description:
    "Live voice conversations with an AI speaking partner: free talk, interview practice, and guided lessons.",
};

export default function AiPartnerLayout({ children }: { children: React.ReactNode }) {
  return (
    <AiPartnerGate>
      {/* AI Partner pages are English only: keep them left-to-right even when the site language is Arabic. */}
      <div dir="ltr" lang="en">
        <AiPartnerShell>{children}</AiPartnerShell>
      </div>
    </AiPartnerGate>
  );
}
