import { Suspense } from "react";
import { ProgrammesList } from "@/components/programmes-list";

export default function ProgrammesPage() {
  return (
    <Suspense>
      <ProgrammesList />
    </Suspense>
  );
}
