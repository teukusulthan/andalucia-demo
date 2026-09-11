import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";

/**
 * Who is signed in.
 *
 * The session lives behind this route rather than in the root layout on purpose: reading
 * cookies in the layout would make all 52 marketing pages dynamic. The shell stays prerendered
 * and the few session-aware parts (header, the Dispatch gate) fetch this once on mount.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await currentUser();
  return NextResponse.json(
    {
      user: user
        ? {
            name: user.preferred_name || user.name,
            email: user.email,
            role: user.role,
          }
        : null,
    },
    { headers: { "cache-control": "no-store" } },
  );
}
