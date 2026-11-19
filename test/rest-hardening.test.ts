import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { RestClient, RestError, ResponseTooLargeError, type RateLimitInfo } from '../src/index.ts'
import { MAX_RESPONSE_BYTES } from '../src/rest/body.ts'
import { redactPath } from '../src/rest/limits.ts'

const TOKEN = 'aW50ZXJhY3Rpb24tdG9rZW4tc2VjcmV0'

function recordingLogger(lines: string[]) {
  const log = (m: string) => void lines.push(m)
  return { debug: log, info: log, warn: log, error: log }
}

describe('interaction tokens in logs and errors', () => {
  test('an error answer and the debug log name the route without the token', async () => {
    const lines: string[] = []
    const fetch = async () => Response.json({ message: 'Unknown interaction', code: 10062 }, { status: 404 })
    const rest = new RestClient({ baseUrl: 'https://talk.example.org', token: 'mnb_secret', fetch, logger: recordingLogger(lines) })
    const err = (await rest.createInteractionResponse('i1', TOKEN, { type: 4, data: { content: 'hi' } }).catch((e: unknown) => e)) as RestError
    assert.ok(err instanceof RestError)
    assert.equal(err.path, '/interactions/i1/:token/callback')
    assert.ok(!`${err.message} ${err.stack} ${err.path}`.includes(TOKEN))
    assert.ok(lines.length > 0)
    for (const l of lines) assert.ok(!l.includes(TOKEN), l)
  })

  test('a 429 warning, the rate limit info and the final error leave the token out', async () => {
    const lines: string[] = []
    const infos: RateLimitInfo[] = []
    const fetch = async () => Response.json({ message: 'slow down', retry_after: 0.01 }, { status: 429 })
    const rest = new RestClient({
      baseUrl: 'https://talk.example.org', token: 'mnb_secret', fetch, maxRetries: 1,
      logger: recordingLogger(lines), onRateLimit: (i) => void infos.push(i),
    })
    const err = (await rest.createFollowup('i1', TOKEN, { content: 'x' }).catch((e: unknown) => e)) as RestError
    assert.equal(err.status, 429)
    assert.equal(err.path, '/interactions/i1/:token/followups')
    assert.ok(lines.some((l) => l.startsWith('rate limited on POST /interactions/i1/:token/followups')))
    for (const l of lines) assert.ok(!l.includes(TOKEN), l)
    for (const i of infos) assert.ok(!JSON.stringify(i).includes(TOKEN))
  })

  test('the request itself still goes to the real route', async () => {
    const urls: string[] = []
    const fetch = async (u: string | URL | Request) => {
      urls.push(String(u))
      return new Response(null, { status: 204 })
    }
    const rest = new RestClient({ baseUrl: 'https://talk.example.org', token: 'mnb_secret', fetch })
    await rest.deleteOriginalResponse('i1', TOKEN)
    assert.deepEqual(urls, [`https://talk.example.org/api/bot/v1/interactions/i1/${TOKEN}/messages/@original`])
  })

  test('redactPath replaces only the token segment', () => {
    assert.equal(redactPath('/interactions/i1/tok/callback'), '/interactions/i1/:token/callback')
    assert.equal(redactPath('/webhooks/app/tok?wait=true'), '/webhooks/app/:token?wait=true')
    assert.equal(redactPath('/interactions/i1'), '/interactions/i1')
    assert.equal(redactPath('/channels/c/messages'), '/channels/c/messages')
  })
})

describe('answer size bound', () => {
  function streamOf(total: number, pulled = { bytes: 0 }): ReadableStream<Uint8Array> {
    return new ReadableStream<Uint8Array>({
      pull(controller) {
        if (pulled.bytes >= total) return controller.close()
        const n = Math.min(1024 * 1024, total - pulled.bytes)
        pulled.bytes += n
        controller.enqueue(new Uint8Array(n).fill(0x20))
      },
    })
  }

  test('a streamed JSON answer beyond 16 MiB is not read to its end and throws', async () => {
    const pulled = { bytes: 0 }
    const body = streamOf(MAX_RESPONSE_BYTES * 4, pulled)
    const fetch = async () => new Response(body, { status: 200, headers: { 'content-type': 'application/json' } })
    const rest = new RestClient({ baseUrl: 'https://talk.example.org', token: 'mnb_secret', fetch })
    const err = await rest.getMe().catch((e: unknown) => e)
    assert.ok(err instanceof ResponseTooLargeError, String(err))
    assert.equal(err.maxBytes, 16 * 1024 * 1024)
    assert.match(err.message, /exceeds 16777216 bytes/)
    assert.ok(pulled.bytes < MAX_RESPONSE_BYTES * 2, `read ${pulled.bytes} bytes`)
  })

  test('an error answer whose Content-Length is beyond the bound throws without reading it', async () => {
    const fetch = async () => new Response(streamOf(MAX_RESPONSE_BYTES + 10), {
      status: 500, headers: { 'content-length': String(MAX_RESPONSE_BYTES + 10) },
    })
    const rest = new RestClient({ baseUrl: 'https://talk.example.org', token: 'mnb_secret', fetch })
    await assert.rejects(rest.getMe(), ResponseTooLargeError)
  })

  test('an answer of exactly 16 MiB is read', async () => {
    const fetch = async () => new Response(streamOf(MAX_RESPONSE_BYTES), { status: 200, headers: { 'content-type': 'text/plain' } })
    const rest = new RestClient({ baseUrl: 'https://talk.example.org', token: 'mnb_secret', fetch })
    const got = (await rest.request<string>('GET', '/users/@me'))
    assert.equal(got.length, MAX_RESPONSE_BYTES)
  })
})
