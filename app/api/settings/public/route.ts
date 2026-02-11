import { NextResponse } from "next/server";
import { getPublicSettings } from "@/lib/site-settings";

/** Public endpoint: no auth. Returns logo, footer credits, maintenance mode. */
export async function GET() {
  try {
    const settings = await getPublicSettings();
    return NextResponse.json(settings);
  } catch (error) {
    console.error("Settings public GET:", error);
    return NextResponse.json(
      {
        system_name: "Television and Farm Broadcasting Service – All Radio Programmes Library",
        logo_url: "",
        footer_credits: "",
        maintenance_mode: false,
      },
      { status: 200 }
    );
  }
}
