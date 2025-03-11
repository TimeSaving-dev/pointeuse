import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const token = await getToken({ 
    req, 
    secret: process.env.NEXTAUTH_SECRET,
    secureCookie: process.env.SECURE_COOKIES === "true"
  });
  
  return NextResponse.json({
    token,
    timestamp: new Date().toISOString(),
    headers: {
      host: req.headers.get("host"),
      protocol: req.headers.get("x-forwarded-proto"),
      cookie: req.headers.get("cookie")?.substring(0, 100) + "..."
    }
  });
} 