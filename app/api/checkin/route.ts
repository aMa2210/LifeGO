// POST /api/checkin — validates input and returns the computed attribute delta.
// Sprint 2: stateless echo (client owns state via Zustand).
// Sprint 4 plan: write to DB so /api/seed can reset the demo properly.

import type { NextRequest } from "next/server";
import { POI_BY_ID, computeCheckinDelta } from "@/lib/tokyo-pois";

type CheckinBody = {
  poiId?: string;
  weight?: number;
  tags?: string[];
  note?: string;
};

export async function POST(req: NextRequest) {
  let body: CheckinBody;
  try {
    body = (await req.json()) as CheckinBody;
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { poiId, weight, tags, note } = body;

  if (!poiId || typeof poiId !== "string") {
    return Response.json({ error: "Missing poiId" }, { status: 400 });
  }
  const poi = POI_BY_ID[poiId];
  if (!poi) {
    return Response.json({ error: `Unknown POI: ${poiId}` }, { status: 400 });
  }

  if (weight !== 1 && weight !== 3 && weight !== 5) {
    return Response.json(
      { error: "weight must be 1, 3, or 5" },
      { status: 400 }
    );
  }

  const attributeDelta = computeCheckinDelta(poi, weight);

  return Response.json({
    success: true,
    checkin: {
      poiId,
      poi,
      weight,
      tags: Array.isArray(tags) ? tags : [],
      note: typeof note === "string" ? note : null,
      timestamp: new Date().toISOString(),
      attributeDelta,
    },
  });
}
