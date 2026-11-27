import type { ContentSource } from "../../../services/ai-partner";

/** Small provenance line for a content item. Shows the licence, and the attribution when one is required. */
export default function SourceNote({ source }: { source: ContentSource }) {
  return (
    <p className="text-[10px] text-ink-soft">
      {source.licence}
      {source.attribution ? ` · ${source.attribution}` : ""}
    </p>
  );
}
