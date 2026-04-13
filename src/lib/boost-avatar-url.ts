/**
 * Aumenta dimensões pedidas em URLs de avatar conhecidas, para o navegador/Next
 * carregarem mais pixels e o crop circular não parecer borrado.
 */
export function boostAvatarUrl(url: string): string {
  const trimmed = url.trim()
  if (!trimmed) return trimmed

  try {
    const u = new URL(trimmed)

    if (u.hostname.endsWith("googleusercontent.com") || u.hostname.endsWith("ggpht.com")) {
      let next = trimmed.replace(/=s\d+-([a-z])/gi, "=s512-$1")
      if (u.searchParams.has("sz")) {
        const parsed = new URL(next)
        parsed.searchParams.set("sz", "512")
        next = parsed.toString()
      }
      return next
    }

    if (
      u.hostname === "www.gravatar.com" ||
      u.hostname === "secure.gravatar.com" ||
      u.hostname === "gravatar.com"
    ) {
      const current = parseInt(u.searchParams.get("s") ?? "80", 10)
      if (current < 512) u.searchParams.set("s", "512")
      return u.toString()
    }

    if (u.hostname === "avatars.githubusercontent.com") {
      const s = u.searchParams.get("s")
      if (!s || parseInt(s, 10) < 400) u.searchParams.set("s", "400")
      return u.toString()
    }

    if (u.hostname.includes("img.clerk.com") || u.hostname.includes("images.clerk.dev")) {
      if (!u.searchParams.has("width")) {
        u.searchParams.set("width", "512")
        u.searchParams.set("height", "512")
      }
      return u.toString()
    }
  } catch {
    return trimmed
  }

  return trimmed
}
