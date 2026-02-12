import { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Clock, Radio, CalendarDays } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth-session";
import { getAdminPath } from "@/lib/config";
import { formatDateOnlyDisplay, formatDurationSeconds } from "@/lib/date-utils";
import { normalizeProgrammeSlug } from "@/lib/slug-utils";
import ProgrammePlayer from "./player";
import { ProgrammeShareSocial } from "@/components/programme-share-social";
import { LikeButton } from "@/components/like-button";
import { CategoryScheduleBlock } from "@/components/category-schedule-block";

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
  const category = programme.category as { id?: string; name: string } | null;
  const subcategory = programme.subcategory as { name: string } | null;
  const radioChannel = programme.radio_channel as {
    name: string;
    frequency: string | null;
    frequency_2: string | null;
    logo_url: string | null;
  } | null;
  const backHref = session ? getAdminPath("programmes") : "/";
  const backLabel = session ? "Back to manage programmes" : "Back to all programmes";
  const dateStr = formatDateOnlyDisplay(programme.broadcasted_date) || programme.broadcasted_date;
  const repeatDateStr = programme.repeat_broadcasted_date
    ? formatDateOnlyDisplay(programme.repeat_broadcasted_date) || programme.repeat_broadcasted_date
    : null;
  const durationStr = formatDurationSeconds(programme.duration_seconds);
  const categoryLabel = [category?.name, subcategory?.name].filter(Boolean).join(" · ") || "Programme";

  const headersList = await headers();
  const host = headersList.get("x-forwarded-host") ?? headersList.get("host") ?? "";
  const proto = headersList.get("x-forwarded-proto") ?? (host?.includes("localhost") ? "http" : "https");
  const baseUrl = host ? `${proto}://${host}` : (process.env.NEXT_PUBLIC_APP_URL ?? "");

  return (
    <article className="w-full max-w-xl mx-auto space-y-6">
      {/* Back link – simple */}
      <Link
        href={backHref}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="size-4 shrink-0" />
        {backLabel}
      </Link>

      {/* Title + meta */}
      <div>
        <h1 className="text-xl font-bold text-foreground sm:text-2xl leading-snug">
          {programme.title}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {categoryLabel}
          {dateStr ? ` · ${dateStr}` : ""}
          {durationStr ? ` · ${durationStr}` : ""}
        </p>
      </div>

      {/* Audio player – main focus */}
      <section className="rounded-xl bg-muted/30 p-4" aria-label="Listen">
        <ProgrammePlayer url={programme.firebase_storage_url} />
      </section>

      {/* Actions: Like, Share, Download */}
      <div className="flex flex-wrap items-center gap-3">
        <LikeButton slug={programme.slug} className="size-9 shrink-0" />
        <ProgrammeShareSocial title={programme.title} slug={programme.slug} baseUrl={baseUrl} compact />
      </div>

      {/* Description */}
      {programme.description && (
        <section>
          <h2 className="text-sm font-medium text-foreground mb-2">About</h2>
          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
            {programme.description}
          </p>
        </section>
      )}

      {/* Category broadcast schedule */}
      {programme.category_id && (
        <div className="pt-4 border-t border-border/40">
          <CategoryScheduleBlock
            categoryId={programme.category_id}
            categoryName={category?.name}
          />
        </div>
      )}

      {/* Secondary info – compact */}
      {(repeatDateStr || radioChannel) && (
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground pt-2 border-t border-border/40">
          {repeatDateStr && (
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="size-4 shrink-0" />
              Repeat: {repeatDateStr}
            </span>
          )}
          {radioChannel && (
            <span className="inline-flex items-center gap-2">
              {radioChannel.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={radioChannel.logo_url}
                  alt=""
                  className="size-6 rounded-full object-cover shrink-0"
                />
              ) : (
                <Radio className="size-4 shrink-0" />
              )}
              <span>
                {radioChannel.name}
                {[radioChannel.frequency, radioChannel.frequency_2].filter(Boolean).length > 0 && (
                  <> · {[radioChannel.frequency, radioChannel.frequency_2].filter(Boolean).join(", ")}</>
                )}
              </span>
            </span>
          )}
        </div>
      )}
    </article>
  );
}
