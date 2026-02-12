import { Suspense } from "react";
import { ProgrammesList } from "@/components/programmes-list";

export default function HomePage() {
  return (
    <Suspense>
      <ProgrammesList />
    </Suspense>
  );
}
