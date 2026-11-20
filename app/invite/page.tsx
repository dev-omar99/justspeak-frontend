"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import PageTransition from "../../components/PageTransition";
import BrandWatermark from "../../components/BrandWatermark";
import { getUser, getToken } from "../../lib/auth";
import { User } from "../../types";

interface InvitationRecord {
  id: string;
  url: string;
  createdAt: string;
  status: "Pending" | "Accepted";
}

export default function InvitePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [invitationsLeft, setInvitationsLeft] = useState(2);
  const [pendingLinks, setPendingLinks] = useState<InvitationRecord[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  useEffect(() => {
    const u = getUser();
    const token = getToken();
    if (!u || !token) {
      router.push("/login");
      return;
    }
    setUser(u);

    try {
      const linksKey = `justspeak_invite_links_${u.id}`;
      const leftKey = `justspeak_invites_left_${u.id}`;
      const savedLinks = localStorage.getItem(linksKey);
      const savedLeft = localStorage.getItem(leftKey);
      const origin =
        typeof window !== "undefined"
          ? window.location.origin
          : "http://localhost:3000";
      const todayLabel = new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });

      if (savedLinks) {
        const parsed = JSON.parse(savedLinks);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setPendingLinks(parsed);
        }
      } else {
        const code = (u.id || "1gw6vA").replace(/[^a-zA-Z0-9]/g, "").slice(0, 6);
        const initial: InvitationRecord[] = [
          {
            id: "inv-1",
            url: `${origin}/signup?ref=${code}`,
            createdAt: todayLabel,
            status: "Pending",
          },
        ];
        setPendingLinks(initial);
      }
      if (savedLeft !== null && !Number.isNaN(Number(savedLeft))) {
        setInvitationsLeft(Math.max(0, Math.min(3, Number(savedLeft))));
      } else {
        setInvitationsLeft(2);
      }
    } catch {}
  }, [router]);

  function handleGenerateInvite() {
    if (!user) return;
    if (invitationsLeft <= 0) {
      if (pendingLinks[0]) {
        handleShareOrCopy(pendingLinks[0]);
      }
      return;
    }

    const origin =
      typeof window !== "undefined"
        ? window.location.origin
        : "http://localhost:3000";
    const randomCode = `${(user.id || "js").slice(0, 3)}${Math.random()
      .toString(36)
      .substring(2, 6)}`;
    const todayLabel = new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    const newInvite: InvitationRecord = {
      id: `inv-${Date.now()}`,
      url: `${origin}/signup?ref=${randomCode}`,
      createdAt: todayLabel,
      status: "Pending",
    };

    const updated = [newInvite, ...pendingLinks];
    const nextLeft = Math.max(0, invitationsLeft - 1);
    setPendingLinks(updated);
    setInvitationsLeft(nextLeft);
    handleShareOrCopy(newInvite);

    try {
      localStorage.setItem(
        `justspeak_invite_links_${user.id}`,
        JSON.stringify(updated)
      );
      localStorage.setItem(
        `justspeak_invites_left_${user.id}`,
        String(nextLeft)
      );
    } catch {}
  }

  function handleShareOrCopy(inv: InvitationRecord) {
    if (typeof navigator !== "undefined" && navigator.share) {
      navigator
        .share({
          title: "Join me on JustSpeak!",
          text: "Let's practice 1-on-1 English speaking together on JustSpeak and unlock 10 days of Prime!",
          url: inv.url,
        })
        .catch(() => {});
    }
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(inv.url);
      setCopiedId(inv.id);
      setTimeout(() => setCopiedId(null), 2200);
    }
  }

  if (!user) return null;

  return (
    <main className="min-h-screen flex flex-col pb-24 relative overflow-hidden">
      <BrandWatermark opacity={0.045} size="lg" />
      <PageTransition>
        <div className="max-w-lg mx-auto w-full px-5 pt-6 pb-12 flex flex-col gap-6">
          {/* Top Navigation Row (Screenshot #10) */}
          <div className="flex flex-col gap-4">
            <button
              type="button"
              onClick={() => {
                if (typeof window !== "undefined" && window.history.length > 1) {
                  router.back();
                } else {
                  router.push("/");
                }
              }}
              aria-label="Go back"
              className="w-11 h-11 rounded-full bg-white shadow-sm border border-slate-100 flex items-center justify-center text-slate-800 hover:bg-slate-50 transition-all"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Invite your friend
              </h1>
              <button
                type="button"
                onClick={() => setShowHelpModal(true)}
                className="w-7 h-7 rounded-full border-2 border-[#0F295A] text-[#0F295A] font-extrabold text-sm flex items-center justify-center hover:bg-blue-50 transition-colors"
                title="How invitations work"
              >
                ?
              </button>
            </div>
          </div>

          {/* 3D Golden Gift Box Illustration & Catch a Gift Hero */}
          <div className="flex flex-col items-center text-center gap-4 pt-2">
            {/* Custom 3D Isometric Golden Gift Box with Red Ribbon */}
            <div className="relative w-32 h-32 flex items-center justify-center">
              <svg viewBox="0 0 140 140" className="w-32 h-32 drop-shadow-xl">
                {/* Shadow */}
                <ellipse cx="70" cy="126" rx="44" ry="8" fill="#CBD5E1" opacity="0.55" />
                {/* Left Box Face */}
                <polygon points="24,52 70,74 70,122 24,98" fill="#E59A1A" />
                {/* Right Box Face */}
                <polygon points="116,52 70,74 70,122 116,98" fill="#C97D0E" />
                {/* Left Ribbon Vertical */}
                <polygon points="41,60 53,66 53,113 41,107" fill="#D92D20" />
                {/* Right Ribbon Vertical */}
                <polygon points="87,66 99,60 99,107 87,113" fill="#B42318" />
                {/* Lid Left */}
                <polygon points="20,42 70,64 70,76 20,54" fill="#F7B731" />
                {/* Lid Right */}
                <polygon points="120,42 70,64 70,76 120,54" fill="#E09619" />
                {/* Lid Top */}
                <polygon points="70,22 120,42 70,64 20,42" fill="#FFD15C" />
                {/* Top Ribbon Cross */}
                <polygon points="42,33 98,53 88,57 32,37" fill="#E11D48" />
                <polygon points="98,33 42,53 52,57 108,37" fill="#BE123C" />
                {/* 3D Red Bow Loops */}
                <path
                  d="M70 40 C50 18, 34 32, 54 44 Z"
                  fill="#F43F5E"
                />
                <path
                  d="M70 40 C90 18, 106 32, 86 44 Z"
                  fill="#E11D48"
                />
                <circle cx="70" cy="40" r="6" fill="#BE123C" />
              </svg>
            </div>

            <h2 className="text-2xl font-extrabold text-slate-900">
              Catch a gift!
            </h2>

            <div className="text-left w-full max-w-md px-2">
              <p className="text-sm text-slate-700 leading-relaxed">
                If you share invitation cards to your friend, you will get
              </p>
              <p className="text-sm font-extrabold text-[#0F295A] mt-0.5">
                a 10-day Prime membership!
              </p>
            </div>
          </div>

          {/* White Invitation Card Slots Box (Screenshot #10) */}
          <div className="bg-white rounded-[28px] p-6 shadow-md shadow-slate-200/70 border border-slate-100 flex flex-col items-center gap-5">
            {/* 3 Dashed Ticket Outlines */}
            <div className="flex items-center justify-center gap-4 w-full py-2">
              {[1, 2, 3].map((slot) => {
                const isFilled = slot <= invitationsLeft;
                return (
                  <div
                    key={slot}
                    className={`w-20 h-12 rounded-lg border-2 border-dashed flex items-center justify-center relative transition-all ${
                      isFilled
                        ? "border-[#0F295A] bg-blue-50/70 text-[#0F295A]"
                        : "border-[#0F295A]/60 bg-white text-slate-300"
                    }`}
                  >
                    {/* Ticket corner cutout visual */}
                    <span className="w-2.5 h-2.5 bg-white border-t-2 border-l-2 border-dashed border-[#0F295A]/60 absolute -bottom-0.5 -right-0.5" />
                    {isFilled && (
                      <span className="text-xs font-extrabold text-[#0F295A]">
                        🎟️ Ready
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            <p className="text-sm font-semibold text-slate-700">
              You Have{" "}
              <span className="font-extrabold text-[#0F295A]">
                {invitationsLeft} invitations
              </span>{" "}
              to send
            </p>

            <button
              type="button"
              onClick={handleGenerateInvite}
              className={`w-full py-4 rounded-2xl font-bold text-base transition-all ${
                invitationsLeft > 0
                  ? "bg-[#0F295A] hover:bg-[#163773] text-white shadow-lg shadow-[#0F295A]/20 active:scale-[0.98]"
                  : "bg-[#B6C2D2] hover:bg-[#9fb0c6] text-white"
              }`}
            >
              {invitationsLeft > 0 ? "Send invitation" : "Send invitation"}
            </button>

            <div className="w-full flex justify-end">
              <button
                type="button"
                onClick={() => setShowHistoryModal(true)}
                className="text-xs font-medium text-slate-400 underline hover:text-slate-600 transition-colors"
              >
                Invitation history
              </button>
            </div>
          </div>

          {/* Pending Invitations Section (Screenshot #10) */}
          <div className="flex flex-col gap-3 pt-2">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                Pending invitations
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Copy and send links here to your friends!
              </p>
            </div>

            <div className="flex flex-col gap-3">
              {pendingLinks.map((inv) => (
                <div
                  key={inv.id}
                  className="bg-white rounded-[24px] p-5 shadow-md shadow-slate-200/70 border border-slate-100 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-800 truncate">
                      {inv.url}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      {copiedId === inv.id
                        ? "✓ Link copied to clipboard!"
                        : `You opened ${inv.createdAt}`}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleShareOrCopy(inv)}
                    aria-label="Share or copy invitation link"
                    className="w-10 h-10 rounded-full bg-[#0F295A] hover:bg-[#163773] text-white flex items-center justify-center flex-shrink-0 shadow-sm active:scale-95 transition-all"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7" strokeLinecap="round" strokeLinejoin="round" />
                      <polyline points="16 6 12 2 8 6" strokeLinecap="round" strokeLinejoin="round" />
                      <line x1="12" y1="2" x2="12" y2="15" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </PageTransition>

      {/* Help Modal */}
      {showHelpModal && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setShowHelpModal(false)}
        >
          <div
            className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-extrabold text-slate-900">
              How Friend Invitations Work
            </h3>
            <ul className="text-xs text-slate-600 space-y-2.5 leading-relaxed list-disc pl-4">
              <li>
                You earn new invitation cards when you complete 7-minute English conversations and receive positive partner feedback.
              </li>
              <li>
                When your friend signs up via your link and completes their first conversation, both of you unlock a{" "}
                <strong className="text-[#0F295A]">10-day Prime membership</strong> with unlimited daily passes!
              </li>
              <li>
                Tap the blue share button next to any pending link below to copy or share it directly.
              </li>
            </ul>
            <button
              type="button"
              onClick={() => setShowHelpModal(false)}
              className="w-full py-3 rounded-2xl bg-[#0F295A] text-white font-bold text-xs"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* Invitation History Modal */}
      {showHistoryModal && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setShowHistoryModal(false)}
        >
          <div
            className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-extrabold text-slate-900">
                Invitation history
              </h3>
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>
            <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto">
              {pendingLinks.map((item) => (
                <div key={item.id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-slate-800">{item.url}</p>
                    <p className="text-slate-400 mt-0.5">Created {item.createdAt}</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 font-bold text-[10px]">
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setShowHistoryModal(false)}
              className="w-full py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
