import { supabase } from "@/lib/supabase";

export type ActivityAction =
  | "login"
  | "logout"
  | "programme_upload"
  | "programme_create"
  | "programme_update"
  | "programme_delete"
  | "programme_import"
  | "category_create"
  | "category_update"
  | "category_delete"
  | "subcategory_create"
  | "subcategory_update"
  | "subcategory_delete"
  | "user_create"
  | "user_update"
  | "user_delete"
  | "settings_update";

export interface ActivityLogParams {
  userId?: string | null;
  userEmail?: string | null;
  userRole?: string | null;
  action: ActivityAction;
  entityType?: string | null;
  entityId?: string | null;
  entityTitle?: string | null;
  details?: Record<string, unknown> | null;
  request?: Request | null;
}

function getClientInfo(request?: Request | null) {
  if (!request) return { ip: null, userAgent: null };
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() ?? request.headers.get("x-real-ip") ?? null;
  const userAgent = request.headers.get("user-agent") ?? null;
  return { ip, userAgent };
}

export async function logActivity(params: ActivityLogParams): Promise<void> {
  try {
    const { ip, userAgent } = getClientInfo(params.request);
    await supabase.from("activity_logs").insert({
      user_id: params.userId ?? null,
      user_email: params.userEmail ?? null,
      user_role: params.userRole ?? null,
      action: params.action,
      entity_type: params.entityType ?? null,
      entity_id: params.entityId ?? null,
      entity_title: params.entityTitle ?? null,
      details: params.details ?? null,
      ip_address: ip,
      user_agent: userAgent,
    });
  } catch (err) {
    console.error("Activity log error:", err);
  }
}
