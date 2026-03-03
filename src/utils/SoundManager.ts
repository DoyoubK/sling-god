/**
 * SoundManager — Web Audio API 기반 효과음/배경음 생성
 * 외부 파일 없이 오실레이터로 직접 사운드 합성
 */
export class SoundManager {
  private static instance: SoundManager
  private ctx: AudioContext | null = null
  private bgGain: GainNode | null = null
  private bgOscillators: OscillatorNode[] = []
  private isBgPlaying = false
  private isMuted = false

  static getInstance(): SoundManager {
    if (!SoundManager.instance) SoundManager.instance = new SoundManager()
    return SoundManager.instance
  }

  private getCtx(): AudioContext {
    if (!this.ctx) this.ctx = new AudioContext()
    return this.ctx
  }

  get muted() { return this.isMuted }

  toggleMute() {
    this.isMuted = !this.isMuted
    if (this.bgGain) this.bgGain.gain.value = this.isMuted ? 0 : 0.06
    return this.isMuted
  }

  // ── 발사음: 고무줄 튕기는 느낌 ─────────────────────────────────
  playShoot() {
    if (this.isMuted) return
    const ctx = this.getCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain); gain.connect(ctx.destination)

    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(300, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.15)

    gain.gain.setValueAtTime(0.4, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18)

    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.2)
  }

  // ── 명중음: 퍽! 하는 타격감 ────────────────────────────────────
  playHit() {
    if (this.isMuted) return
    const ctx = this.getCtx()

    // 저음 펀치
    const osc1 = ctx.createOscillator()
    const g1 = ctx.createGain()
    osc1.connect(g1); g1.connect(ctx.destination)
    osc1.type = 'sine'
    osc1.frequency.setValueAtTime(180, ctx.currentTime)
    osc1.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.12)
    g1.gain.setValueAtTime(0.5, ctx.currentTime)
    g1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15)
    osc1.start(ctx.currentTime); osc1.stop(ctx.currentTime + 0.15)

    // 노이즈 레이어 (버퍼)
    const bufferSize = ctx.sampleRate * 0.1
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * 0.3
    const noise = ctx.createBufferSource()
    noise.buffer = buffer
    const gNoise = ctx.createGain()
    noise.connect(gNoise); gNoise.connect(ctx.destination)
    gNoise.gain.setValueAtTime(0.3, ctx.currentTime)
    gNoise.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1)
    noise.start(ctx.currentTime)
  }

  // ── Miss 음: 낮고 짧은 실패음 ──────────────────────────────────
  playMiss() {
    if (this.isMuted) return
    const ctx = this.getCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain); gain.connect(ctx.destination)
    osc.type = 'sine'
    osc.frequency.setValueAtTime(220, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.25)
    gain.gain.setValueAtTime(0.25, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28)
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.3)
  }

  // ── 레벨클리어: 밝은 상승 팡파레 ──────────────────────────────
  playClear() {
    if (this.isMuted) return
    const ctx = this.getCtx()
    const notes = [523, 659, 784, 1047] // C5 E5 G5 C6
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain); gain.connect(ctx.destination)
      osc.type = 'triangle'
      const t = ctx.currentTime + i * 0.12
      osc.frequency.setValueAtTime(freq, t)
      gain.gain.setValueAtTime(0.3, t)
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25)
      osc.start(t); osc.stop(t + 0.28)
    })
  }

  // ── 게임오버: 낮고 무거운 하강음 ──────────────────────────────
  playGameOver() {
    if (this.isMuted) return
    const ctx = this.getCtx()
    const notes = [392, 330, 262, 196] // G4 E4 C4 G3
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain); gain.connect(ctx.destination)
      osc.type = 'sawtooth'
      const t = ctx.currentTime + i * 0.18
      osc.frequency.setValueAtTime(freq, t)
      gain.gain.setValueAtTime(0.2, t)
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3)
      osc.start(t); osc.stop(t + 0.35)
    })
  }

  // ── 배경음: 루프 앰비언트 (가벼운 멜로디) ──────────────────────
  startBgm() {
    if (this.isBgPlaying || this.isMuted) return
    this.isBgPlaying = true
    const ctx = this.getCtx()

    this.bgGain = ctx.createGain()
    this.bgGain.gain.value = 0.06
    this.bgGain.connect(ctx.destination)

    // 단순한 2음 드론 화음
    const freqs = [261.6, 392.0] // C4, G4
    freqs.forEach(freq => {
      const osc = ctx.createOscillator()
      osc.type = 'sine'
      osc.frequency.value = freq
      osc.connect(this.bgGain!)
      osc.start()
      this.bgOscillators.push(osc)
    })
  }

  stopBgm() {
    this.bgOscillators.forEach(o => { try { o.stop() } catch {} })
    this.bgOscillators = []
    this.isBgPlaying = false
  }
}
