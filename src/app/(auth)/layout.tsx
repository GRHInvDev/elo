import type React from "react"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen grid place-items-center">
      <div className="w-full max-w-[450px] p-4 md:p-0">{children}</div>
    </div>
  )
}

