"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAdminPath } from "@/lib/config";

export function AdminOnlyGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.user?.role !== "Admin") {
          router.replace(getAdminPath());
        }
      })
      .catch(() => router.replace(getAdminPath()));
  }, [router]);

  return <>{children}</>;
}
