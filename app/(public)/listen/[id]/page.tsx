import { Metadata } from "next";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { ListenChannelClient } from "./listen-channel-client";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const { data } = await supabase
    .from("radio_channels")
    .select("name")
    .eq("id", id)
    .single();
  if (!data) return { title: "Channel not found" };
  return {
    title: `Listen Live – ${data.name}`,
    description: `Stream ${data.name} live online.`,
  };
}

export default async function ListenChannelPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { data: channel, error } = await supabase
    .from("radio_channels")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !channel || !channel.stream_url?.trim()) {
    notFound();
  }

  return <ListenChannelClient channel={channel} />;
}
