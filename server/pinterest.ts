import type { ImageItem } from '../src/types/index.js'

type ParsedUrl = { username: string; boardSlug: string }

export function parseBoardUrl(url: string): ParsedUrl {
  const { pathname } = new URL(url)
  const parts = pathname.replace(/^\/|\/$/g, '').split('/')
  if (parts.length < 2) throw new Error('Invalid Pinterest board URL')
  const [username, boardSlug] = parts
  return { username, boardSlug }
}

export async function fetchBoardPins(
  url: string,
): Promise<{ images: ImageItem[]; nextBookmark?: string }> {
  const { username, boardSlug } = parseBoardUrl(url)
  const rssUrl = `https://www.pinterest.com/${username}/${boardSlug}.rss`

  const res = await fetch(rssUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    },
  })
  if (!res.ok) throw new Error(`Pinterest RSS error ${res.status}`)

  const xml = await res.text()

  // Parse each <item> together so pin ID and image URL stay in sync
  const itemRegex = /<item>([\s\S]*?)<\/item>/g
  const items = [...xml.matchAll(itemRegex)].map(m => m[1])

  const seen = new Set<string>()
  const images: ImageItem[] = []

  items.forEach((item, i) => {
    const imgMatch = item.match(/https?:\/\/i\.pinimg\.com\/\d+x\/[a-f0-9/]+\.jpg/)
    if (!imgMatch) return
    const url736 = imgMatch[0].replace(/\/\d+x\//, '/736x/')
    if (seen.has(url736)) return
    seen.add(url736)
    const pinIdMatch = item.match(/pinterest\.com\/pin\/([^/"<\s]+)/)
    images.push({
      id: pinIdMatch?.[1] ?? String(i),
      url: url736,
      alt: '',
    })
  })

  return { images }
}
