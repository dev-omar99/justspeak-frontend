"use client";

import Link from "next/link";
import Button from "../Button";
import { TRIBES } from "../../lib/brand";
import { BlockedUserItem, RecentPartner } from "../../types";

interface PraiseInfoModalProps {
  open: boolean;
  onClose: () => void;
}

export function PraiseInfoModal({ open, onClose }: PraiseInfoModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-[#071426]/65 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-border flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-extrabold text-ink">
          &ldquo;I&apos;d love to talk again!&rdquo;
        </h3>
        <p className="text-xs text-ink-soft leading-relaxed">
          After every 7-minute conversation, partners indicate if they enjoyed speaking with you. Positive feedback grows your community reputation and adds partners to your Buddies list!
        </p>
        <Button variant="primary" onClick={onClose}>
          Got it
        </Button>
      </div>
    </div>
  );
}

interface BuddyUpgradeModalProps {
  partnerName: string | null;
  onClose: () => void;
}

export function BuddyUpgradeModal({
  partnerName,
  onClose,
}: BuddyUpgradeModalProps) {
  if (!partnerName) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-[#071426]/70 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-border flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-12 h-12 rounded-2xl bg-[#EDF6FC] border border-[#3B82C4]/30 flex items-center justify-center text-2xl">
          📞
        </div>
        <div>
          <span className="text-[11px] font-black uppercase tracking-wider text-glacier">
            JustSpeak Plus & Elite Feature
          </span>
          <h3 className="text-lg font-black text-ink mt-0.5">
            Call {partnerName} Again Directly
          </h3>
          <p className="text-xs text-ink-soft leading-relaxed mt-1.5">
            On the Free Starter plan, conversations are matched randomly in the global queue. Upgrade to <strong>JustSpeak Plus</strong> or <strong>Elite</strong> to call your favorite buddies directly anytime—plus unlock monthly AI Speaking Studio Tokens!
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
          <Button variant="secondary" onClick={onClose}>
            Maybe Later
          </Button>
          <Link
            href="/pricing"
            className="w-full h-12 rounded-2xl text-sm font-black flex items-center justify-center btn-primary-crest text-white shadow-md"
          >
            Unlock Direct Calls →
          </Link>
        </div>
      </div>
    </div>
  );
}

interface BlockedUsersModalProps {
  open: boolean;
  loading: boolean;
  blockedUsers: BlockedUserItem[];
  onUnblock: (blockedId: string) => void;
  onClose: () => void;
}

export function BlockedUsersModal({
  open,
  loading,
  blockedUsers,
  onUnblock,
  onClose,
}: BlockedUsersModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#071426]/65 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-border flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🚫</span>
            <h3 className="text-base font-extrabold text-ink">
              Never meet again
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-ink-soft hover:text-ink font-bold text-sm p-1 cursor-pointer"
          >
            ✕
          </button>
        </div>

        <p className="text-xs text-ink-soft">
          Users on this list are permanently excluded from your future conversation matches.
        </p>

        {loading ? (
          <div className="py-8 text-center text-xs text-ink-soft">
            Loading list...
          </div>
        ) : blockedUsers.length > 0 ? (
          <div className="divide-y divide-border/60 max-h-64 overflow-y-auto">
            {blockedUsers.map((item) => (
              <div
                key={item.id}
                className="py-3 flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <span>{item.blockedUser.flag}</span>
                  <div>
                    <p className="font-bold text-ink">
                      {item.blockedUser.name}
                    </p>
                    <p className="text-[11px] text-ink-soft">
                      Blocked on{" "}
                      {new Date(item.blockedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => onUnblock(item.blockedUser.id)}
                  className="text-xs font-extrabold text-glacier hover:text-primary hover:underline cursor-pointer"
                >
                  Unblock
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-6 text-center text-xs text-ink-soft">
            You haven&apos;t blocked any users yet.
          </div>
        )}

        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
  );
}

interface TribeSelectionModalProps {
  open: boolean;
  selectedTribeId?: number | null;
  activeTribeId?: number;
  onSelectTribe: (tribeId: number) => void;
  onClose: () => void;
}

export function TribeSelectionModal({
  open,
  selectedTribeId,
  activeTribeId = 3,
  onSelectTribe,
  onClose,
}: TribeSelectionModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#071426]/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl border border-border flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">🛡️</span>
            <div>
              <h3 className="text-lg font-extrabold text-ink">
                Choose Your Daily Tribe (1–12)
              </h3>
              <p className="text-xs text-ink-soft">
                Pick a 2-hour daily speaking routine slot that fits your schedule
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-ink-soft hover:text-ink font-bold text-base p-1 cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-80 overflow-y-auto pr-1">
          {TRIBES.map((tr) => {
            const isSelected = selectedTribeId === tr.id;
            const isLive = activeTribeId === tr.id;
            return (
              <button
                key={tr.id}
                onClick={() => onSelectTribe(tr.id)}
                className={`p-3.5 rounded-2xl border-2 text-left flex flex-col gap-1 transition-all cursor-pointer ${
                  isSelected
                    ? "border-primary bg-primary-light shadow-2xs"
                    : "border-border hover:border-glacier/60 hover:bg-surface"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-ink">
                    {tr.label}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {isLive && (
                      <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                        Active 🟢
                      </span>
                    )}
                    {isSelected && (
                      <span className="text-[10px] font-extrabold text-primary bg-white px-2 py-0.5 rounded-full border border-border">
                        Selected ✓
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-[11px] text-glacier font-bold">{tr.local}</p>
                <p className="text-[10px] text-ink-soft">{tr.utc} UTC</p>
              </button>
            );
          })}
        </div>

        <div className="pt-2 border-t border-border">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}

interface PartnerMemoModalProps {
  partner: RecentPartner | null;
  memoText: string;
  onChangeText: (value: string) => void;
  onSave: () => void;
  onClose: () => void;
}

export function PartnerMemoModal({
  partner,
  memoText,
  onChangeText,
  onSave,
  onClose,
}: PartnerMemoModalProps) {
  if (!partner) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#071426]/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-border flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">📝</span>
            <div>
              <h3 className="text-base font-extrabold text-ink">
                Memo for {partner.name}
              </h3>
              <p className="text-xs text-ink-soft">
                {partner.country || "Global"} • Private note
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-ink-soft hover:text-ink font-bold text-base p-1 cursor-pointer"
          >
            ✕
          </button>
        </div>

        <textarea
          value={memoText}
          onChange={(e) => onChangeText(e.target.value)}
          placeholder="e.g. Lives in Tokyo, software engineer, preparing for IELTS speaking..."
          rows={4}
          maxLength={400}
          className="w-full text-xs p-3.5 border border-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-glacier/30 resize-none leading-relaxed text-ink bg-surface"
        />

        <div className="flex items-center justify-between pt-1 gap-3">
          <Link
            href="/memos"
            className="text-xs font-extrabold text-glacier hover:underline whitespace-nowrap"
          >
            📖 Full Notebook
          </Link>

          <div className="flex items-center gap-2 w-52">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" onClick={onSave}>
              Save
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
