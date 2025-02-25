import { SignUp } from "@clerk/nextjs"

export default function SignUpPage() {
  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
      <div className="flex flex-col space-y-2 p-4 md:p-6">
        <h1 className="text-2xl font-semibold tracking-tight">Criar conta</h1>
        <p className="text-sm text-muted-foreground">Preencha os dados abaixo para criar sua conta na intranet</p>
      </div>
      <div className="p-4 md:p-6 pt-0">
        <SignUp
          appearance={{
            elements: {
              rootBox: "w-full",
              card: "w-full shadow-none p-0",
              header: "hidden",
              footer: "hidden",
              formButtonPrimary: "bg-primary text-primary-foreground shadow hover:bg-primary/90",
              formFieldInput:
                "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
              formFieldLabel:
                "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
              identityPreviewText: "text-sm text-muted-foreground",
              formResendCodeLink: "text-sm font-medium text-primary underline-offset-4 hover:underline",
            },
          }}
          redirectUrl="/dashboard"
          signInUrl="/sign-in"
        />
      </div>
    </div>
  )
}

