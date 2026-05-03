import { NextRequest } from "next/server";
import { getAdminAuth } from "@/lib/firebase/admin";

export async function verifyRequest(request: NextRequest) {
  const header = request.headers.get("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : null;

  if (!token) {
    throw new Error("Missing Authorization bearer token.");
  }

  return getAdminAuth().verifyIdToken(token);
}
