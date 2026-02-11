"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const MAX_SIZE = 100 * 1024 * 1024; // 100MB

type LogEntry = { step: string; status: "pending" | "success" | "error"; message: string };

export default function UploadTestPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const addLog = (step: string, status: LogEntry["status"], message: string) => {
    setLogs((prev) => [...prev, { step, status, message }]);
  };

  const runTest = async () => {
    if (!file) {
      toast.error("Select an MP3 file first");
      return;
    }

    setUploading(true);
    setLogs([]);

    try {
      // Step 1: Get signed upload URL
      addLog("1. Request signed URL", "pending", "Calling /api/upload/request-url...");
      const urlRes = await fetch("/api/upload/request-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          category_name: "Test",
          subcategory_name: "Test",
          broadcasted_date: new Date().toISOString().slice(0, 10),
        }),
      });
      const urlData = await urlRes.json();

      if (!urlRes.ok || urlData.error) {
        addLog(
          "1. Request signed URL",
          "error",
          urlData.error
            ? [urlData.error, urlData.details].filter(Boolean).join(" — ")
            : `HTTP ${urlRes.status}`
        );
        setUploading(false);
        toast.error("Failed to get upload URL");
        return;
      }

      addLog("1. Request signed URL", "success", `Got URL, path: ${urlData.path}`);
      const { uploadUrl, path } = urlData;

      // Step 2: PUT file to Firebase Storage
      addLog("2. PUT to Firebase Storage", "pending", "Uploading file via XHR...");

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            setProgress(Math.round((event.loaded / event.total) * 100));
          } else {
            setProgress((p) => Math.min(p + 10, 90));
          }
        };

        xhr.onload = () => {
          setProgress(100);
          if (xhr.status >= 200 && xhr.status < 300) {
            addLog("2. PUT to Firebase Storage", "success", `Upload complete (${xhr.status})`);
            resolve();
          } else {
            addLog(
              "2. PUT to Firebase Storage",
              "error",
              `HTTP ${xhr.status}: ${xhr.statusText || xhr.responseText || "No response"}`
            );
            reject(new Error(`Upload failed: ${xhr.status}`));
          }
        };

        xhr.onerror = () => {
          addLog(
            "2. PUT to Firebase Storage",
            "error",
            "Network/CORS error. Check browser DevTools Console and Firebase Storage CORS config."
          );
          reject(new Error("Upload failed"));
        };

        xhr.ontimeout = () => {
          addLog("2. PUT to Firebase Storage", "error", "Request timed out");
          reject(new Error("Upload timed out"));
        };

        xhr.open("PUT", uploadUrl);
        xhr.setRequestHeader("Content-Type", "audio/mpeg");
        xhr.send(file);
      });

      toast.success("Upload test passed");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      if (!logs.some((l) => l.step === "2. PUT to Firebase Storage" && l.status === "error")) {
        addLog("2. PUT to Firebase Storage", "error", msg);
      }
      toast.error(msg);
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.name.toLowerCase().endsWith(".mp3")) {
      toast.error("Only .mp3 files are allowed");
      return;
    }
    if (f.size > MAX_SIZE) {
      toast.error("File must be under 100MB");
      return;
    }
    setFile(f);
  };

  const checkConfig = async () => {
    try {
      const r = await fetch("/api/upload/check-config", { credentials: "include" });
      const d = await r.json();
      const line = d.ok ? "Upload is configured." : d.reason;
      const debug = d.debug
        ? ` (env: ${d.debug.envSet}, parse: ${d.debug.parseOk}, project_id: ${d.debug.hasProjectId}, private_key: ${d.debug.hasPrivateKey}, init: ${d.debug.initOk})`
        : "";
      toast.info(line + debug);
    } catch {
      toast.error("Could not check config");
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <h1 className="mb-8 text-3xl font-bold">Upload Test</h1>
      <p className="mb-6 text-muted-foreground">
        Test MP3 upload to Firebase Storage (request-url + PUT). Use this to debug upload issues.
      </p>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Test MP3 Upload</CardTitle>
          <p className="text-sm text-muted-foreground">
            Select an MP3 file and click Test Upload. The page will show each step and any errors.
          </p>
          <Button variant="outline" size="sm" className="mt-2 w-fit" onClick={checkConfig}>
            Check upload config
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="file">MP3 File</Label>
            <Input
              id="file"
              type="file"
              accept=".mp3,audio/mpeg"
              onChange={onFileChange}
              disabled={uploading}
            />
            {file && (
              <p className="text-sm text-muted-foreground">
                {file.name} ({(file.size / 1024).toFixed(1)} KB)
              </p>
            )}
          </div>

          <Button onClick={runTest} disabled={!file || uploading}>
            {uploading ? `Testing... ${progress}%` : "Test Upload"}
          </Button>

          {uploading && (
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}

          {logs.length > 0 && (
            <div className="mt-6 space-y-2 rounded-lg border border-border bg-muted/30 p-4">
              <h3 className="text-sm font-medium">Log</h3>
              {logs.map((log, i) => (
                <div
                  key={i}
                  className={`flex items-start gap-2 text-sm ${
                    log.status === "success"
                      ? "text-green-600 dark:text-green-400"
                      : log.status === "error"
                        ? "text-destructive"
                        : "text-muted-foreground"
                  }`}
                >
                  <span className="shrink-0 font-mono">[{log.step}]</span>
                  <span className="break-all">{log.message}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
