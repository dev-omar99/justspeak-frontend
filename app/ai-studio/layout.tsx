import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI English Speaking Coach & Roleplay Studio",
  description:
    "Practice speaking English with an empathetic, intelligent AI conversation coach. Perfect for IELTS preparation, job interviews, and spontaneous discussions.",
  openGraph: {
    title: "AI English Speaking Coach | JustSpeak",
    description: "Interactive AI English roleplay and pronunciation feedback studio.",
  },
};

export default function AiStudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
