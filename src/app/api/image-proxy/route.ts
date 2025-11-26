import { NextResponse } from "next/server"

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
