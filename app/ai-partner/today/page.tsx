"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PageTransition from "../../../components/PageTransition";
import TaskCard from "../../../components/ai-partner/programmes/TaskCard";
import { getToken, getUser } from "../../../lib/auth";
import { nextTask } from "../../../lib/programmes";
import { fetchAiPartnerProgrammes, Programme } from "../../../services/ai-partner";

/** "Tasks for today": one card per programme showing its next unfinished task. New page; nothing existing changed. */
export default function TodayPage() {
  const router = useRouter();
  const [programmes, setProgrammes] = useState<Programme[] | null>(null);
  const [error, setError] = useState("");
  const [index, setIndex] = useState(0);
  // Read after mount: localStorage is not available on the server (avoids a hydration mismatch).
  const [firstName, setFirstName] = useState("");
  useEffect(() => setFirstName((getUser()?.name || "").split(" ")[0]), []);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    fetchAiPartnerProgrammes(token)
      .then((d) => setProgrammes(d.programmes))
      .catch((e) => setError(e.message || "Could not load your tasks."));
  }, [router]);

  // Programmes with something left to do come first in the carousel.
  const open = (programmes ?? []).filter((p) => nextTask(p));
  const current = open[Math.min(index, Math.max(0, open.length - 1))];
  const task = current ? nextTask(current) : null;

  return (
    <PageTransition>
      <main className="min-h-screen flex flex-col pb-24 lg:pb-16 text-ink">
        <div className="max-w-2xl mx-auto w-full px-4 sm:px-6 py-7 flex flex-col gap-5">
          <h1 className="text-2xl font-black leading-tight">
            Hi{firstName ? ` ${firstName}` : ""}, take a look at your tasks for today:
          </h1>
          {error && <p className="text-sm font-semibold text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</p>}
          {!programmes && !error && <p className="text-sm text-ink-soft">Loading…</p>}
          {programmes && open.length === 0 && (
            <p className="text-sm text-ink-soft bg-white border border-border rounded-2xl px-5 py-6">
              Nothing left to do right now. See <Link href="/ai-partner/learning" className="font-bold text-crimson">My Learning</Link>.
            </p>
          )}
          {current && task && (
            <div className="bg-slate-50 border border-border rounded-2xl p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-black text-base">{current.title}</h2>
                <div className="flex items-center gap-2 bg-white rounded-full border border-border px-3 py-1 text-sm font-black shrink-0">
                  <button type="button" aria-label="Previous programme" disabled={open.length < 2} onClick={() => setIndex((i) => (i - 1 + open.length) % open.length)}>‹</button>
                  <span>{open.indexOf(current) + 1} / {open.length}</span>
                  <button type="button" aria-label="Next programme" disabled={open.length < 2} onClick={() => setIndex((i) => (i + 1) % open.length)}>›</button>
                </div>
              </div>
              <TaskCard programme={current} task={task} />
            </div>
          )}
        </div>
      </main>
    </PageTransition>
  );
}
