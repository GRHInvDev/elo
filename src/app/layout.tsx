import type React from "react"
import { ClerkProvider } from "@clerk/nextjs"
import { Inter } from "next/font/google"
import "@/styles/globals.css"
import { cn } from "@/lib/utils"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { TRPCReactProvider } from "@/trpc/react"
import { ptBR } from "@clerk/localizations"
import { type Metadata } from "next"
import { AnimatedBackground } from "@/components/animated-background"
import { Analytics } from "@vercel/analytics/react"
import { SpeedInsights } from "@vercel/speed-insights/next"

export const metadata: Metadata = {
  icons: [{ rel: "icon", url: "/favicon.svg" }]
}

const inter = Inter({ subsets: ["latin"] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider localization={ptBR}>
      <TRPCReactProvider>
        <html lang="pt-BR" suppressHydrationWarning>
          <body className={cn("min-h-screen bg-background antialiased", inter.className)}>
            <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
              <AnimatedBackground />
              <Analytics/>
              <SpeedInsights/>
              {children}
              <Toaster />
            </ThemeProvider>
          </body>
        </html>
      </TRPCReactProvider>
    </ClerkProvider>
  )
}

