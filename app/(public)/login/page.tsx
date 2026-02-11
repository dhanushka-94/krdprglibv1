"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import Link from "next/link";
import { HelpCircle, ArrowLeft, Radio } from "lucide-react";

const FALLBACK_TITLE = "Television and Farm Broadcasting Service";
const FALLBACK_SUBTITLE = "All Radio Programmes Library";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/admin";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string>("");
  const [systemName, setSystemName] = useState(FALLBACK_TITLE);
  const [subtitle, setSubtitle] = useState(FALLBACK_SUBTITLE);

  useEffect(() => {
    fetch("/api/settings/public")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.system_name?.trim()) {
          const full = data.system_name.trim();
          const dash = full.indexOf(" – ");
          setSystemName(dash > 0 ? full.slice(0, dash) : full);
          setSubtitle(dash > 0 ? full.slice(dash + 3) : FALLBACK_SUBTITLE);
        }
        if (data?.logo_url?.trim()) setLogoUrl(data.logo_url.trim());
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Email and password are required");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Login failed");
        setLoading(false);
        return;
      }
      toast.success("Logged in");
      router.push(redirect);
      router.refresh();
    } catch {
      toast.error("Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-6">
      <div className="w-full max-w-sm">
        <Card className="border-primary/20 shadow-lg">
          <CardHeader className="space-y-3 pb-3 pt-5 text-center">
            {logoUrl ? (
              <div className="flex justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={logoUrl}
                  alt=""
                  className="h-12 w-auto max-w-[200px] object-contain"
                />
              </div>
            ) : (
              <div className="flex justify-center">
                <div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
                  <Radio className="size-6 text-primary" aria-hidden />
                </div>
              </div>
            )}
            <div>
              <p className="text-sm font-semibold leading-tight text-foreground">
                {systemName}
              </p>
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 px-5 pb-5 pt-0">
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="h-9 text-sm"
                />
              </div>
              <Button
                type="submit"
                className="h-9 w-full text-sm font-medium"
                disabled={loading}
              >
                {loading ? "Signing in…" : "Sign in"}
              </Button>

              <div className="flex flex-col items-center gap-2 pt-1">
                <Dialog>
                  <DialogTrigger asChild>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 rounded text-xs text-muted-foreground transition-colors hover:text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-2"
                    >
                      <HelpCircle className="size-3.5" />
                      Forgot password?
                    </button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2 text-base">
                        <HelpCircle className="size-4 text-primary" />
                        Password reset
                      </DialogTitle>
                      <DialogDescription asChild>
                        <div className="space-y-2 pt-1 text-left text-sm">
                          <p>
                            To reset your password, please contact the{" "}
                            <strong>System Administrator</strong>.
                          </p>
                          <p className="text-muted-foreground">{systemName}</p>
                        </div>
                      </DialogDescription>
                    </DialogHeader>
                  </DialogContent>
                </Dialog>

                <Link
                  href="/"
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-primary hover:underline"
                >
                  <ArrowLeft className="size-3.5" />
                  Back to home
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center">
            <div className="h-48 w-64 animate-pulse rounded-lg bg-muted" />
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}
