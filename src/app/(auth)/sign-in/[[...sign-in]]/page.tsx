import { SignInBackground } from "@/components/auth/sign-in-background"
import { SignInHeading } from "@/components/auth/sign-in-heading"
import { SignInVerificationLoadingShell } from "@/components/auth/sign-in-verification-loading-shell"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { SignIn } from "@clerk/nextjs"
import Link from "next/link"

export default function SignInPage() {
  return (
    <>
      <SignInBackground />
      <div className="relative z-10 w-full min-w-0 max-w-full">
        <SignInVerificationLoadingShell>
          <Card
            className="relative overflow-visible border-zinc-200/90 bg-white/95 text-zinc-950 shadow-xl shadow-zinc-900/10 ring-1 ring-zinc-900/[0.06] backdrop-blur-xl duration-300 animate-in fade-in zoom-in-95 dark:border-zinc-600/50 dark:bg-zinc-800/90 dark:text-zinc-50 dark:shadow-black/40 dark:ring-white/[0.08]"
          >
            <div
              className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/35 to-transparent"
              aria-hidden
            />
            <CardHeader className="space-y-1.5 px-6 pb-5 pt-6 sm:px-7 sm:pb-5 sm:pt-7">
              <SignInHeading />
            </CardHeader>
            <CardContent className="flex min-w-0 flex-col items-stretch px-6 pb-6 pt-0 sm:px-7 sm:pb-7 sm:pt-1">
              <SignIn
                appearance={{
                  variables: {
                    colorPrimary: "hsl(var(--primary))",
                    colorText: "hsl(var(--foreground))",
                    colorTextSecondary: "hsl(var(--muted-foreground))",
                    colorBackground: "transparent",
                    colorInputBackground: "hsl(var(--background))",
                    colorInputText: "hsl(var(--foreground))",
                    borderRadius: "var(--radius)",
                  },
                  elements: {
                    rootBox: "w-full min-w-0 max-w-full bg-transparent",
                    cardBox:
                      "w-full min-w-0 max-w-full overflow-visible rounded-none bg-transparent shadow-none drop-shadow-none",
                    card: "w-full min-w-0 max-w-full overflow-visible rounded-none bg-transparent p-0 shadow-none",
                    header: "hidden",
                    footer: "hidden",
                    main: "flex w-full min-w-0 max-w-full flex-col gap-6 overflow-visible rounded-none p-0",
                    formContainer: "w-full min-w-0 max-w-full",
                    form: "flex w-full min-w-0 max-w-full flex-col gap-5",
                    formFieldRow: "flex w-full min-w-0 max-w-full flex-col gap-2",
                    formFieldLabelRow:
                      "flex w-full min-w-0 max-w-full items-center justify-between gap-2",
                    formField: "flex w-full min-w-0 max-w-full flex-col gap-1.5",
                    formFieldInputGroup:
                      "flex w-full min-w-0 max-w-full flex-nowrap items-stretch gap-2 [&_input]:min-w-0 [&_input]:flex-1 [&_input]:basis-0",
                    formFieldInputShowPasswordButton:
                      "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md border-0 bg-transparent text-muted-foreground shadow-none transition-colors hover:bg-transparent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                    dividerRow: "my-0 w-full",
                    dividerLine: "bg-border",
                    dividerText: "text-muted-foreground text-xs",
                    formButtonPrimary:
                      "w-full min-w-0 bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    socialButtons:
                      "rounded-md border border-border bg-background/90 text-primary shadow-sm dark:bg-zinc-900/80",
                    otpCodeField: "w-full",
                    otpCodeFieldInputs:
                      "flex w-full flex-wrap justify-center gap-2 sm:gap-3",
                    otpCodeFieldInput:
                      "h-11 w-10 rounded-md border-2 border-input bg-background text-center text-base font-semibold tracking-[0.2em] text-foreground shadow-sm transition-colors selection:bg-primary/15 focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:h-12 sm:w-11",
                    formFieldInput:
                      "box-border h-10 w-full min-h-10 min-w-0 max-w-full rounded-md border border-input bg-background/90 px-3 py-2 text-sm leading-5 text-foreground shadow-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-950/60",
                    socialButtonsRoot: "flex w-full min-w-0 max-w-full flex-col gap-2",
                    socialButtonsBlockButton:
                      "w-full min-w-0 border border-border bg-background/90 text-foreground shadow-sm hover:bg-accent hover:text-accent-foreground dark:bg-zinc-900/80",
                    formFieldLabel:
                      "text-sm font-medium leading-snug text-foreground peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
                    formFieldHintText: "text-xs text-muted-foreground",
                    formFieldErrorText: "text-sm text-destructive",
                    identityPreview:
                      "flex min-w-0 items-center justify-between gap-3 rounded-lg border border-border bg-muted/50 px-3 py-2.5 dark:bg-zinc-900/60",
                    identityPreviewText: "text-sm text-foreground",
                    identityPreviewEditButton:
                      "text-sm font-medium text-primary underline-offset-4 hover:underline",
                    alertText: "text-sm text-foreground",
                    formResendCodeLink:
                      "text-sm font-medium text-primary underline-offset-4 hover:underline",
                  },
                }}
                redirectUrl="/dashboard"
                signUpUrl="/sign-up"
              />
              <Link
                href="/sign-up"
                className="mt-6 place-self-center text-center text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Ainda não tem conta?{" "}
                <span className="font-medium text-primary underline-offset-4 hover:underline">
                  Vamos criar a sua
                </span>
              </Link>
            </CardContent>
          </Card>
        </SignInVerificationLoadingShell>
        <p className="mx-auto mt-7 max-w-sm text-center text-[11px] leading-relaxed text-muted-foreground/90 sm:text-xs">
          Conexão segura · sua sessão é protegida com criptografia de ponta a ponta
        </p>
      </div>
    </>
  )
}
