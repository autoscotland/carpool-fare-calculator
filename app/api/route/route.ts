import { NextResponse } from "next/server";

type PlaceInput = { text: string; placeId?: string };

const waypoint = (place: PlaceInput) =>
  place.placeId ? { placeId: place.placeId } : { address: place.text };

export async function POST(request: Request) {
  const key = process.env.GOOGLE_ROUTES_API_KEY;
  if (!key) return NextResponse.json({ error: "尚未設定 Google Routes API Key" }, { status: 503 });
  const body = (await request.json()) as { places?: PlaceInput[]; optimize?: boolean };
  const places = (body.places ?? []).filter((place) => place.text.trim());
  if (places.length < 2 || places.length > 25) {
    return NextResponse.json({ error: "請輸入 2 至 25 個地點" }, { status: 400 });
  }
  const response = await fetch("https://routes.googleapis.com/directions/v2:computeRoutes", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": key,
      "X-Goog-FieldMask": "routes.distanceMeters,routes.duration,routes.legs.distanceMeters,routes.legs.duration,routes.optimizedIntermediateWaypointIndex",
    },
    body: JSON.stringify({
      origin: { location: waypoint(places[0]) },
      destination: { location: waypoint(places.at(-1)!) },
      intermediates: places.slice(1, -1).map((place) => ({ location: waypoint(place) })),
      travelMode: "DRIVE",
      languageCode: "zh-TW",
      regionCode: "TW",
      optimizeWaypointOrder: Boolean(body.optimize),
    }),
  });
  const data = await response.json();
  if (!response.ok) return NextResponse.json({ error: data?.error?.message ?? "路線計算失敗" }, { status: response.status });
  return NextResponse.json(data);
}
