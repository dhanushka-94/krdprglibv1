"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Settings, Image, Construction, Upload } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function SettingsPage() {
  const [importStorageEnabled, setImportStorageEnabled] = useState(true);
  const [systemName, setSystemName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [footerCredits, setFooterCredits] = useState("");
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/settings", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (data.import_storage_enabled !== undefined) setImportStorageEnabled(data.import_storage_enabled);
        if (data.system_name !== undefined) setSystemName(data.system_name || "");
        if (data.logo_url !== undefined) setLogoUrl(data.logo_url || "");
        if (data.footer_credits !== undefined) setFooterCredits(data.footer_credits || "");
        if (data.maintenance_mode !== undefined) setMaintenanceMode(data.maintenance_mode);
      })
      .catch(() => toast.error("Failed to load settings"))
      .finally(() => setLoading(false));
  }, []);

  const handleImportStorageChange = async (value: string) => {
    const checked = value === "enabled";
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ import_storage_enabled: checked }),
      });
      const data = await res.json();
      if (res.ok) {
        setImportStorageEnabled(data.import_storage_enabled);
        toast.success(checked ? "Import from Storage enabled" : "Import from Storage disabled");
      } else toast.error(data.error || "Failed to update");
    } catch {
      toast.error("Failed to update settings");
    } finally {
      setSaving(false);
    }
  };

  const handleBrandingSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          system_name: systemName.trim(),
          logo_url: logoUrl.trim(),
          footer_credits: footerCredits.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        if (data.system_name !== undefined) setSystemName(data.system_name || "");
        if (data.logo_url !== undefined) setLogoUrl(data.logo_url || "");
        if (data.footer_credits !== undefined) setFooterCredits(data.footer_credits || "");
        toast.success("Branding and footer saved");
      } else toast.error(data.error || "Failed to update");
    } catch {
      toast.error("Failed to update settings");
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image (PNG, JPG, SVG, ICO, WebP)");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Logo must be under 2MB");
      return;
    }
    setUploadingLogo(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("type", "logo");
      const res = await fetch("/api/settings/upload-branding", {
        method: "POST",
        credentials: "include",
        body: form,
      });
      const data = await res.json();
      if (res.ok && data.url) {
        setLogoUrl(data.url);
        toast.success("Logo uploaded. Click Save to apply.");
      } else {
        toast.error(data.error || "Upload failed");
      }
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploadingLogo(false);
      e.target.value = "";
    }
  };

  const handleMaintenanceChange = async (value: string) => {
    const on = value === "on";
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ maintenance_mode: on }),
      });
      const data = await res.json();
      if (res.ok) {
        setMaintenanceMode(data.maintenance_mode);
        toast.success(on ? "Maintenance mode ON – public sees maintenance page" : "Maintenance mode OFF – public site is live");
      } else toast.error(data.error || "Failed to update");
    } catch {
      toast.error("Failed to update settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <h1 className="mb-8 flex items-center gap-2 text-3xl font-bold">
        <Settings className="size-8" />
        Settings
      </h1>

      <div className="max-w-2xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Image className="size-5" />
              Branding &amp; footer
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              System name and logo appear in the admin and public headers. Upload logo (max 2MB) or paste URL. Footer supports <code className="rounded bg-muted px-1">{"{year}"}</code>. Favicon is set to <code className="rounded bg-muted px-1">/favicon.ico</code> (public/favicon.ico).
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="system_name">System name</Label>
              <Input
                id="system_name"
                value={systemName}
                onChange={(e) => setSystemName(e.target.value)}
                placeholder="Television and Farm Broadcasting Service – All Radio Programmes Library"
              />
            </div>

            <div className="space-y-2">
              <Label>Logo</Label>
              <div className="flex flex-wrap items-center gap-3">
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/x-icon,image/webp"
                  className="hidden"
                  ref={logoInputRef}
                  onChange={handleLogoUpload}
                  disabled={uploadingLogo}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => logoInputRef.current?.click()}
                  disabled={uploadingLogo}
                >
                  <Upload className="mr-1.5 size-4" />
                  {uploadingLogo ? "Uploading…" : "Upload logo"}
                </Button>
              </div>
              <Input
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="Or paste logo URL"
                className="mt-1"
              />
              {logoUrl && (
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Preview:</span>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={logoUrl} alt="Logo preview" className="h-8 w-auto max-w-[120px] object-contain border rounded" />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="footer_credits">Footer credits</Label>
              <Textarea
                id="footer_credits"
                value={footerCredits}
                onChange={(e) => setFooterCredits(e.target.value)}
                placeholder="© {year} Your Organization"
                rows={2}
              />
            </div>
            <Button onClick={handleBrandingSave} disabled={loading || saving}>
              Save branding &amp; footer
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Construction className="size-5" />
              Public access – maintenance mode
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              When ON, the public site shows a maintenance page instead of programmes. Admin stays accessible.
            </p>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <Label htmlFor="maintenance" className="text-base">Maintenance mode</Label>
                <p className="text-sm text-muted-foreground">Show maintenance page to visitors</p>
              </div>
              <Select
                value={maintenanceMode ? "on" : "off"}
                onValueChange={handleMaintenanceChange}
                disabled={loading || saving}
              >
                <SelectTrigger id="maintenance" className="w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="off">OFF</SelectItem>
                  <SelectItem value="on">ON</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Features</CardTitle>
            <p className="text-sm text-muted-foreground">Enable or disable admin features.</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="import-storage" className="text-base">Import from Storage</Label>
                <p className="text-sm text-muted-foreground">
                  Show the Import from Storage menu and allow importing MP3 files from Firebase Storage.
                </p>
              </div>
              <Select
                value={importStorageEnabled ? "enabled" : "disabled"}
                onValueChange={handleImportStorageChange}
                disabled={loading || saving}
              >
                <SelectTrigger id="import-storage" className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="enabled">Enable</SelectItem>
                  <SelectItem value="disabled">Disable</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Configuration</CardTitle>
            <p className="text-sm text-muted-foreground">Environment and runtime configuration.</p>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Admin path and other sensitive settings are managed via environment variables (.env) and require a restart to apply.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
