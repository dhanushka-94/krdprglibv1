"use client";

import { Radio } from "lucide-react";
import { useLanguage } from "@/lib/language-context";
import { localizedName } from "@/lib/lang-utils";

interface LocalizableItem {
  name: string;
  name_si?: string;
  name_ta?: string;
}

interface Props {
  category?: LocalizableItem | null;
  subcategory?: LocalizableItem | null;
  dateStr?: string;
  durationStr?: string;
}

/** Renders the category label line with localized category/subcategory names */
export function ProgrammeMetaLine({ category, subcategory, dateStr, durationStr }: Props) {
  const { lang } = useLanguage();
  const parts = [localizedName(category, lang), localizedName(subcategory, lang)].filter(Boolean);
  const categoryLabel = parts.join(" · ") || "Programme";
  return (
    <p className="mt-1 text-sm text-muted-foreground">
      {categoryLabel}
      {dateStr ? ` · ${dateStr}` : ""}
      {durationStr ? ` · ${durationStr}` : ""}
    </p>
  );
}

interface ChannelDisplayProps {
  channel: {
    name: string;
    name_si?: string;
    name_ta?: string;
    frequency: string | null;
    frequency_2: string | null;
    logo_url: string | null;
  };
}

/** Renders the radio channel with localized name */
export function ChannelDisplay({ channel }: ChannelDisplayProps) {
  const { lang } = useLanguage();
  return (
    <span className="inline-flex items-center gap-2">
      {channel.logo_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={channel.logo_url}
          alt=""
          className="size-6 rounded-full object-cover shrink-0"
        />
      ) : (
        <Radio className="size-4 shrink-0" />
      )}
      <span>
        {localizedName(channel, lang)}
        {[channel.frequency, channel.frequency_2].filter(Boolean).length > 0 && (
          <> · {[channel.frequency, channel.frequency_2].filter(Boolean).join(", ")}</>
        )}
      </span>
    </span>
  );
}
