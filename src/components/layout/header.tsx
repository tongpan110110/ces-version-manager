'use client'

interface HeaderProps {
  title?: string
}

export function Header({ title }: HeaderProps) {
  return (
    <header className="h-16 border-b border-border bg-card/50 backdrop-blur-sm">
      <div className="flex h-full items-center justify-between px-6">
        <div className="flex items-center gap-4">
          {title && (
            <h2 className="text-xl font-semibold">{title}</h2>
          )}
        </div>
      </div>
    </header>
  )
}
