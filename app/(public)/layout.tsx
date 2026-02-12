import { getPublicSettings } from "@/lib/site-settings";
import { MaintenanceView } from "@/components/maintenance-view";
import { PublicLayoutClient } from "@/components/public-layout-client";

export const dynamic = "force-dynamic";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getPublicSettings();

  if (settings.maintenance_mode) {
    return <MaintenanceView />;
  }

  return (
    <PublicLayoutClient
      systemName={settings.system_name}
      logoUrl={settings.logo_url}
    >
      {children}
    </PublicLayoutClient>
  );
}
