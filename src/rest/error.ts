/**
 * An error answer of the REST API, in the shape `{message, code}`:
 * `message` is the server's message, `status`, `method` and `path` say where
 * (an interaction or webhook token in `path` is replaced by `:token`).
 */
export class RestError extends Error {
  override name = 'RestError'
  /** HTTP status. */
  readonly status: number
  /** The JSON error code: 10003 unknown channel, 10008 unknown message, 50013 missing permissions, 50035 invalid form body, 0 plain HTTP errors. */
  readonly code: number
  /** The parsed body (or the raw text when it was not JSON). */
  readonly body: unknown
  readonly method: string
  readonly path: string
  /** Seconds to wait, on a 429 that ran out of retries. */
  readonly retryAfter: number | undefined
  /** Whether a 429 hit the bot's overall limit. */
  readonly global: boolean | undefined

  constructor(init: {
    status: number
    method: string
    path: string
    body: unknown
    retryAfter?: number
    global?: boolean
  }) {
    const b = (typeof init.body === 'object' && init.body !== null ? init.body : {}) as { message?: unknown; code?: unknown }
    const message = typeof b.message === 'string' ? b.message : `HTTP ${init.status}`
    super(message)
    this.status = init.status
    this.code = typeof b.code === 'number' ? b.code : 0
    this.body = init.body
    this.method = init.method
    this.path = init.path
    this.retryAfter = init.retryAfter
    this.global = init.global
  }
}

/**
 * A 404 answer of the REST API (e.g. unknown or inaccessible attachment, message, channel).
 */
export class NotFoundError extends RestError {
  override name = 'NotFoundError'
}

/**
 * Thrown when an attachment exceeds the configured maxBytes limit, either
 * indicated by the Content-Length header or while streaming chunks.
 */
export class MaxBytesExceededError extends Error {
  override name = 'MaxBytesExceededError'
  readonly maxBytes: number
  readonly bytes?: number

  constructor(maxBytes: number, bytes?: number) {
    const message = bytes !== undefined
      ? `Attachment exceeds maximum size of ${maxBytes} bytes (got ${bytes})`
      : `Attachment exceeds maximum size of ${maxBytes} bytes`
    super(message)
    this.maxBytes = maxBytes
    this.bytes = bytes
  }
}

/**
 * Thrown when a JSON or error answer of the REST API is larger than the
 * client reads (16 MiB).
 */
export class ResponseTooLargeError extends Error {
  override name = 'ResponseTooLargeError'
  readonly maxBytes: number
  /** The HTTP status of the answer. */
  readonly status: number

  constructor(maxBytes: number, status: number) {
    super(`the answer (HTTP ${status}) exceeds ${maxBytes} bytes, the most the client reads`)
    this.maxBytes = maxBytes
    this.status = status
  }
}

/**
 * Thrown when a request got no answer (the connection failed, for example).
 * The message names the method and the route with an interaction or webhook
 * token replaced by `:token`, and the underlying error's message with the
 * token replaced likewise; `cause` is set only for a route without a token.
 * Aborts and timeouts are thrown as they are (`AbortError`, `TimeoutError`).
 */
export class RequestFailedError extends Error {
  override name = 'RequestFailedError'
  readonly method: string
  readonly path: string

  constructor(init: { method: string; path: string; message: string; cause?: unknown }) {
    super(`${init.method} ${init.path} failed: ${init.message}`, init.cause === undefined ? undefined : { cause: init.cause })
    this.method = init.method
    this.path = init.path
  }
}
