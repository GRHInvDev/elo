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
import { Analytics } from "@vercel/analytics/react"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"

export const metadata: Metadata = {
  icons: [{ rel: "icon", url: "/favicon.svg" }]
}

const inter = Inter({ subsets: ["latin"] })

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { userId } = await auth()

  if (!userId) {
    redirect("/sign-in")
  }
  
  return (
    <ClerkProvider localization={ptBR}>
      <TRPCReactProvider>
        <html lang="pt-BR" suppressHydrationWarning>
          {/* Debug react scan */}
          {/* <head>
            <script src="https://unpkg.com/react-scan/dist/auto.global.js" />
          </head> */}
          <body className={cn("min-h-screen bg-zinc-100 dark:bg-background antialiased", inter.className)}>
            <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
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

