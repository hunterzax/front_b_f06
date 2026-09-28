import { NextRequest, NextResponse } from "next/server";

// function isAllowedFileUrl(raw: string) {
//   try {
//     const url = new URL(raw);
//     if (url.protocol !== "https:" && url.protocol !== "http:") return false;
//     const host = url.hostname.toLowerCase();
//     return host === "pttplc.com" || host.endsWith(".pttplc.com");
//   } catch {
//     return false;
//   }
// }

export async function GET(req: NextRequest) {
  const fileUrl = req.nextUrl.searchParams.get("url");

  // if (!fileUrl || !isAllowedFileUrl(fileUrl)) {
  if (!fileUrl) {
    return NextResponse.json({ message: "Invalid file url" }, { status: 400 });
  }

  try {
    const upstream = await fetch(fileUrl, { cache: "no-store" });

    if (!upstream.ok || !upstream.body) {
      return NextResponse.json(
        { message: "Failed to fetch file" },
        { status: upstream.status || 502 }
      );
    }

    const headers = new Headers();
    headers.set(
      "content-type",
      upstream.headers.get("content-type") || "application/octet-stream"
    );

    return new NextResponse(upstream.body, {
      status: 200,
      headers,
    });
  } catch {
    return NextResponse.json(
      { message: "Failed to fetch file" },
      { status: 502 }
    );
  }
}
