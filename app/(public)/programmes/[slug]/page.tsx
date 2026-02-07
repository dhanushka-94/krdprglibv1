import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Clock, Radio } from "lucide-react";
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
  const durationStr = formatDurationSeconds(programme.duration_seconds);

  return (
    <div className="space-y-8">
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-sm">
        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 font-medium text-foreground transition-colors hover:text-primary"
        >
          <ArrowLeft className="size-4 shrink-0" />
          {backLabel}
        </Link>
        <span className="text-muted-foreground">/</span>
        <span className="truncate text-muted-foreground" title={programme.title}>
          {programme.title}
        </span>
      </nav>

      <article className="max-w-2xl space-y-8">
        <header>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {programme.title}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            {dateStr && <span>{dateStr}</span>}
            {category?.name && <span>{category.name}</span>}
            {subcategory?.name && <span>{subcategory.name}</span>}
            {durationStr && (
              <span className="inline-flex items-center gap-1">
                <Clock className="size-3.5" />
                {durationStr}
              </span>
            )}
          </div>
          {radioChannel && (
            <div className="mt-3 flex items-center gap-2 rounded-lg border border-border/60 bg-muted/20 px-3 py-2">
              {radioChannel.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={radioChannel.logo_url}
                  alt=""
                  className="size-8 rounded-full object-cover shrink-0"
                />
              ) : (
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted">
                  <Radio className="size-4 text-muted-foreground" />
                </span>
              )}
              <div className="min-w-0">
                <p className="font-medium text-foreground">{radioChannel.name}</p>
                {[radioChannel.frequency, radioChannel.frequency_2].filter(Boolean).length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {[radioChannel.frequency, radioChannel.frequency_2].filter(Boolean).join(" · ")}
                  </p>
                )}
              </div>
            </div>
          )}
          <ShareDownloadButtons
            title={programme.title}
            slug={programme.slug}
            className="mt-4"
          />
        </header>

        <ProgrammePlayer url={programme.firebase_storage_url} />

        {programme.description && (
          <section className="rounded-xl border border-border/60 bg-muted/20 p-4 sm:p-5">
            <h2 className="text-sm font-semibold text-foreground">Description</h2>
            <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground leading-relaxed">
              {programme.description}
            </p>
          </section>
        )}

        <div className="border-t border-border/60 pt-6">
          <Link
            href={backHref}
            className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
          >
            <ArrowLeft className="size-4" />
            {backLabel}
          </Link>
        </div>
      </article>
    </div>
  );
}
