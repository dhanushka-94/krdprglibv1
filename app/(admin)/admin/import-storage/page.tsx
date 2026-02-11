"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { slugify } from "@/lib/validations";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/date-picker";
import { getAdminPath } from "@/lib/config";
import { Play, Pencil, RefreshCw, ChevronLeft, ChevronRight, Search, Settings } from "lucide-react";
import { AudioPlayer } from "@/components/audio-player";
import type { Category, Subcategory } from "@/lib/types";

interface StorageFile {
  path: string;
  name: string;
  url: string;
  existing: { id: string; title: string; broadcasted_date: string } | null;
}

export default function ImportStoragePage() {
  return <ImportStorageGuard />;
}

function ImportStorageGuard() {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setRole(data?.user?.role ?? null))
      .catch(() => setRole(null))
      .finally(() => setAuthChecked(true));
  }, []);

  useEffect(() => {
    fetch("/api/settings", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => setEnabled(data.import_storage_enabled !== false))
      .catch(() => setEnabled(true));
  }, []);

  if (!authChecked || enabled === null) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!role || (role !== "Admin" && role !== "Programme Manager")) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-4 sm:p-8">
        <p className="text-center text-muted-foreground">
          This page is only available to Admin and Programme Manager roles.
        </p>
        <Button asChild variant="outline">
          <Link href={getAdminPath("programmes")}>
            Back to Manage Programmes
          </Link>
        </Button>
      </div>
    );
  }

  if (!enabled) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-4 sm:p-8">
        <p className="text-center text-muted-foreground">
          Import from Storage is currently disabled.
        </p>
        <Button asChild variant="outline">
          <Link href={`${getAdminPath("settings")}`}>
            <Settings className="mr-2 size-4" />
            Go to Settings
          </Link>
        </Button>
      </div>
    );
  }

  return <ImportStorageContent />;
}

const PAGE_SIZE = 10;

interface Stats {
  total: number;
  published: number;
  remaining: number;
}

