import type { NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: ["/studio/:path*", "/factory/:path*", "/FACTORY/:path*", "/shop/:path*", "/auth/:path*"],
};
