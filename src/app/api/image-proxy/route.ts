import { NextResponse } from "next/server"

export async function GET(request: Request) {
	try {
		const { searchParams } = new URL(request.url)
		const url = searchParams.get("url")

		if (!url) {
			return NextResponse.json({ error: "Missing url param" }, { status: 400 })
		}

		// Permitir apenas http/https
		if (!/^https?:\/\//i.test(url)) {
			return NextResponse.json({ error: "Invalid url" }, { status: 400 })
		}

		const res = await fetch(url, { cache: "no-store" })
		if (!res.ok || !res.body) {
			return NextResponse.json({ error: "Failed to fetch image" }, { status: 502 })
		}

		const contentType = res.headers.get("content-type") ?? "image/jpeg"
		const headers = new Headers()
		headers.set("Content-Type", contentType)
		// Desabilitar cache forte para evitar problemas
		headers.set("Cache-Control", "public, max-age=60, s-maxage=60")

		return new NextResponse(res.body, { status: 200, headers })
	} catch (err) {
		return NextResponse.json({ error: "Unexpected error" }, { status: 500 })
	}
}
