import { Link } from 'react-router-dom'

export default function Home() {
  return (
    <div className="home-page min-h-screen flex flex-col text-ink">
      <div className="home-fade flex-1 flex flex-col items-center px-7 pt-14 pb-10 text-center">
        {/* 1. Brand Logo */}
        <div className="logo-wrap relative mb-10 flex items-center justify-center overflow-visible">
          <span className="logo-glow" aria-hidden="true" />
          <picture>
            <source srcSet="/becoming-logo-home.webp" type="image/webp" />
            <img
              src="/becoming-logo-home.png"
              alt="becoming"
              className="logo-img relative z-[1] block h-auto object-contain select-none"
              width={200}
              height={46}
              decoding="async"
              fetchPriority="high"
              draggable={false}
            />
          </picture>
        </div>

        {/* 2. Brand philosophy */}
        <p className="font-display text-[14px] sm:text-[15px] text-ink-secondary tracking-[0.01em] leading-snug mb-2">
          Every moment is a chance to become.
        </p>
        <p className="text-[13px] text-ink-muted leading-relaxed mb-12">
          每一次觉察，都是成为自己的开始。
        </p>

        {/* 3. Main title — visual focus */}
        <h1 className="font-sans text-[22px] sm:text-[24px] leading-[1.72] font-normal text-ink tracking-[0.01em] mb-7 max-w-[20.5rem]">
          你以为自己在做选择，或许只是在遵循某些从未被质疑过的规则。
        </h1>

        {/* 4. Subtitle */}
        <p className="font-sans text-[14px] text-ink-secondary leading-relaxed mb-9 max-w-[18rem]">
          一场关于自我认知与限制性信念的探索。
        </p>

        {/* 5. Product intro — restrained */}
        <div className="text-[13.5px] text-ink-secondary/95 leading-[1.85] mb-12 max-w-[19.5rem] space-y-3">
          <p>
            那些习以为常的想法，可能正在悄悄影响你的金钱、职业、关系与人生选择。
          </p>
          <p>有时，改变的开始，是重新看见自己。</p>
        </div>

        {/* 6. CTA */}
        <Link to="/consent" className="btn-explore">
          开始探索
        </Link>

        {/* 7. Meta */}
        <p className="mt-5 text-[12px] tracking-[0.02em] text-ink-muted leading-relaxed">
          7个人生领域 · 约5—8分钟 · 没有标准答案
        </p>
        <p className="mt-2 text-[11px] text-ink-muted/85 leading-relaxed max-w-[18rem]">
          无需注册 · 报告可导出
        </p>
      </div>

      {/* 8. Brand signature */}
      <footer className="home-fade px-8 pb-14 pt-4 text-center">
        <div className="mx-auto mb-5 h-px w-10 bg-border" />
        <p className="font-display text-[15px] text-ink tracking-[0.04em] mb-1.5">
          becoming
        </p>
        <p className="font-display text-[12px] text-ink-muted tracking-[0.01em]">
          Every moment is a chance to become.
        </p>
      </footer>
    </div>
  )
}
