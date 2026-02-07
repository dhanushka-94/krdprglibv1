"use client";

import { Suspense, useState } from "react";
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
import { HelpCircle, LogIn, ArrowLeft, Radio } from "lucide-react";

const BRAND_TITLE = "Television and Farm Broadcasting Service";
const BRAND_SUBTITLE = "All Radio Programmes Library";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const adminPath = process.env.NEXT_PUBLIC_ADMIN_PATH ?? "k7x9p2";
  const redirect = searchParams.get("redirect") ?? `/${adminPath}`;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

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
    <div className="flex min-h-screen flex-col">
      {/* Brand – top section with balanced spacing */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 pt-10 sm:pt-14 sm:px-8">
        <div className="flex max-w-md flex-col items-center gap-4 text-center">
          <div className="flex items-center justify-center gap-2.5 rounded-full bg-primary/10 px-6 py-3">
            <Radio className="size-6 text-primary shrink-0 sm:size-7" aria-hidden />
            <span className="text-base font-semibold leading-tight text-primary sm:text-lg">
              {BRAND_TITLE}
            </span>
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
            {BRAND_SUBTITLE}
          </p>
        </div>
      </div>

      {/* Login card – bottom section, consistent padding */}
      <div className="w-full shrink-0 px-6 pb-10 pt-8 sm:px-8 sm:pb-12 sm:pt-10">
        <div className="mx-auto w-full max-w-md">
          <Card className="border-primary/20 shadow-md">
            <CardHeader className="space-y-2 px-6 pt-6 pb-2 sm:px-8 sm:pt-8">
              <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl">
                <LogIn className="size-5 shrink-0 sm:size-6" />
                Sign in
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Sign in to manage the programme library. Use your account <strong>email</strong> and password.
              </p>
            </CardHeader>
            <CardContent className="px-6 pb-6 sm:px-8 sm:pb-8">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    className="h-11"
                  />
                  <p className="text-xs text-muted-foreground">This app uses email to sign in (no separate username).</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className="h-11"
                  />
                </div>
                <Button
                  type="submit"
                  className="h-11 w-full font-medium"
                  disabled={loading}
                >
                  {loading ? "Signing in…" : "Sign in"}
                </Button>

                <div className="flex flex-col items-center gap-3 pt-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <button
                        type="button"
                        className="inline-flex items-center gap-1.5 rounded text-sm text-muted-foreground transition-colors hover:text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-2"
                      >
                        <HelpCircle className="size-4" />
                        Forgot password?
                      </button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <HelpCircle className="size-5 text-primary" />
                          Password reset
                        </DialogTitle>
                        <DialogDescription asChild>
                          <div className="space-y-3 pt-1 text-left">
                            <p>
                              To reset your password, please contact the{" "}
                              <strong>System Administrator</strong>.
                            </p>
                            <p className="text-muted-foreground">
                              {BRAND_TITLE}
                            </p>
                          </div>
                        </DialogDescription>
                      </DialogHeader>
                    </DialogContent>
                  </Dialog>

                  <Link
                    href="/"
                    className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-primary hover:underline"
                  >
                    <ArrowLeft className="size-4" />
                    Back to home
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
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
            <Card className="w-full max-w-md">
              <CardContent className="py-12 text-center text-muted-foreground">
                Loading...
              </CardContent>
            </Card>
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}
