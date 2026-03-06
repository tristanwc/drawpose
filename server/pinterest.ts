import type { ImageItem, PinterestBoard } from '../src/types/index.js'

export async function fetchUserBoards(
  bookmark?: string,
  token?: string,
): Promise<{ boards: PinterestBoard[]; nextBookmark?: string }> {
  if (!token) throw new Error('Not authenticated')
  const params = new URLSearchParams({ page_size: '25', privacy: 'PUBLIC' })
  if (bookmark) params.set('bookmark', bookmark)

  const res = await fetch(`https://api.pinterest.com/v5/boards?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Pinterest API error ${res.status}: ${body}`)
  }

  const data = await res.json() as {
    items?: Array<{
      id: string
      name: string
      description?: string
      pin_count?: number
      media?: { image_cover_url?: string }
      privacy: string
    }>
    bookmark?: string
  }

  const boards: PinterestBoard[] = (data.items ?? []).map(b => ({
    id: b.id,
    name: b.name,
    description: b.description ?? '',
    pinCount: b.pin_count ?? 0,
    imageUrl: b.media?.image_cover_url,
    privacy: b.privacy,
  }))

  return {
    boards,
    nextBookmark: data.bookmark && data.bookmark !== '-end-' ? data.bookmark : undefined,
  }
}

async function scrapeBoardId(boardUrl: string): Promise<string> {
  const res = await fetch(boardUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; drawpose/1.0)' },
  })
  if (!res.ok) throw new Error(`Failed to fetch board page: ${res.status}`)

  const html = await res.text()

  // Pinterest embeds the full Redux state in a <script> tag containing initialReduxState
  const match = html.match(/<script[^>]*>(\{[^<]*"initialReduxState"[^<]*\})<\/script>/)
  if (!match) throw new Error('Could not find initialReduxState in board HTML')

  let data: { initialReduxState?: { boards?: Record<string, unknown> } }
  try {
    data = JSON.parse(match[1])
  } catch {
    throw new Error('Failed to parse board page JSON')
  }

  const boards = data.initialReduxState?.boards
  if (!boards || Object.keys(boards).length === 0) {
    throw new Error('Could not extract board ID from page')
  }

  return Object.keys(boards)[0]
}

export async function fetchBoardPins(
  url: string,
  bookmark?: string,
  boardId?: string,
  token?: string,
): Promise<{ images: ImageItem[]; nextBookmark?: string; boardId: string }> {
  if (!token) throw new Error('Not authenticated')

  // First load: scrape board_id from public HTML. Paginated calls pass boardId directly.
  const resolvedBoardId = boardId ?? await scrapeBoardId(url)

  const params = new URLSearchParams({ page_size: '250' })
  if (bookmark) params.set('bookmark', bookmark)

  const res = await fetch(`https://api.pinterest.com/v5/boards/${resolvedBoardId}/pins?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Pinterest API error ${res.status}: ${body}`)
  }

  const data = await res.json() as {
    items?: Array<{
      id: string
      media?: { images?: Record<string, { url: string }> }
      alt_text?: string | null
    }>
    bookmark?: string
  }

  const images: ImageItem[] = (data.items ?? []).flatMap(pin => {
    const imageMap = pin.media?.images ?? {}
    const url736 = imageMap['736x']?.url
    const fallback = Object.values(imageMap).pop()?.url
    const imgUrl = url736 ?? fallback
    if (!imgUrl) return []
    return [{ id: pin.id, url: imgUrl, alt: pin.alt_text ?? '' }]
  })

  return {
    images,
    nextBookmark: data.bookmark && data.bookmark !== '-end-' ? data.bookmark : undefined,
    boardId: resolvedBoardId,
  }
}
