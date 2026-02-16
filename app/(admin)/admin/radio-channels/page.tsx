"use client";

import { useEffect, useState, useRef } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Pencil, Trash2, Radio } from "lucide-react";
import type { RadioChannel } from "@/lib/types";
import { AdminOnlyGuard } from "@/components/admin-only-guard";

export default function RadioChannelsPage() {
  return (
    <AdminOnlyGuard>
      <RadioChannelsContent />
    </AdminOnlyGuard>
  );
}

function RadioChannelsContent() {
  const [channels, setChannels] = useState<RadioChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<RadioChannel | null>(null);
  const [name, setName] = useState("");
  const [frequency, setFrequency] = useState("");
  const [frequency2, setFrequency2] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [streamUrl, setStreamUrl] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const createLogoInputRef = useRef<HTMLInputElement>(null);

  const fetchChannels = async () => {
    try {
      const res = await fetch("/api/radio-channels");
      const data = await res.json();
      if (res.ok) setChannels(data);
      else toast.error(data.error || "Failed to fetch");
    } catch {
      toast.error("Failed to fetch radio channels");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChannels();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setName("");
    setFrequency("");
    setFrequency2("");
    setLogoUrl("");
    setStreamUrl("");
    setDescription("");
    setDialogOpen(true);
  };

  const openEdit = (c: RadioChannel) => {
    setEditing(c);
    setName(c.name);
    setFrequency(c.frequency ?? "");
    setFrequency2(c.frequency_2 ?? "");
    setLogoUrl(c.logo_url ?? "");
    setStreamUrl(c.stream_url ?? "");
    setDescription(c.description ?? "");
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        frequency: frequency.trim() || null,
        frequency_2: frequency2.trim() || null,
        logo_url: logoUrl.trim() || null,
        stream_url: streamUrl.trim() || null,
        description: description.trim() || null,
      };
      const url = editing ? `/api/radio-channels/${editing.id}` : "/api/radio-channels";
      const method = editing ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to save");
        return;
      }
      const channelId = data.id as string;
      const logoFile = !editing && createLogoInputRef.current?.files?.[0];
      if (logoFile && channelId) {
        setUploadingLogo(true);
        try {
          const formData = new FormData();
          formData.set("file", logoFile);
          formData.set("channel_id", channelId);
          const upRes = await fetch("/api/radio-channels/upload-logo", {
            method: "POST",
            body: formData,
          });
          const upData = await upRes.json();
          if (upRes.ok && upData.url) {
            await fetch(`/api/radio-channels/${channelId}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({ logo_url: upData.url }),
            });
          }
        } finally {
          setUploadingLogo(false);
          createLogoInputRef.current!.value = "";
        }
      }
      toast.success(editing ? "Radio channel updated" : "Radio channel created");
      setDialogOpen(false);
      fetchChannels();
    } catch {
      toast.error("Failed to save");
    } finally {
      setSubmitting(false);
    }
  };

  const uploadLogoForChannel = async (channelId: string, file: File) => {
    setUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.set("file", file);
      formData.set("channel_id", channelId);
      const res = await fetch("/api/radio-channels/upload-logo", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok && data.url) {
        const patchRes = await fetch(`/api/radio-channels/${channelId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ logo_url: data.url }),
        });
        if (patchRes.ok) {
          setChannels((prev) =>
            prev.map((c) => (c.id === channelId ? { ...c, logo_url: data.url } : c))
          );
          if (editing?.id === channelId) setLogoUrl(data.url);
          toast.success("Logo uploaded and saved");
          return true;
        }
      }
      toast.error(data.error || "Upload failed");
      return false;
    } catch {
      toast.error("Upload failed");
      return false;
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleLogoUpload = async () => {
    if (!editing?.id) return;
    const input = logoInputRef.current;
    if (!input?.files?.length) return;
    await uploadLogoForChannel(editing.id, input.files[0]);
    input.value = "";
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this radio channel? Programmes using it will have the channel cleared."))
      return;
    try {
      const res = await fetch(`/api/radio-channels/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        toast.success("Radio channel deleted");
        fetchChannels();
      } else toast.error(data.error || "Failed to delete");
    } catch {
      toast.error("Failed to delete");
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="flex items-center gap-2 text-3xl font-bold">
          <Radio className="size-8" />
          Radio Channels
        </h1>
        <Button onClick={openCreate}>
          <Plus className="mr-2 size-4" />
          Add Channel
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Radio Channels</CardTitle>
          <p className="text-sm text-muted-foreground">
            Manage radio channels. Assign a channel to each programme so the front shows which channel broadcast it (name, frequency, logo).
          </p>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[60px]">Logo</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Frequency 1</TableHead>
                    <TableHead>Frequency 2</TableHead>
                    <TableHead className="w-[120px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {channels.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>
                        {c.logo_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={c.logo_url}
                            alt=""
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
                            <Radio className="size-5" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell>{c.name}</TableCell>
                      <TableCell className="text-muted-foreground">{c.frequency || "—"}</TableCell>
                      <TableCell className="text-muted-foreground">{c.frequency_2 || "—"}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(c)}>
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(c.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Radio Channel" : "Add Radio Channel"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="rc-name">Name</Label>
                <Input
                  id="rc-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Sri Lanka Broadcasting Corporation"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="rc-frequency">Frequency 1</Label>
                <Input
                  id="rc-frequency"
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value)}
                  placeholder="e.g. 99.5 MHz"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="rc-frequency2">Frequency 2</Label>
                <Input
                  id="rc-frequency2"
                  value={frequency2}
                  onChange={(e) => setFrequency2(e.target.value)}
                  placeholder="e.g. 101.2 MHz"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="rc-stream">Stream URL</Label>
                <Input
                  id="rc-stream"
                  type="url"
                  value={streamUrl}
                  onChange={(e) => setStreamUrl(e.target.value)}
                  placeholder="e.g. http://220.247.227.20:8000/kandystream"
                />
                <p className="text-xs text-muted-foreground">Web streaming URL for live listen (optional)</p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="rc-description">Description</Label>
                <Textarea
                  id="rc-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="About this channel (shown on the listen page)"
                  rows={3}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground">Optional. Displayed on the radio player page.</p>
              </div>
              <div className="grid gap-2">
                <Label>Logo</Label>
                {editing ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                      className="hidden"
                      onChange={handleLogoUpload}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => logoInputRef.current?.click()}
                      disabled={uploadingLogo}
                    >
                      {uploadingLogo ? "Uploading…" : "Upload logo"}
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      ref={createLogoInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                      className="w-full text-sm"
                    />
                    <p className="text-xs text-muted-foreground">Optional. Upload after creating, or set a URL below.</p>
                  </div>
                )}
                <Input
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="Logo URL (or upload above)"
                />
                {logoUrl && (
                  <div className="flex items-center gap-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={logoUrl}
                      alt=""
                      className="h-12 w-12 rounded-full object-cover"
                    />
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Saving..." : editing ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
