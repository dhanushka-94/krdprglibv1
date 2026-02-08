"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/date-picker";
import { slugify } from "@/lib/validations";
import type { Category, Subcategory, RadioChannel } from "@/lib/types";

const MAX_SIZE = 100 * 1024 * 1024; // 100MB

export default function UploadPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ role: string; assigned_category_ids?: string[]; assigned_subcategory_ids?: string[] } | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [radioChannels, setRadioChannels] = useState<RadioChannel[]>([]);
  const [categoryId, setCategoryId] = useState<string>("");
  const [subcategoryId, setSubcategoryId] = useState<string>("");
  const [radioChannelId, setRadioChannelId] = useState<string>("");
  const [title, setTitle] = useState("");
  const [broadcastedDate, setBroadcastedDate] = useState("");
  const [repeatBroadcastedDate, setRepeatBroadcastedDate] = useState("");
  const [description, setDescription] = useState("");
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [seoKeywords, setSeoKeywords] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "saving">("idle");

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setUser(d.user));
  }, []);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((d) => setCategories(d))
      .catch(() => toast.error("Failed to load categories"));
  }, []);

  useEffect(() => {
    if (categoryId) {
      fetch(`/api/subcategories?category_id=${categoryId}`)
        .then((r) => r.json())
        .then((d) => setSubcategories(d))
        .catch(() => setSubcategories([]));
      setSubcategoryId("");
    } else {
      setSubcategories([]);
      setSubcategoryId("");
    }
  }, [categoryId]);

  useEffect(() => {
    fetch("/api/radio-channels")
      .then((r) => r.json())
      .then((d) => setRadioChannels(d))
      .catch(() => setRadioChannels([]));
  }, []);

  // Live SEO auto-fill from title and description
  useEffect(() => {
    setSeoTitle(title);
    setSeoDescription(description.slice(0, 160));
    setSeoKeywords(description.split(/\s+/).filter(Boolean).join(","));
  }, [title, description]);

  const allowedCategoryIds = user?.role === "Admin" ? null : (user?.assigned_category_ids ?? []);
  const allowedSubcategoryIds = user?.role === "Admin" ? null : (user?.assigned_subcategory_ids ?? []);
  const filteredCategories = allowedCategoryIds === null
    ? categories
    : categories.filter((c) => allowedCategoryIds.includes(c.id));
  const filteredSubcategories = !categoryId
    ? []
    : allowedSubcategoryIds === null
      ? subcategories
      : subcategories.filter((s) => allowedSubcategoryIds.includes(s.id) || (allowedCategoryIds && allowedCategoryIds.includes(s.category_id)));

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.name.toLowerCase().endsWith(".mp3")) {
      toast.error("Only .mp3 files are allowed");
      return;
    }
    if (f.size > MAX_SIZE) {
      toast.error("File size must be under 100MB");
      return;
    }
    setFile(f);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !broadcastedDate || !file) {
      toast.error("Title, broadcasted date, and MP3 file are required");
      return;
    }

    setSubmitting(true);
    setUploadProgress(0);
    setUploadStatus("uploading");

    try {
      const categoryName = filteredCategories.find((c) => c.id === categoryId)?.name ?? "";
      const subcategoryName = filteredSubcategories.find((s) => s.id === subcategoryId)?.name ?? "";

      const urlRes = await fetch("/api/upload/request-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          category_name: categoryName,
          subcategory_name: subcategoryName,
          broadcasted_date: broadcastedDate,
        }),
      });
      const urlData = await urlRes.json();
      if (!urlRes.ok || urlData.error) {
        toast.error(urlData.error || urlData.details || "Failed to get upload URL");
        setSubmitting(false);
        setUploadStatus("idle");
        return;
      }
      const { uploadUrl, path } = urlData;

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            setUploadProgress(Math.round((event.loaded / event.total) * 100));
          } else {
            setUploadProgress((p) => Math.min(p + 10, 90));
          }
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve();
          else reject(new Error(xhr.statusText || "Upload failed"));
        };
        xhr.onerror = () => reject(new Error("Upload failed"));
        xhr.ontimeout = () => reject(new Error("Upload timed out"));
        xhr.open("PUT", uploadUrl);
        xhr.setRequestHeader("Content-Type", "audio/mpeg");
        xhr.send(file);
      });

      setUploadProgress(100);
      setUploadStatus("saving");

      const baseSlug = slugify(title);
      const slug = baseSlug ? `${baseSlug}-${Date.now().toString(36)}` : Date.now().toString(36);

      const progRes = await fetch("/api/programmes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: title.trim(),
          slug,
          broadcasted_date: broadcastedDate,
          repeat_broadcasted_date: repeatBroadcastedDate || null,
          description: description.trim() || null,
          category_id: categoryId || null,
          subcategory_id: subcategoryId || null,
          radio_channel_id: radioChannelId || null,
          firebase_storage_path: path,
          file_size_bytes: file.size,
          seo_title: seoTitle.trim() || null,
          seo_description: seoDescription.trim() || null,
          seo_keywords: seoKeywords.trim() || null,
        }),
      });

      const progData = await progRes.json();
      if (progRes.ok) {
        toast.success("Programme uploaded");
        router.push(`/programmes/${progData.slug}`);
      } else toast.error(progData.error || "Failed to save programme");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSubmitting(false);
      setUploadStatus("idle");
      setUploadProgress(0);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <h1 className="mb-8 text-3xl font-bold">Upload Programme</h1>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>New Audio Programme</CardTitle>
          <p className="text-sm text-muted-foreground">
            MP3 only, max 100MB. All metadata is saved to Supabase.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-2">
              <Label htmlFor="file">MP3 File *</Label>
              <Input
                id="file"
                type="file"
                accept=".mp3,audio/mpeg"
                onChange={onFileChange}
              />
              {file && (
                <p className="text-sm text-muted-foreground">
                  {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Programme title"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label>Broadcasted Date *</Label>
              <DatePicker
                value={broadcastedDate}
                onChange={setBroadcastedDate}
                placeholder="Select date"
              />
            </div>

            <div className="grid gap-2">
              <Label>Repeat Broadcasted Date</Label>
              <DatePicker
                value={repeatBroadcastedDate}
                onChange={setRepeatBroadcastedDate}
                placeholder="Select date (optional)"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Programme description"
                rows={4}
              />
            </div>

            <div className="grid gap-2">
              <Label>Category</Label>
              <Select value={categoryId || "__none__"} onValueChange={(v) => { setCategoryId(v === "__none__" ? "" : v); setSubcategoryId(""); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {filteredCategories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Subcategory</Label>
              <Select
                value={subcategoryId || "__none__"}
                onValueChange={(v) => setSubcategoryId(v === "__none__" ? "" : v)}
                disabled={!categoryId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select subcategory (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {filteredSubcategories.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Broadcasted Radio Channel</Label>
              <Select
                value={radioChannelId || "__none__"}
                onValueChange={(v) => setRadioChannelId(v === "__none__" ? "" : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select channel (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {radioChannels.map((ch) => (
                    <SelectItem key={ch.id} value={ch.id}>
                      {ch.name}
                      {[ch.frequency, ch.frequency_2].filter(Boolean).length > 0
                        ? ` (${[ch.frequency, ch.frequency_2].filter(Boolean).join(" / ")})`
                        : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="border-t pt-6">
              <h3 className="mb-4 font-medium">SEO</h3>
              <p className="mb-4 text-sm text-muted-foreground">
                Auto-filled from title and description. Edit to override.
              </p>
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="seo_title">SEO Title</Label>
                  <Input
                    id="seo_title"
                    value={seoTitle}
                    onChange={(e) => setSeoTitle(e.target.value)}
                    placeholder="Max 70 chars"
                    maxLength={70}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="seo_description">SEO Description</Label>
                  <Textarea
                    id="seo_description"
                    value={seoDescription}
                    onChange={(e) => setSeoDescription(e.target.value)}
                    placeholder="Max 160 chars"
                    maxLength={160}
                    rows={2}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="seo_keywords">SEO Keywords</Label>
                  <Input
                    id="seo_keywords"
                    value={seoKeywords}
                    onChange={(e) => setSeoKeywords(e.target.value)}
                    placeholder="Comma-separated keywords"
                    maxLength={255}
                  />
                </div>
              </div>
            </div>

            {submitting && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {uploadStatus === "uploading" ? "Uploading file..." : "Saving programme..."}
                  </span>
                  <span className="font-medium">{uploadProgress}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${uploadStatus === "saving" ? 100 : uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            <div className="flex gap-4">
              <Button type="submit" disabled={submitting}>
                {submitting ? (uploadStatus === "saving" ? "Saving..." : "Uploading...") : "Upload"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
