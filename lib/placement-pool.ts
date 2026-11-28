import { PLACEMENT_QUESTIONS, type PlacementQuestion } from "./academy";
import { EXTRA_PLACEMENT_QUESTIONS } from "./placement-items";

/** The full item pool for the adaptive test: the original 12 items plus 24 new ones (4 per level, see placement-items.ts). */
export const PLACEMENT_POOL: PlacementQuestion[] = [...PLACEMENT_QUESTIONS, ...EXTRA_PLACEMENT_QUESTIONS];
