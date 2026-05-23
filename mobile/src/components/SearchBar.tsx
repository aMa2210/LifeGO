// Native stub — SearchBar is web-only for now (mobile will use GPS "I'm here"
// rather than text search). Metro picks SearchBar.web.tsx on web.

import type { POI } from "@/lib/tokyo-pois";

type Props = {
  onSelect: (poi: POI) => void;
};

export function SearchBar(_props: Props) {
  return null;
}
