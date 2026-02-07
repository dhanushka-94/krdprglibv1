import { Construction } from "lucide-react";

export function MaintenanceView() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/30 px-4">
      <Construction className="size-16 text-muted-foreground" />
      <h1 className="mt-6 text-2xl font-semibold text-foreground">
        Under maintenance
      </h1>
      <p className="mt-2 max-w-sm text-center text-muted-foreground">
        We are updating the site. Please check back shortly.
      </p>
    </div>
  );
}
