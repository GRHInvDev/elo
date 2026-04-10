import { SignInHeading } from "@/components/auth/sign-in-heading"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { SignIn } from "@clerk/nextjs"
import Link from "next/link"

export default function SignInPage() {
  return (
    <Card className="border-border/80 shadow-md ring-1 ring-border/50">
      <CardHeader className="space-y-1.5 p-5 pb-4 sm:p-6 sm:pb-4">
        <SignInHeading />
      </CardHeader>
      <CardContent className="flex flex-col items-stretch px-5 pb-5 pt-0 sm:px-6 sm:pb-6">
        <SignIn
          appearance={{
            variables: {
              colorPrimary: "hsl(var(--primary))",
              colorText: "hsl(var(--foreground))",
              colorTextSecondary: "hsl(var(--muted-foreground))",
              colorBackground: "hsl(var(--background))",
              colorInputBackground: "hsl(var(--background))",
              colorInputText: "hsl(var(--foreground))",
              borderRadius: "var(--radius)",
            },
            elements: {
              rootBox: "w-full bg-transparent",
              cardBox: "rounded-none shadow-none drop-shadow-none bg-transparent",
              card: "w-full shadow-none rounded-none p-0 bg-transparent",
              header: "hidden",
              footer: "hidden",
              main: "rounded-none gap-4",
              dividerLine: "bg-border",
              dividerText: "text-muted-foreground text-xs",
              formButtonPrimary:
                "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              socialButtons: "text-primary bg-background rounded-md border border-border shadow-sm",
              otpCodeField: "w-full",
              otpCodeFieldInputs: "flex w-full flex-wrap justify-center gap-2 sm:gap-3",
              otpCodeFieldInput:
                "h-11 w-10 rounded-md border-2 border-input bg-background text-center text-base font-semibold tracking-[0.2em] text-foreground shadow-sm transition-colors selection:bg-primary/15 focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:h-12 sm:w-11",
              formFieldInput:
                "flex h-10 w-full text-foreground border border-input bg-background px-3 py-2 text-sm shadow-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
              socialButtonsRoot: "gap-2",
              socialButtonsBlockButton:
                "border border-border text-foreground shadow-sm hover:bg-accent hover:text-accent-foreground",
              formFieldLabel:
                "text-sm font-medium leading-none text-foreground peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
              formFieldHintText: "text-xs text-muted-foreground",
              formFieldErrorText: "text-sm text-destructive",
              identityPreview:
                "flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/40 px-3 py-2.5",
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
            Crie uma
          </span>
        </Link>
      </CardContent>
    </Card>
  )
}

