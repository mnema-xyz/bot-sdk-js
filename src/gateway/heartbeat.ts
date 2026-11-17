// Heartbeats at the interval HELLO gave, the first one after a random part of
// it (jitter), and the detection of a connection whose ACKs stopped.
import { isRecord } from '../util.ts'

// Bounds of the heartbeat interval the SDK accepts from HELLO: a server that
// says 0 must not make it beat in a tight loop, one that says a day must not
// leave a dead connection undetected.
export const MIN_HEARTBEAT_MS = 1_000
export const MAX_HEARTBEAT_MS = 300_000

export class Heartbeat {
  private timer: ReturnType<typeof setTimeout> | undefined
  private acked = true
  private readonly beat: () => void
  private readonly onZombie: () => void
  private readonly random: () => number

  /** `beat` sends op 1; `onZombie` runs when an ACK is missing at the next beat. */
  constructor(beat: () => void, onZombie: () => void, random: () => number = Math.random) {
    this.beat = beat
    this.onZombie = onZombie
    this.random = random
  }

  start(intervalMs: number): void {
    this.stop()
    this.acked = true
    let interval = Number(intervalMs)
    if (!Number.isFinite(interval) || interval > MAX_HEARTBEAT_MS) {
      interval = MAX_HEARTBEAT_MS
    }
    if (interval < MIN_HEARTBEAT_MS) {
      interval = MIN_HEARTBEAT_MS
    }
    const tick = () => {
      if (!this.acked) {
        this.stop()
        this.onZombie()
        return
      }
      this.now()
      this.timer = setTimeout(tick, interval)
    }
    let firstDelay = Math.floor(interval * this.random())
    if (!Number.isFinite(firstDelay) || firstDelay > MAX_HEARTBEAT_MS) {
      firstDelay = MAX_HEARTBEAT_MS
    }
    if (firstDelay < 0) {
      firstDelay = 0
    }
    this.timer = setTimeout(tick, firstDelay)
  }

  /** Sends a heartbeat at once (also when the server asks with op 1). */
  now(): void {
    this.acked = false
    this.beat()
  }

  ack(): void {
    this.acked = true
  }

  stop(): void {
    clearTimeout(this.timer)
    this.timer = undefined
  }
}

/** The HELLO interval clamped to sane bounds, or undefined when there is none. */
export function heartbeatInterval(d: unknown): number | undefined {
  if (!isRecord(d) || typeof d.heartbeat_interval !== 'number' || !Number.isFinite(d.heartbeat_interval)) return undefined
  return Math.min(MAX_HEARTBEAT_MS, Math.max(MIN_HEARTBEAT_MS, d.heartbeat_interval))
}