function ImportStorageContent() {
  const [files, setFiles] = useState<StorageFile[]>([]);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [pageToken, setPageToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFile, setEditingFile] = useState<StorageFile | null>(null);
  const [title, setTitle] = useState("");
  const [broadcastedDate, setBroadcastedDate] = useState("");
  const [repeatBroadcastedDate, setRepeatBroadcastedDate] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [subcategoryId, setSubcategoryId] = useState<string>("");
  const [description, setDescription] = useState("");
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [seoKeywords, setSeoKeywords] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [playingUrl, setPlayingUrl] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "unpublished">("all");
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [searchResults, setSearchResults] = useState<StorageFile[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchProgress, setSearchProgress] = useState(0);
  const [searchStatus, setSearchStatus] = useState("");

  const runServerSearch = async () => {
    const q = searchQuery.trim();
    if (!q) {
      toast.error("Enter a search term");
      return;
    }
    setSearching(true);
    setSearchProgress(0);
    setSearchStatus("Connecting...");
    try {
      const res = await fetch(`/api/storage/search?q=${encodeURIComponent(q)}`, { credentials: "include" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || "Search failed");
        setSearching(false);
        return;
      }
      const reader = res.body?.getReader();
      if (!reader) {
        toast.error("Search failed");
        setSearching(false);
        return;
      }
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const msg = JSON.parse(line) as {
              type: string;
              scanned?: number;
              found?: number;
              percent?: number;
              items?: StorageFile[];
              totalScanned?: number;
              totalFound?: number;
              error?: string;
            };
            if (msg.type === "progress") {
              setSearchProgress(msg.percent ?? 0);
              setSearchStatus(`Scanned ${msg.scanned ?? 0} files, found ${msg.found ?? 0} matches`);
            } else if (msg.type === "done") {
              setSearchProgress(100);
              setSearchStatus(`Search complete: ${msg.totalFound ?? 0} of ${msg.totalScanned ?? 0} files`);
              setSearchResults(msg.items ?? []);
              setIsSearchMode(true);
            } else if (msg.type === "error") {
              toast.error(msg.error || "Search failed");
            }
          } catch {
            /* skip malformed lines */
          }
        }
      }
    } catch {
      toast.error("Search failed");
    } finally {
      setSearching(false);
    }
  };

  const clearSearch = () => {
    setIsSearchMode(false);
    setSearchResults([]);
    setSearchQuery("");
    setSearchProgress(0);
    setSearchStatus("");
  };

  const fetchFiles = async (token?: string | null) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: String(PAGE_SIZE) });
      if (token) params.set("pageToken", token);
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);
      const res = await fetch(`/api/storage/list?${params}`, {
        credentials: "include",
        signal: controller.signal,
      });
      clearTimeout(timeout);
      const data = await res.json();
      if (res.ok) {
        setFiles(data.items ?? []);
        setNextPageToken(data.nextPageToken ?? null);
      } else {
        toast.error(data.details || data.error || "Failed to load files");
      }
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") {
        toast.error("Request timed out.");
      } else {
        toast.error("Failed to load files");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = () => {
    fetch("/api/storage/stats", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        if (d.total !== undefined) setStats({ total: d.total, published: d.published, remaining: d.remaining });
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchFiles(pageToken);
  }, [pageToken]);

  useEffect(() => {
    fetchStats();
  }, []);

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
        .then((d) => setSubcategories(d))
        .catch(() => setSubcategories([]));
      setSubcategoryId("");
    } else {
      setSubcategories([]);
      setSubcategoryId("");
    }
  }, [categoryId]);

  // Live SEO auto-fill from title and description (when dialog is open)
  useEffect(() => {
    if (dialogOpen) {
      setSeoTitle(title);
      setSeoDescription(description.slice(0, 160));
      setSeoKeywords(description.split(/\s+/).filter(Boolean).join(","));
    }
  }, [dialogOpen, title, description]);

  const openEdit = (file: StorageFile) => {
    setEditingFile(file);
    if (file.existing) {
      fetch(`/api/programmes/${file.existing.id}`)
        .then((r) => r.json())
        .then((prog) => {
          setTitle(prog.title ?? "");
          setBroadcastedDate(prog.broadcasted_date ?? "");
          setRepeatBroadcastedDate(prog.repeat_broadcasted_date ?? "");
          setCategoryId(prog.category_id ?? "");
          setSubcategoryId(prog.subcategory_id ?? "");
          setDescription(prog.description ?? "");
          setSeoTitle(prog.seo_title ?? "");
          setSeoDescription(prog.seo_description ?? "");
          setSeoKeywords(prog.seo_keywords ?? "");
        })
        .catch(() => {
          setTitle("");
          setBroadcastedDate("");
          setRepeatBroadcastedDate("");
          setCategoryId("");
          setSubcategoryId("");
          setDescription("");
          setSeoTitle("");
          setSeoDescription("");
          setSeoKeywords("");
        });
    } else {
      setTitle("");
      setBroadcastedDate("");
      setCategoryId("");
      setSubcategoryId("");
      setDescription("");
      setSeoTitle("");
      setSeoDescription("");
      setSeoKeywords("");
    }
    setDialogOpen(true);
  };

  const displayFiles = isSearchMode ? searchResults : files;
  const filteredFiles = displayFiles.filter((f) => {
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "published" && f.existing) ||
      (statusFilter === "unpublished" && !f.existing);
    return matchesStatus;
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !broadcastedDate) {
      toast.error("Title and broadcasted date are required");
      return;
    }
    if (!editingFile) return;

    setSubmitting(true);
    try {
      if (editingFile.existing) {
        const res = await fetch(`/api/programmes/${editingFile.existing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: title.trim(),
            broadcasted_date: broadcastedDate,
            repeat_broadcasted_date: repeatBroadcastedDate || null,
            category_id: categoryId || null,
            subcategory_id: subcategoryId || null,
            description: description.trim() || null,
            seo_title: seoTitle.trim() || null,
            seo_description: seoDescription.trim() || null,
            seo_keywords: seoKeywords.trim() || null,
          }),
        });
        const data = await res.json();
        if (res.ok) {
          toast.success("Programme updated");
          setDialogOpen(false);
          if (isSearchMode) runServerSearch();
          else fetchFiles(pageToken);
          fetchStats();
        } else {
          toast.error(data.error || "Failed to update");
        }
      } else {
        const baseSlug = slugify(title);
        const slug = baseSlug ? `${baseSlug}-${Date.now().toString(36)}` : Date.now().toString(36);
        const res = await fetch("/api/programmes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: title.trim(),
            slug,
            broadcasted_date: broadcastedDate,
            repeat_broadcasted_date: repeatBroadcastedDate || null,
            category_id: categoryId || null,
            subcategory_id: subcategoryId || null,
            description: description.trim() || null,
            firebase_storage_url: editingFile.url,
            firebase_storage_path: editingFile.path,
            seo_title: seoTitle.trim() || null,
            seo_description: seoDescription.trim() || null,
            seo_keywords: seoKeywords.trim() || null,
          }),
        });
        const data = await res.json();
        if (res.ok) {
          toast.success("Programme published");
          setDialogOpen(false);
          if (isSearchMode) runServerSearch();
          else fetchFiles(pageToken);
          fetchStats();
        } else {
          toast.error(data.error || "Failed to publish");
        }
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Import from Storage</h1>
          <Button variant="outline" onClick={() => { fetchFiles(pageToken); fetchStats(); }} disabled={loading}>
            <RefreshCw className={`mr-2 size-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {stats !== null && (
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm font-medium text-muted-foreground">Total files</p>
                <p className="mt-1 text-2xl font-semibold">{stats.total}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm font-medium text-muted-foreground">Published</p>
                <p className="mt-1 text-2xl font-semibold text-green-600">{stats.published}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm font-medium text-muted-foreground">Remaining</p>
                <p className="mt-1 text-2xl font-semibold text-amber-600">{stats.remaining}</p>
              </CardContent>
            </Card>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Files in Firebase Storage</CardTitle>
            <p className="text-sm text-muted-foreground">
              Unpublished files appear first. Add metadata and publish to make them visible on the public programmes page.
            </p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search all files by filename or programme title..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), runServerSearch())}
                  className="pl-9"
                  disabled={searching}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={runServerSearch} disabled={searching || !searchQuery.trim()}>
                  {searching ? (
                    <>
                      <RefreshCw className="mr-2 size-4 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search className="mr-2 size-4" />
                      Search
                    </>
                  )}
                </Button>
                {isSearchMode && (
                  <Button variant="outline" onClick={clearSearch} disabled={searching}>
                    Back to list
                  </Button>
                )}
              </div>
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="published">Published only</SelectItem>
                  <SelectItem value="unpublished">Not linked only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {searching && (
              <div className="mt-4 space-y-2">
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${searchProgress}%` }}
                  />
                </div>
                <p className="text-sm text-muted-foreground">{searchStatus}</p>
              </div>
            )}
          </CardHeader>
          <CardContent>
            {searching ? (
              <div className="flex flex-col items-center gap-4 py-12 text-muted-foreground">
                <RefreshCw className="size-8 animate-spin" />
                <span>Searching all files in storage...</span>
              </div>
            ) : loading && !isSearchMode ? (
              <div className="flex items-center gap-2 py-12 text-muted-foreground">
                <RefreshCw className="size-5 animate-spin" />
                <span>Loading...</span>
              </div>
            ) : !isSearchMode && files.length === 0 ? (
              <p className="py-12 text-center text-muted-foreground">No audio files found in storage.</p>
            ) : isSearchMode && searchResults.length === 0 ? (
              <p className="py-12 text-center text-muted-foreground">
                No files match your search. Try a different query.
              </p>
            ) : filteredFiles.length === 0 ? (
              <p className="py-12 text-center text-muted-foreground">
                No files match the current filter. Try a different status filter.
              </p>
            ) : (
              <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Filename</TableHead>
                    <TableHead className="w-[72px]">Play</TableHead>
                    <TableHead className="w-[100px]">Status</TableHead>
                    <TableHead className="w-[80px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFiles.map((f) => (
                    <TableRow key={f.path} className={f.existing ? "bg-muted/30" : ""}>
                      <TableCell className="font-mono text-sm">{f.name}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-9"
                          onClick={() => setPlayingUrl(playingUrl === f.url ? null : f.url)}
                          title="Play"
                        >
                          <Play className="size-4" />
                        </Button>
                      </TableCell>
                      <TableCell>
                        {f.existing ? (
                          <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400">
                            Published
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                            Not linked
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className="size-9" onClick={() => openEdit(f)} title="Edit / Publish">
                          <Pencil className="size-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
            )}

            {!loading && !searching && !isSearchMode && (files.length > 0 || pageToken) && (
              <div className="mt-4 flex items-center justify-between border-t pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!pageToken}
                  onClick={() => setPageToken(null)}
                >
                  <ChevronLeft className="mr-1 size-4" />
                  First
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!nextPageToken}
                  onClick={() => nextPageToken && setPageToken(nextPageToken)}
                >
                  Next
                  <ChevronRight className="ml-1 size-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {playingUrl && (
          <Card className="mt-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Audio player</CardTitle>
            </CardHeader>
            <CardContent>
              <AudioPlayer src={playingUrl} autoPlay className="w-full" />
            </CardContent>
          </Card>
        )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingFile?.existing ? "Edit Programme" : "Publish Programme"}
            </DialogTitle>
          </DialogHeader>
          {editingFile && (
            <div className="mb-4 space-y-2">
              <p className="text-xs text-muted-foreground">File</p>
              <p className="font-mono text-sm">{editingFile.name}</p>
              <AudioPlayer src={editingFile.url} className="max-w-md" />
            </div>
          )}
          <form onSubmit={handleSave}>
            <div className="grid gap-4 py-4">
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
                <Label>Category</Label>
                <Select value={categoryId || "__none__"} onValueChange={(v) => setCategoryId(v === "__none__" ? "" : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category (optional)" />
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
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Programme description"
                  rows={3}
                />
              </div>
              <p className="text-sm text-muted-foreground">
                SEO fields auto-fill from title and description. Edit to override.
              </p>
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
                  placeholder="Comma-separated"
                  maxLength={255}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Saving..." : editingFile?.existing ? "Update" : "Publish"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}
