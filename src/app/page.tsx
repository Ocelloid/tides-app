import { Suspense } from "react";
import { GeneratorPage } from "~/components/generator/GeneratorPage";

export default function Home() {
  return (
    <Suspense fallback={null}>
      <GeneratorPage />
    </Suspense>
  );
}
