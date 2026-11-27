"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getToken } from "../../../lib/auth";
import { CatalogField, fetchAiPartnerCatalog } from "../../../services/ai-partner";

/**
 * Loads the catalog once per mount. Redirects to login without a token, shows an error with Retry
 * (never an endless Loading), and exposes `retry`.
 */
export function useCatalog() {
  const router = useRouter();
  const [fields, setFields] = useState<CatalogField[] | null>(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    setError("");
    fetchAiPartnerCatalog(token)
      .then((d) => setFields(d.fields))
      .catch((e) => setError(e.message || "Could not load your lessons."));
  }, [router, attempt]);

  return { fields, error, retry: () => setAttempt((n) => n + 1) };
}
