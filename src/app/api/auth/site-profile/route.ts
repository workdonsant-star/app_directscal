import { getCurrentAuthSession } from "@/lib/auth/session";

const allowedOrigins = new Set([
  "https://directscal.com",
  "https://www.directscal.com",
]);

function responseHeaders(request: Request) {
  const headers = new Headers({
    "Cache-Control": "private, no-store, max-age=0",
    Vary: "Origin, Cookie",
  });
  const origin = request.headers.get("origin");
  if (origin && allowedOrigins.has(origin)) {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Access-Control-Allow-Credentials", "true");
  }
  return headers;
}

export async function GET(request: Request) {
  const headers = responseHeaders(request);
  if (!headers.has("Access-Control-Allow-Origin")) {
    return Response.json({ user: null }, { status: 403, headers });
  }

  try {
    const session = await getCurrentAuthSession();
    if (
      !session || session.acquisition || session.leadershipInvitation ||
      !(Date.parse(session.expiresAt) > Date.now())
    ) {
      return Response.json({ user: null }, { headers });
    }

    return Response.json({
      user: {
        name: session.user.name,
        avatarUrl: session.user.avatarUrl ?? null,
      },
    }, { headers });
  } catch {
    return Response.json({ user: null }, { status: 503, headers });
  }
}

export function OPTIONS(request: Request) {
  const headers = responseHeaders(request);
  if (!headers.has("Access-Control-Allow-Origin")) {
    return new Response(null, { status: 403, headers });
  }
  headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  return new Response(null, { status: 204, headers });
}
