import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "DabAZ",
};

export default function DabAZPage() {
  return (
    <div className="dz-container py-8">
      <h1 className="text-[32px] font-semibold leading-10 text-text-primary">
        DabAZ
      </h1>
      <p className="mt-4 text-base text-text-secondary">
        Placeholder page for now.
      </p>
    </div>
  );
}
