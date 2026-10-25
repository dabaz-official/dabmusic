import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "DabAZ",
};

export default function DabAZPage() {
  return (
    <div className="dz-container">
      <h1 className="-mt-[8px] text-[36px] font-semibold leading-11 text-text-primary">
        DabAZ
      </h1>
      <p className="mt-4 text-base text-text-secondary">
        Placeholder page for now.
      </p>
    </div>
  );
}
