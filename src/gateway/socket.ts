// The WebSocket the gateway talks through. Node 24's global WebSocket accepts
// `{ headers }`, which carries the Authorization header of the upgrade.

export interface SocketCloseEvent {
  code: number
  reason: string
}

/** What the gateway needs of a WebSocket (the standard WebSocket fits). */
export interface WebSocketLike {
  readonly readyState: number
  send(data: string): void
  close(code?: number, reason?: string): void
  addEventListener(type: 'open', listener: () => void): void
  addEventListener(type: 'message', listener: (ev: { data: unknown }) => void): void
  addEventListener(type: 'close', listener: (ev: SocketCloseEvent) => void): void
  addEventListener(type: 'error', listener: (ev: unknown) => void): void
}

export type WebSocketFactory = (url: string, headers: Record<string, string>) => WebSocketLike

export const defaultWebSocketFactory: WebSocketFactory = (url, headers) => {
  const parsed = new URL(url)
  if (parsed.protocol !== 'ws:' && parsed.protocol !== 'wss:') {
    throw new Error(`invalid websocket protocol: ${parsed.protocol}`)
  }
  const Ctor = globalThis.WebSocket as unknown as new (url: string, init: { headers: Record<string, string> }) => WebSocketLike
  if (typeof Ctor !== 'function') throw new Error('no global WebSocket: Node 24 or newer is required')
  return new Ctor(parsed.href, { headers })
}

/** The text of a message event. */
export function frameText(data: unknown): string {
  if (typeof data === 'string') return data
  if (data instanceof ArrayBuffer) return new TextDecoder().decode(data)
  if (ArrayBuffer.isView(data)) return new TextDecoder().decode(data)
  return String(data)
}
