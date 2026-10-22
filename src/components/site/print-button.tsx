"use client";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex h-12 items-center justify-center rounded-full border border-[#57534e] px-6 text-[15px] font-bold text-paper transition hover:border-paper sm:h-14 sm:px-7"
    >
      Print / save as PDF
    </button>
  );
}
