// Reading answer bodies within a size bound.
import { ResponseTooLargeError } from './error.ts'

/** The largest JSON or error answer the client reads (16 MiB, the Go SDK's bound too). */
export const MAX_RESPONSE_BYTES = 16 * 1024 * 1024

/**
 * The body of res, parsed when it is JSON, else its text (undefined when
 * empty). A body beyond maxBytes, by its Content-Length or while it streams,
 * is cancelled and throws ResponseTooLargeError.
 */
export async function readBody(res: Response, maxBytes = MAX_RESPONSE_BYTES): Promise<unknown> {
  const text = await readText(res, maxBytes)
  if (text === '') return undefined
  if ((res.headers.get('content-type') ?? '').includes('json')) {
    try {
      return JSON.parse(text)
    } catch {
      return text
    }
  }
  return text
}

async function readText(res: Response, maxBytes: number): Promise<string> {
  const length = Number(res.headers.get('content-length') ?? Number.NaN)
  if (Number.isFinite(length) && length > maxBytes) {
    await res.body?.cancel()
    throw new ResponseTooLargeError(maxBytes, res.status)
  }
  if (!res.body) return ''
  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let text = ''
  let read = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) return text + decoder.decode()
    read += value.byteLength
    if (read > maxBytes) {
      await reader.cancel()
      throw new ResponseTooLargeError(maxBytes, res.status)
    }
    text += decoder.decode(value, { stream: true })
  }
}
