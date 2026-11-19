// Client-side rate limit buckets: a sliding window of at most `limit` uses
// per `windowMs`, plus a pause a 429 imposed.

/** At most `limit` uses in any `windowMs`. */
export class WindowLimiter {
  private readonly stamps: number[] = []
  readonly limit: number
  readonly windowMs: number

  constructor(limit: number, windowMs: number) {
    this.limit = limit
    this.windowMs = windowMs
  }

  /** Milliseconds until a use is allowed (with at most `limit` in the window); 0 when it is now. */
  delay(now: number, limit = this.limit): number {
    while (this.stamps.length > 0 && this.stamps[0]! <= now - this.windowMs) this.stamps.shift()
    const n = this.stamps.length
    if (n < limit) return 0
    return this.stamps[n - limit]! + this.windowMs - now
  }

  take(now: number): void {
    this.stamps.push(now)
  }
}

/** One route's state: an optional local limit and the pause of its last 429. */
export class Bucket {
  pausedUntil = 0
  readonly limiter: WindowLimiter | undefined

  constructor(limiter?: WindowLimiter) {
    this.limiter = limiter
  }
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * The bucket of a route: method and path with ids replaced, except a channel
 * id, which keeps channels apart (the route's major parameter). Posting a
 * message and uploading a file share the per-channel message bucket.
 */
export function bucketKey(method: string, path: string): string {
  const parts = path.split('?')[0]!.split('/')
  const post = method === 'POST' && parts[1] === 'channels' && (parts[3] === 'messages' || parts[3] === 'upload') && parts.length === 4
  if (post) return `post-message:${parts[2]}`
  if (tokenIndex(parts) >= 0) return `${method} /${parts[1]}/:id/:token/${parts.slice(4).join('/')}`
  const out = parts.map((p, i) => (UUID.test(p) && !(i === 2 && parts[1] === 'channels') ? ':id' : p))
  // One bucket for all emoji of a message's reactions.
  const reactions = out.indexOf('reactions')
  return `${method} ${(reactions < 0 ? out : out.slice(0, reactions + 1)).join('/')}`
}

/**
 * The index of the path segment that carries an interaction or webhook token
 * (`/interactions/{id}/{token}/...`, `/webhooks/{id}/{token}`), or -1. No
 * method of the client calls a `/webhooks` route yet; the match covers one
 * sent through `request()` or added later, which is then redacted and shares
 * one bucket per route like the interaction routes.
 */
function tokenIndex(parts: string[]): number {
  return parts.length >= 4 && parts[0] === '' && (parts[1] === 'interactions' || parts[1] === 'webhooks') ? 3 : -1
}

/**
 * The path for logs and errors: an interaction or webhook token segment
 * becomes `:token` (the token answers the interaction without the bot
 * token), for example `/interactions/<id>/:token/callback`.
 */
export function redactPath(path: string): string {
  const [route, query] = splitQuery(path)
  const parts = route.split('/')
  const i = tokenIndex(parts)
  if (i >= 0) parts[i] = ':token'
  return parts.join('/') + query
}

/**
 * text with the token segment of path (see tokenIndex), raw and decoded,
 * replaced by `:token`: for messages that may quote the request URL.
 */
export function redactText(text: string, path: string): string {
  const parts = splitQuery(path)[0].split('/')
  const i = tokenIndex(parts)
  const token = i < 0 ? '' : (parts[i] ?? '')
  if (token === '') return text
  let decoded = token
  try {
    decoded = decodeURIComponent(token)
  } catch {
    // an undecodable segment is replaced as it is
  }
  return text.replaceAll(token, ':token').replaceAll(decoded, ':token')
}

function splitQuery(path: string): [string, string] {
  const q = path.indexOf('?')
  return q < 0 ? [path, ''] : [path.slice(0, q), path.slice(q)]
}

/** Whether the route counts toward the 5 messages per 5 seconds per channel. */
export function isMessagePost(key: string): boolean {
  return key.startsWith('post-message:')
}
