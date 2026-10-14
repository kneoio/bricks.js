export function createAudio() {
  let ctx = null
  let muted = true

  function ac() {
    if (!ctx) ctx = new AudioContext()
    if (ctx.state === 'suspended') ctx.resume()
    return ctx
  }

  function tone(freq, dur, type, gain, at = 0) {
    const audio = ac()
    const t0 = audio.currentTime + at
    const osc = audio.createOscillator()
    const amp = audio.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(Math.max(1, freq), t0)
    amp.gain.setValueAtTime(gain, t0)
    amp.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
    osc.connect(amp)
    amp.connect(audio.destination)
    osc.start(t0)
    osc.stop(t0 + dur + 0.02)
  }

  const bank = {
    paddle() {
      tone(440, 0.05, 'square', 0.04)
    },
    wall() {
      tone(300, 0.04, 'sine', 0.03)
    },
    brick() {
      tone(620, 0.05, 'square', 0.04)
    },
    miss() {
      tone(180, 0.16, 'sawtooth', 0.05)
    },
    level() {
      tone(523, 0.08, 'sine', 0.04)
      tone(659, 0.09, 'sine', 0.04, 0.09)
      tone(784, 0.12, 'sine', 0.035, 0.18)
    },
    over() {
      tone(200, 0.18, 'sawtooth', 0.05)
      tone(110, 0.28, 'sawtooth', 0.045, 0.12)
    },
  }

  return {
    get muted() {
      return muted
    },
    setMuted(value) {
      muted = !!value
      if (!muted) ac()
    },
    play(name) {
      if (muted || !bank[name]) return
      bank[name]()
    },
  }
}
