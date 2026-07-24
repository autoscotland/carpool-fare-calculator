import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const key = process.env.GOOGLE_ROUTES_API_KEY;
  if (!key) return NextResponse.json({ error: "尚未設定 Google Places API Key" }, { status: 503 });
  const { input, sessionToken } = (await request.json()) as { input?: string; sessionToken?: string };
  if (!input || input.trim().length < 2) return NextResponse.json({ suggestions: [] });
  const response = await fetch("https://places.googleapis.com/v1/places:autocomplete", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": key,
      "X-Goog-FieldMask": "suggestions.placePrediction.placeId,suggestions.placePrediction.text.text",
    },
    body: JSON.stringify({
      input: input.slice(0, 120),
      includedRegionCodes: ["tw"],
      languageCode: "zh-TW",
      sessionToken,
    }),
  });
  const data = await response.json();
  if (!response.ok) return NextResponse.json({ error: data?.error?.message ?? "地點搜尋失敗" }, { status: response.status });
  return NextResponse.json(data);
}
