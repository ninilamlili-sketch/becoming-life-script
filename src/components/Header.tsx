/** Inner pages: serif brand mark — matches editorial becoming style. */
export default function Header() {
  return (
    <header className="w-full px-5 pt-6 pb-2 flex items-baseline justify-between gap-3">
      <span className="font-serif text-[13px] font-normal text-ink tracking-[0.04em]">
        改写人生剧本
      </span>
      <span className="font-display text-[11px] font-normal tracking-[0.18em] text-ink-muted shrink-0">
        becoming
      </span>
    </header>
  )
}
