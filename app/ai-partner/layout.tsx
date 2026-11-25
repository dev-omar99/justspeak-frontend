import type { Metadata } from "next";
import AiPartnerGate from "../../components/AiPartnerGate";

export const metadata: Metadata = {
  title: "AI Partner",
  description:
    "Live voice conversations with an AI speaking partner: free talk, interview practice, and guided lessons.",
};

export default function AiPartnerLayout({ children }: { children: React.ReactNode }) {
  return <AiPartnerGate>{children}</AiPartnerGate>;
}
