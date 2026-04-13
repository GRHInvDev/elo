import type { Components } from "react-markdown"

import { cn } from "@/lib/utils"

/**
 * Estilo de Markdown minimalista para bolhas do assistente (intranet).
 */
export const ASSISTANT_CHAT_MARKDOWN_COMPONENTS: Components = {
  p: ({ children }) => (
    <p className="mb-2.5 last:mb-0 text-[0.9375rem] leading-[1.65] text-foreground/90">{children}</p>
  ),
  ul: ({ children }) => (
    <ul className="mb-2.5 ml-1 list-none space-y-1.5 last:mb-0 [&>li]:relative [&>li]:pl-4 [&>li]:before:absolute [&>li]:before:left-0 [&>li]:before:top-[0.55em] [&>li]:before:h-1 [&>li]:before:w-1 [&>li]:before:rounded-full [&>li]:before:bg-primary/55">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="mb-2.5 ml-4 list-decimal space-y-1.5 text-[0.9375rem] marker:text-muted-foreground last:mb-0">
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="leading-relaxed text-foreground/90">{children}</li>,
  strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
  em: ({ children }) => <em className="italic text-foreground/85">{children}</em>,
  a: ({ href, children }) => (
    <a
      href={href}
      className="font-medium text-primary underline decoration-primary/30 underline-offset-2 transition-colors hover:decoration-primary"
      target="_blank"
      rel="noreferrer noopener"
    >
      {children}
    </a>
  ),
  code: ({ className, children, ...props }) => {
    const isBlock = /\blanguage-/.test(className ?? "")
    if (isBlock) {
      return (
        <code className={cn("font-mono text-[0.8125rem] leading-relaxed", className)} {...props}>
          {children}
        </code>
      )
    }
    return (
      <code
        className="rounded-md border border-border/35 bg-muted/45 px-1.5 py-px font-mono text-[0.8125em] text-foreground/95"
        {...props}
      >
        {children}
      </code>
    )
  },
  pre: ({ children }) => (
    <pre className="mb-3 overflow-x-auto rounded-xl border border-border/40 bg-muted/30 p-3 text-[0.8125rem] leading-relaxed text-foreground/90 shadow-sm last:mb-0 [&>code]:border-0 [&>code]:bg-transparent [&>code]:p-0">
      {children}
    </pre>
  ),
  h1: ({ children }) => (
    <h3 className="mb-2 mt-3 text-base font-semibold tracking-tight text-foreground first:mt-0">{children}</h3>
  ),
  h2: ({ children }) => (
    <h3 className="mb-2 mt-3 text-[0.9375rem] font-semibold tracking-tight text-foreground first:mt-0">{children}</h3>
  ),
  h3: ({ children }) => (
    <h3 className="mb-1.5 mt-2.5 text-sm font-semibold text-foreground first:mt-0">{children}</h3>
  ),
  hr: () => <hr className="my-4 border-0 border-t border-border/50" />,
  blockquote: ({ children }) => (
    <blockquote className="my-2 border-l-2 border-primary/25 pl-3 text-[0.9375rem] text-muted-foreground italic leading-relaxed">
      {children}
    </blockquote>
  ),
  table: ({ children }) => (
    <div className="my-2 overflow-x-auto rounded-lg border border-border/40">
      <table className="w-full border-collapse text-left text-[0.8125rem]">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="border-b border-border/50 bg-muted/25">{children}</thead>,
  th: ({ children }) => (
    <th className="px-3 py-2 font-semibold text-foreground">{children}</th>
  ),
  td: ({ children }) => (
    <td className="border-t border-border/35 px-3 py-2 text-foreground/85">{children}</td>
  ),
}
