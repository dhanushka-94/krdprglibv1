import { Metadata } from "next";
import { RadioChannelsPageClient } from "./radio-channels-client";

export const metadata: Metadata = {
  title: "Radio Channels | Broadcast Stations",
  description: "Browse all radio channels. Listen live or view programmes by channel.",
};

export default function RadioChannelsPage() {
  return <RadioChannelsPageClient />;
}
