import { NextResponse } from "next/server"
import { db } from "@/server/db"

function isAllowed(url: URL): boolean {
	const host = url.hostname.toLowerCase()
	return host === "ufs.sh" || host.endsWith(".ufs.sh")
}

export async function GET(request: Request) {
	try {
		const { searchParams } = new URL(request.url)
		const urlParam = searchParams.get("url")

		if (!urlParam) {
			return NextResponse.json({ error: "Missing url param" }, { status: 400 })
		}

		const stored = await db.storedFile.findFirst({
			where: {
				OR: [{ legacyUrl: urlParam }, { legacyUrl: decodeURIComponent(urlParam) }],
				isActive: true,
			},
			select: {
				mimeType: true,
				base64Data: true,
				fileHash: true,
			},
		})

		if (stored?.base64Data) {
			let base64Content = stored.base64Data
			if (base64Content.includes(",")) {
				base64Content = base64Content.split(",")[1] ?? ""
			}
			const buffer = Buffer.from(base64Content, "base64")
			const headers = new Headers()
			headers.set("Content-Type", stored.mimeType || "image/jpeg")
			headers.set("Content-Length", buffer.length.toString())
			headers.set("ETag", `"${stored.fileHash}"`)
			headers.set("Cache-Control", "public, max-age=31536000, immutable")
			headers.set("Access-Control-Allow-Origin", "*")
			return new NextResponse(buffer, { status: 200, headers })
		}

		let target: URL
		try {
			target = new URL(urlParam)
		} catch {
			return NextResponse.json({ error: "Invalid url" }, { status: 400 })
		}

		if (!/^https?:$/i.test(target.protocol)) {
			return NextResponse.json({ error: "Invalid protocol" }, { status: 400 })
		}

		if (!isAllowed(target)) {
			return NextResponse.json({ error: "Host not allowed" }, { status: 400 })
		}

		const upstream = await fetch(target.toString(), {
			cache: "no-store",
			headers: {
				"User-Agent":
					"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119 Safari/537.36",
				Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
				Referer: "https://intranet.boxdistribuidor.com.br/",
			},
		})

		// Fallback: se o upstream falhar, redireciona o cliente direto para o recurso
		if (!upstream.ok || !upstream.body) {
			return NextResponse.redirect(target.toString(), { status: 302 })
		}

		const contentType = upstream.headers.get("content-type") ?? "image/jpeg"
		const headers = new Headers()
		headers.set("Content-Type", contentType)
		headers.set("Cache-Control", "public, max-age=300, s-maxage=300")
		headers.set("Access-Control-Allow-Origin", "*")

		return new NextResponse(upstream.body, { status: 200, headers })
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	} catch (err) {
		return NextResponse.json({ error: "Unexpected error" }, { status: 500 })
	}
}
