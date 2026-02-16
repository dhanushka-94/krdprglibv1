import { Metadata } from "next";
import { ListenPageClient } from "./listen-client";

export const metadata: Metadata = {
  title: "Listen Live | Radio Streams",
  description: "Listen to radio channels live. Stream your favourite stations online.",
};

export default function ListenPage() {
  return <ListenPageClient />;
}
