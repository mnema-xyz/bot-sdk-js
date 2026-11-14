import assert from 'node:assert/strict'
import { afterEach, describe, test } from 'node:test'
import {
  MaxBytesExceededError,
  NotFoundError,
  RestClient,
  RestError,
} from '../src/index.ts'
import { startHttpServer, type Handler, type TestHttpServer } from './helpers/httpServer.ts'

let server: TestHttpServer | undefined

afterEach(async () => {
  await server?.close()
  server = undefined
})

async function client(handler: Handler): Promise<RestClient> {
  server = await startHttpServer(handler)
  return new RestClient({ baseUrl: `${server.url}/`, token: 'mnb_secret' })
}

async function readAll(stream: ReadableStream<Uint8Array>): Promise<Buffer> {
  const chunks: Uint8Array[] = []
  const reader = stream.getReader()
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    if (value) chunks.push(value)
  }
  return Buffer.concat(chunks)
}

describe('downloadAttachment', () => {
  test('happy path streams the file and parses headers', async () => {
    const rest = await client((req, res) => {
      res.writeHead(200, {
        'Content-Type': 'image/png',
        'Content-Length': '12',
        'Content-Disposition': 'attachment; filename="screenshot.png"',
      })
      res.end(Buffer.from('png-bytes-12'))
    })

    const dl = await rest.downloadAttachment('att-123')
    assert.equal(dl.contentType, 'image/png')
    assert.equal(dl.size, 12)
    assert.equal(dl.filename, 'screenshot.png')

    const body = await readAll(dl.stream)
    assert.equal(body.toString('utf8'), 'png-bytes-12')

    const r = server!.requests[0]!
    assert.equal(r.method, 'GET')
    assert.equal(r.url, '/api/bot/v1/media/att-123')
    assert.equal(r.headers.authorization, 'Bot mnb_secret')
  })

  test('maxBytes exceeded by the Content-Length header aborts before streaming', async () => {
    const rest = await client((req, res) => {
      res.writeHead(200, {
        'Content-Type': 'application/pdf',
        'Content-Length': '2048',
      })
      res.end(Buffer.alloc(2048, 1))
    })

    await assert.rejects(
      rest.downloadAttachment('att-large', { maxBytes: 1024 }),
      (err: unknown) => {
        assert.ok(err instanceof MaxBytesExceededError)
        assert.equal(err.maxBytes, 1024)
        assert.equal(err.bytes, 2048)
        assert.match(err.message, /exceeds maximum size of 1024 bytes/)
        return true
      },
    )
  })

  test('maxBytes exceeded while streaming chunks errors the stream', async () => {
    const rest = await client((req, res) => {
      res.writeHead(200, {
        'Content-Type': 'application/octet-stream',
      })
      res.write(Buffer.alloc(400, 'a'))
      res.write(Buffer.alloc(400, 'b'))
      res.end()
    })

    const dl = await rest.downloadAttachment('att-chunked', { maxBytes: 500 })
    assert.equal(dl.contentType, 'application/octet-stream')

    await assert.rejects(
      readAll(dl.stream),
      (err: unknown) => {
        assert.ok(err instanceof MaxBytesExceededError)
        assert.equal(err.maxBytes, 500)
        assert.equal(err.bytes, 800)
        return true
      },
    )
  })

  test('timeout aborts the request when the server stalls', async () => {
    const rest = await client(() => {
      // Intentionally do not reply to trigger timeout.
    })

    await assert.rejects(
      rest.downloadAttachment('att-slow', { timeoutMs: 50 }),
      (err: unknown) => {
        assert.ok(err instanceof Error)
        assert.equal(err.name, 'TimeoutError')
        return true
      },
    )
  })

  test('abort signal cancels the download', async () => {
    const rest = await client(() => {
      // Do nothing, wait for abort.
    })

    const controller = new AbortController()
    const promise = rest.downloadAttachment('att-abort', { signal: controller.signal })
    controller.abort()

    await assert.rejects(promise, (err: unknown) => {
      assert.ok(err instanceof Error)
      assert.equal(err.name, 'AbortError')
      return true
    })
  })

  test('404 maps to a typed NotFound error', async () => {
    const rest = await client((_req, res) => {
      res.writeHead(404, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ message: 'media not found', code: 10003 }))
    })

    await assert.rejects(
      rest.downloadAttachment('att-missing'),
      (err: unknown) => {
        assert.ok(err instanceof NotFoundError)
        assert.ok(err instanceof RestError)
        assert.equal(err.status, 404)
        assert.equal(err.code, 10003)
        assert.equal(err.message, 'media not found')
        return true
      },
    )
  })

  test('does not follow redirects', async () => {
    const rest = await client((_req, res) => {
      res.writeHead(302, { Location: 'https://evil.example.com/other' })
      res.end()
    })

    await assert.rejects(
      rest.downloadAttachment('att-redirect'),
      (err: unknown) => {
        assert.ok(err instanceof RestError)
        assert.equal(err.status, 302)
        return true
      },
    )
  })
})
