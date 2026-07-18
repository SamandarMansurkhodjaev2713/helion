import { SOUND } from './constants'

/** The discrete sounds the interface can ask for. */
export type SoundCue = 'tick' | 'select' | 'open' | 'close' | 'scene'

/**
 * A tiny synthesised sound engine — no audio files ship with the site.
 *
 * The bed is a pair of detuned low oscillators through a lowpass filter with a
 * slow LFO on the gain: a ship hum you feel more than hear. Cues are short
 * enveloped blips built from an oscillator or filtered noise.
 *
 * The AudioContext is created lazily on the first user-initiated enable (the
 * sound toggle), which satisfies autoplay policies everywhere. Everything is
 * torn down by `dispose()`.
 */
class SoundEngine {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private humNodes: OscillatorNode[] = []
  private lfo: OscillatorNode | null = null
  private noiseBuffer: AudioBuffer | null = null
  private started = false

  /** Create the context and the ambient bed. Must be called from a gesture. */
  async enable(): Promise<void> {
    if (this.started) {
      await this.ctx?.resume()
      return
    }
    const Ctor: typeof AudioContext | undefined =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return

    const ctx = new Ctor()
    this.ctx = ctx
    await ctx.resume()

    const master = ctx.createGain()
    master.gain.value = 0
    master.connect(ctx.destination)
    this.master = master

    // — Ambient bed: detuned low oscillators through a lowpass —
    const humGain = ctx.createGain()
    humGain.gain.value = SOUND.humGain
    const lowpass = ctx.createBiquadFilter()
    lowpass.type = 'lowpass'
    lowpass.frequency.value = 220
    humGain.connect(lowpass)
    lowpass.connect(master)

    for (const hz of SOUND.humHz) {
      const osc = ctx.createOscillator()
      osc.type = 'sine'
      osc.frequency.value = hz
      osc.connect(humGain)
      osc.start()
      this.humNodes.push(osc)
    }

    // Slow breathing so the bed never feels like a flat drone.
    const lfo = ctx.createOscillator()
    lfo.frequency.value = SOUND.humLfoHz
    const lfoGain = ctx.createGain()
    lfoGain.gain.value = SOUND.humGain * 0.6
    lfo.connect(lfoGain)
    lfoGain.connect(humGain.gain)
    lfo.start()
    this.lfo = lfo

    // Pre-render one second of noise, reused by every noise-based cue.
    const buffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1
    this.noiseBuffer = buffer

    this.started = true
    this.rampMaster(SOUND.masterGain, 1.6)
  }

  /** Fade the bed out but keep the graph alive for a quick re-enable. */
  mute(): void {
    this.rampMaster(0, 0.5)
  }

  /** Fade the bed back in. */
  unmute(): void {
    this.rampMaster(SOUND.masterGain, 1.2)
  }

  private rampMaster(target: number, seconds: number): void {
    if (!this.ctx || !this.master) return
    const now = this.ctx.currentTime
    this.master.gain.cancelScheduledValues(now)
    this.master.gain.setValueAtTime(this.master.gain.value, now)
    this.master.gain.linearRampToValueAtTime(target, now + seconds)
  }

  /** Play a short interface cue. No-op until the engine is enabled. */
  play(cue: SoundCue): void {
    const ctx = this.ctx
    const master = this.master
    if (!ctx || !master || ctx.state !== 'running') return
    const now = ctx.currentTime

    if (cue === 'open' || cue === 'close') {
      // A filtered noise swell — the breath of the film gate.
      if (!this.noiseBuffer) return
      const source = ctx.createBufferSource()
      source.buffer = this.noiseBuffer
      const band = ctx.createBiquadFilter()
      band.type = 'bandpass'
      band.frequency.value = cue === 'open' ? 620 : 380
      band.Q.value = 0.9
      const gain = ctx.createGain()
      const peak = 0.12
      const length = cue === 'open' ? 0.5 : 0.32
      gain.gain.setValueAtTime(0.0001, now)
      gain.gain.exponentialRampToValueAtTime(peak, now + length * 0.35)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + length)
      source.connect(band)
      band.connect(gain)
      gain.connect(master)
      source.start(now)
      source.stop(now + length + 0.05)
      return
    }

    // Blips: tick (hover), select (commit), scene (chapter change).
    const frequency =
      cue === 'select' ? SOUND.tickHz * 0.55 : cue === 'scene' ? SOUND.tickHz * 0.34 : SOUND.tickHz
    const decay = cue === 'tick' ? SOUND.tickDecay : SOUND.tickDecay * 2.4
    const osc = ctx.createOscillator()
    osc.type = cue === 'tick' ? 'square' : 'triangle'
    osc.frequency.value = frequency
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(SOUND.tickGain, now)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + decay)
    const shaper = ctx.createBiquadFilter()
    shaper.type = 'lowpass'
    shaper.frequency.value = 3200
    osc.connect(shaper)
    shaper.connect(gain)
    gain.connect(master)
    osc.start(now)
    osc.stop(now + decay + 0.02)
  }

  /** Release every audio node and close the context. */
  dispose(): void {
    this.humNodes.forEach((osc) => {
      try {
        osc.stop()
      } catch {
        // Already stopped — nothing to do.
      }
    })
    this.humNodes = []
    try {
      this.lfo?.stop()
    } catch {
      // Already stopped.
    }
    this.lfo = null
    this.noiseBuffer = null
    this.master = null
    this.started = false
    void this.ctx?.close()
    this.ctx = null
  }
}

/** One engine per document — the ambient bed must never be duplicated. */
export const soundEngine = new SoundEngine()
