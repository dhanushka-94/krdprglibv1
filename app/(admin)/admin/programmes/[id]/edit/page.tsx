"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
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
import { AudioPlayer } from "@/components/audio-player";
import type { AudioProgramme, Category, Subcategory } from "@/lib/types";

export default function EditProgrammePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [categoryId, setCategoryId] = useState<string>("");
  const [subcategoryId, setSubcategoryId] = useState<string>("");
  const [title, setTitle] = useState("");
  const [broadcastedDate, setBroadcastedDate] = useState("");
  const [repeatBroadcastedDate, setRepeatBroadcastedDate] = useState("");
  const [description, setDescription] = useState("");
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [seoKeywords, setSeoKeywords] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentAudioUrl, setCurrentAudioUrl] = useState<string | null>(null);
  const [replaceFile, setReplaceFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "saving">("idle");

  const MAX_SIZE = 100 * 1024 * 1024; // 100MB

  useEffect(() => {
    fetch(`/api/programmes/${id}`)
      .then((r) => r.json())
      .then((data: AudioProgramme & { category?: Category; subcategory?: Subcategory }) => {
        setTitle(data.title);
        setBroadcastedDate(data.broadcasted_date);
        setRepeatBroadcastedDate(data.repeat_broadcasted_date ?? "");
        setDescription(data.description ?? "");
        setCategoryId(data.category_id ?? "");
        setSubcategoryId(data.subcategory_id ?? "");
        setSeoTitle(data.seo_title ?? "");
        setSeoDescription(data.seo_description ?? "");
        setSeoKeywords(data.seo_keywords ?? "");
        setCurrentAudioUrl(data.firebase_storage_url ?? null);
      })
      .catch(() => toast.error("Failed to load programme"))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((d) => setCategories(d))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (categoryId) {
      fetch(`/api/subcategories?category_id=${categoryId}`)
        .then((r) => r.json())
        .then((d) => {
          setSubcategories(d);
          setSubcategoryId((prev) =>
            prev && d.some((s: Subcategory) => s.id === prev) ? prev : ""
          );
        })
        .catch(() => setSubcategories([]));
    } else {
      setSubcategories([]);
      setSubcategoryId("");
    }
  }, [categoryId]);

  // Live SEO auto-fill from title and description
  useEffect(() => {
    setSeoTitle(title);
    setSeoDescription(description.slice(0, 160));
    setSeoKeywords(description.split(/\s+/).filter(Boolean).join(","));
  }, [title, description]);

  const onReplaceFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
    setReplaceFile(f);
  };

  const clearReplaceFile = () => {
    setReplaceFile(null);
    const fileInput = document.getElementById("replace-file") as HTMLInputElement;
    if (fileInput) fileInput.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !broadcastedDate) {
      toast.error("Title and broadcasted date are required");
      return;
    }
    if (!categoryId) {
      toast.error("Category is required");
      return;
    }

    setSubmitting(true);
    setUploadStatus("idle");
    setUploadProgress(0);

    try {
      let firebaseStoragePath: string | undefined;
      let fileSizeBytes: number | undefined;

      if (replaceFile) {
        setUploadStatus("uploading");
        const categoryName = categories.find((c) => c.id === categoryId)?.name ?? "";
        const subcategoryName = subcategories.find((s) => s.id === subcategoryId)?.name ?? "";

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
          const msg = [urlData.error, urlData.details].filter(Boolean).join(" — ") || "Failed to get upload URL";
          toast.error(msg);
          setSubmitting(false);
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
          xhr.send(replaceFile);
        });

        firebaseStoragePath = path;
        fileSizeBytes = replaceFile.size;
        setUploadProgress(100);
      }

      setUploadStatus("saving");

      const body: Record<string, unknown> = {
        title: title.trim(),
        broadcasted_date: broadcastedDate,
        repeat_broadcasted_date: repeatBroadcastedDate || null,
        description: description.trim() || null,
        category_id: categoryId || null,
        subcategory_id: subcategoryId || null,
        seo_title: seoTitle.trim() || null,
        seo_description: seoDescription.trim() || null,
        seo_keywords: seoKeywords.trim() || null,
      };
      if (firebaseStoragePath) body.firebase_storage_path = firebaseStoragePath;
      if (fileSizeBytes !== undefined) body.file_size_bytes = fileSizeBytes;

      const res = await fetch(`/api/programmes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(replaceFile ? "Programme and audio updated" : "Programme updated");
        router.push(`/programmes/${data.slug}`);
      } else toast.error(data.error || "Failed to update");
    } catch {
      toast.error("An error occurred");
    } finally {
      setSubmitting(false);
      setUploadStatus("idle");
      setUploadProgress(0);
    }
  };

  if (loading) return <div className="p-4 sm:p-6 lg:p-8">Loading...</div>;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <h1 className="mb-8 text-3xl font-bold">Edit Programme</h1>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Edit Audio Programme</CardTitle>
          <p className="text-sm text-muted-foreground">
            Update metadata or replace the audio file.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-2">
              <Label>Current audio</Label>
              {currentAudioUrl ? (
                <AudioPlayer src={currentAudioUrl} className="max-w-lg" />
              ) : (
                <p className="text-sm text-muted-foreground">No audio</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="replace-file">Replace audio file</Label>
              <Input
                id="replace-file"
                type="file"
                accept=".mp3,audio/mpeg"
                onChange={onReplaceFileChange}
              />
              {replaceFile && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">
                    {replaceFile.name} ({(replaceFile.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                  <Button type="button" variant="ghost" size="sm" onClick={clearReplaceFile}>
                    Clear
                  </Button>
                </div>
              )}
              <p className="text-xs text-muted-foreground">MP3 only, max 100MB. Leave empty to keep current audio.</p>
            </div>

            {submitting && (uploadStatus === "uploading" || uploadStatus === "saving") && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {uploadStatus === "uploading" ? "Uploading new audio..." : "Saving..."}
                  </span>
                  <span className="font-medium">{uploadStatus === "saving" ? 100 : uploadProgress}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${uploadStatus === "saving" ? 100 : uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

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
              <Label>Category *</Label>
              <Select
                value={categoryId || "__none__"}
                onValueChange={(v) => setCategoryId(v === "__none__" ? "" : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category (required)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {categories.map((c) => (
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
                  {subcategories.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
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

            <div className="flex gap-4">
              <Button type="submit" disabled={submitting}>
                {submitting ? "Saving..." : "Save"}
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
