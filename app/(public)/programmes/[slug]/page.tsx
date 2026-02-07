import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Clock, Radio, CalendarDays } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth-session";
import { getAdminPath } from "@/lib/config";
import { formatDateOnlyDisplay, formatDurationSeconds } from "@/lib/date-utils";
import { normalizeProgrammeSlug } from "@/lib/slug-utils";
import ProgrammePlayer from "./player";
import { ShareDownloadButtons } from "@/components/share-download-buttons";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const decodedSlug = normalizeProgrammeSlug(slug);
  const { data } = await supabase
    .from("audio_programmes")
    .select("title, seo_title, seo_description, seo_keywords, description")
    .eq("slug", decodedSlug)
    .single();

  if (!data) return { title: "Not Found" };

  const title = data.seo_title || data.title;
  const description =
    data.seo_description || data.description?.slice(0, 160) || undefined;
  const keywords = data.seo_keywords
    ? data.seo_keywords.split(",").map((k: string) => k.trim())
    : undefined;
  const canonicalPath = `/programmes/${encodeURIComponent(decodedSlug)}`;

  return {
    title: `${title} | All Radio Programmes Library`,
    description,
    keywords,
    alternates: { canonical: canonicalPath },
    openGraph: {
      title,
      description,
      type: "article",
      url: canonicalPath,
    },
  };
}

export default async function ProgrammeDetailPage({ params }: Props) {
  const { slug } = await params;
  const decodedSlug = normalizeProgrammeSlug(slug);

  const { data: programme, error } = await supabase
    .from("audio_programmes")
    .select("*, category:categories(*), subcategory:subcategories(*), radio_channel:radio_channels(*)")
    .eq("slug", decodedSlug)
    .single();

  if (error || !programme) notFound();

  const session = await getSession();
  const category = programme.category as { name: string } | null;
  const subcategory = programme.subcategory as { name: string } | null;
  const radioChannel = programme.radio_channel as {
    name: string;
    frequency: string | null;
    frequency_2: string | null;
    logo_url: string | null;
  } | null;
  const backHref = session ? getAdminPath("programmes") : "/";
  const backLabel = session ? "Back to manage programmes" : "View all programmes";
  const dateStr = formatDateOnlyDisplay(programme.broadcasted_date) || programme.broadcasted_date;
  const repeatDateStr = programme.repeat_broadcasted_date
    ? formatDateOnlyDisplay(programme.repeat_broadcasted_date) || programme.repeat_broadcasted_date
    : null;
  const durationStr = formatDurationSeconds(programme.duration_seconds);
  const categoryLabel = [category?.name, subcategory?.name].filter(Boolean).join(" · ") || "Programme";

  return (
    <div className="space-y-6 sm:space-y-8">
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-sm">
        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 font-medium text-foreground transition-colors hover:text-primary"
        >
          <ArrowLeft className="size-4 shrink-0" />
          {backLabel}
        </Link>
        <span className="text-muted-foreground">/</span>
        <span className="truncate text-muted-foreground max-w-[200px] sm:max-w-xs" title={programme.title}>
          {programme.title}
        </span>
      </nav>

      <article className="max-w-2xl space-y-6 sm:space-y-8">
        {/* 1st highlight: Category + Broadcasted date */}
        <div className="rounded-xl border border-border/60 bg-primary/10 px-4 py-3">
          <p className="text-sm font-semibold text-foreground">
            {categoryLabel}
            {dateStr ? ` · ${dateStr}` : ""}
          </p>
        </div>

        {/* 2nd highlight: Programme title */}
        <header>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl leading-tight">
            {programme.title}
          </h1>
          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
            {durationStr && (
              <span className="inline-flex items-center gap-1.5">
                <Clock className="size-4 shrink-0" />
                {durationStr}
              </span>
            )}
          </div>
          <ShareDownloadButtons
            title={programme.title}
            slug={programme.slug}
            className="mt-4"
          />
        </header>

        {/* Audio player – prominent card */}
        <section className="rounded-xl border border-border/60 bg-card p-4 sm:p-5 shadow-sm" aria-label="Audio player">
          <ProgrammePlayer url={programme.firebase_storage_url} />
        </section>

        {/* 3rd highlight: Description */}
        {programme.description && (
          <section className="rounded-xl border border-border/60 bg-muted/20 p-4 sm:p-5">
            <h2 className="text-base font-semibold text-foreground mb-3">Description</h2>
            <p className="whitespace-pre-wrap text-sm sm:text-base text-muted-foreground leading-relaxed">
              {programme.description}
            </p>
          </section>
        )}

        {/* 4th highlight: Repeat broadcast date */}
        {repeatDateStr && (
          <section className="rounded-xl border border-border/60 bg-muted/40 px-4 py-3">
            <p className="text-sm font-medium text-foreground inline-flex items-center gap-2">
              <CalendarDays className="size-4 shrink-0 text-muted-foreground" />
              Repeat broadcast: {repeatDateStr}
            </p>
          </section>
        )}

        {/* 5th highlight: Radio channel */}
        {radioChannel && (
          <section className="rounded-xl border border-border/60 bg-muted/40 p-4" aria-label="Broadcast channel">
            <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
              Broadcast on
            </h2>
            <div className="flex items-center gap-3">
              {radioChannel.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={radioChannel.logo_url}
                  alt=""
                  className="size-12 rounded-full object-cover shrink-0 border border-border/60"
                />
              ) : (
                <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-muted border border-border/60">
                  <Radio className="size-6 text-muted-foreground" />
                </span>
              )}
              <div className="min-w-0">
                <p className="font-semibold text-foreground">{radioChannel.name}</p>
                {[radioChannel.frequency, radioChannel.frequency_2].filter(Boolean).length > 0 && (
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {[radioChannel.frequency, radioChannel.frequency_2].filter(Boolean).join(" · ")}
                  </p>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Back link */}
        <div className="border-t border-border/60 pt-6">
          <Link
            href={backHref}
            className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-2"
          >
            <ArrowLeft className="size-4" />
            {backLabel}
          </Link>
        </div>
      </article>
    </div>
  );
}
