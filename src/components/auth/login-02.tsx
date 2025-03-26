"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import Link from "next/link"

// Utiliser une interface sans étendre HTMLAttributes pour éviter les conflits de types
interface LoginFormProps {
  className?: string
  onSubmit: (email: string, password: string) => Promise<void>
  isLoading: boolean
  error?: string | null
  statusMessage?: { type: string; message: string } | null
}

export function LoginForm({
  className,
  onSubmit,
  isLoading,
  error,
  statusMessage,
  ...props
}: LoginFormProps) {
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit(email, password)
  }

  return (
    <div className={cn("grid gap-6", className)} {...props}>
      {error && (
        <div className="text-red-500 text-sm text-center">{error}</div>
      )}

      {statusMessage && (
        <div 
          className={cn(
            "p-3 rounded-md text-sm",
            statusMessage.type === "pending" ? "bg-yellow-50 text-yellow-800" : "bg-red-50 text-red-800"
          )}
        >
          {statusMessage.message}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              placeholder="exemple@email.com"
              type="email"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect="off"
              disabled={isLoading}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Mot de passe</Label>
              <Link
                href="/auth/forgot-password"
                className="text-sm font-medium text-primary hover:underline"
              >
                Mot de passe oublié ?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              autoCapitalize="none"
              autoComplete="current-password"
              disabled={isLoading}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button disabled={isLoading}>
            {isLoading && (
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            )}
            Se connecter
          </Button>
        </div>
      </form>
      <div className="flex items-center justify-between mt-6">
        <div className="text-sm text-muted-foreground">
          <Link href="/" className="text-primary hover:underline">
            Retour à l&apos;accueil
          </Link>
        </div>
        <div className="text-sm font-medium">
          <Link href="/auth/register" className="text-primary hover:underline">
            Créer un compte
          </Link>
        </div>
      </div>
    </div>
  )
} 