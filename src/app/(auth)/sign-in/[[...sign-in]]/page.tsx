import { Card } from "@/components/ui/card"
import { SignIn } from "@clerk/nextjs"
import Link from "next/link"

export default function SignInPage() {
  return (
    <Card>
      <div className="flex flex-col space-y-2 p-4 md:p-6">
        <h1 className="text-2xl font-semibold tracking-tight">Bem-vindo de volta</h1>
        <p className="text-sm text-muted-foreground">Faça login para acessar a elo</p>
      </div>
      <div className="p-4 md:p-6 pt-0 flex flex-col items-center">
        <SignIn
          appearance={{ 
            elements: {
              rootBox: "w-full bg-transparent",
              cardBox: "rounded-none shadow-none drop-shadow-none bg-transparent",
              card: "w-full shadow-none rounded-none p-0 bg-transparent",
              header: "hidden",
              footer: "hidden",
              main: "rounded-none",
              formButtonPrimary: "bg-primary text-primary-foreground shadow hover:bg-primary/90",
              socialButtons: "text-primary bg-background drop-shadow-md rounded-md",
              formFieldInput:
                "flex h-10 w-full drop-shadow-md text-primary border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
              socialButtonsRoot: "text-primary hover:bg-primary/30",
              socialButtonsBlockButton: "text-primary border-1 border-primary",
              formFieldLabel:
                "text-sm text-primary font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
              identityPreviewText: "text-sm text-muted-foreground",
              formResendCodeLink: "text-sm font-medium text-primary underline-offset-4 hover:underline",
            },
          }}
          redirectUrl="/dashboard"
          signUpUrl="/sign-up"
        />
        <Link href='/sign-up' className="text-sm w-full text-center mt-4 place-self-center">
          Ainda não tem conta? <span className="underline">Crie uma!</span>
        </Link>
      </div>
    </Card>
  )
}

