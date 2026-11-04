import type { ReactNode } from 'react'
import Header from './Header'

export default function Layout({
  children,
  showHeader = true,
  showLegalFooter = false,
}: {
  children: ReactNode
  showHeader?: boolean
  showLegalFooter?: boolean
}) {
  return (
    <div
      className="min-h-screen font-sans text-ink flex flex-col"
      style={{
        background:
          'linear-gradient(180deg, #FCFBF8 0%, #F8F7F2 52%, #F0EDE5 100%)',
      }}
    >
      {showHeader && <Header />}
      <main className="flex-1 w-full px-5 pb-10 pt-3">{children}</main>
      {showLegalFooter && (
        <footer className="px-6 pb-8 text-center text-[11px] leading-[1.75] text-ink-muted/80">
          <p>自我探索工具，不能替代专业心理咨询或危机干预。</p>
        </footer>
      )}
    </div>
  )
}
