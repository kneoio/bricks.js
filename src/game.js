import { createAudio } from './audio.js'
import { VIEW_H, VIEW_W } from './constants.js'
import { createRenderer } from './render.js'
import { beginNext, createMatch, emptyInput, launch, resetMatch, step } from './sim.js'

const BEST_KEY = 'bricks.best'
const HANDLED = new Set(['ArrowLeft', 'ArrowRight', 'KeyA', 'KeyD', 'Space', 'Escape'])

function readBest() {
  try {
    return Number(localStorage.getItem(BEST_KEY)) || 0
  } catch {
    return 0
  }
}

function writeBest(score) {
  try {
    localStorage.setItem(BEST_KEY, String(score))
  } catch {
    /* private mode */
  }
}

export function createGame(shell, options = {}) {
  const canvas = document.createElement('canvas')
  canvas.width = VIEW_W
  canvas.height = VIEW_H
  canvas.tabIndex = 0
  canvas.setAttribute('aria-label', 'Bricks court')
  shell.stage.appendChild(canvas)
  shell.els.canvas = canvas

  const ctx = canvas.getContext('2d', { alpha: false })
  if (!ctx) throw new Error('Bricks could not get a canvas context')
  const renderer = createRenderer(ctx)
  const audio = createAudio()
  if (options.sound) audio.setMuted(false)
  shell.setSoundLabel(audio.muted)

  let match = createMatch(1)
  match.best = readBest()
  let engaged = false
  let focused = false
  let steer = 'keys'
  let pointerX = null
  let raf = 0
  let last = 0
  let loopOn = false
  let lastScore = 0
  let lastLevel = 1
  const keys = new Set()

  function axis() {
    let n = 0
    if (keys.has('ArrowLeft') || keys.has('KeyA')) n -= 1
    if (keys.has('ArrowRight') || keys.has('KeyD')) n += 1
    return n
  }

  function rememberScore() {
    if (match.score > match.best) {
      match.best = match.score
      writeBest(match.best)
    }
    if (match.score !== lastScore) {
      lastScore = match.score
      options.onScore?.(match.score)
    }
    if (match.level !== lastLevel) {
      lastLevel = match.level
      options.onLevel?.(match.level)
    }
  }

  function restart() {
    const best = Math.max(match.best, match.score, readBest())
    match = resetMatch(match)
    match.best = best
    lastScore = 0
    lastLevel = 1
  }

  function act() {
    if (!engaged) return
    if (match.phase === 'serve') {
      if (launch(match)) audio.play('paddle')
    } else if (match.phase === 'level') {
      beginNext(match)
    } else if (match.phase === 'over') {
      restart()
    }
  }

  function pointerFrom(event) {
    const rect = canvas.getBoundingClientRect()
    if (!rect.width) return
    pointerX = ((event.clientX - rect.left) / rect.width) * VIEW_W
    steer = 'pointer'
  }

  function frame(now) {
    raf = requestAnimationFrame(frame)
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 0
    last = now
    const input = emptyInput()
    if (focused) {
      input.axis = steer === 'keys' ? axis() : 0
      input.pointerX = steer === 'pointer' ? pointerX : null
    }
    const events = step(match, input, dt)
    for (const name of events) audio.play(name)
    rememberScore()
    shell.sync(match, engaged)
    renderer.draw(match)
  }

  function startLoop() {
    if (loopOn) return
    loopOn = true
    last = 0
    raf = requestAnimationFrame(frame)
  }

  function onKeyDown(event) {
    if (!HANDLED.has(event.code)) return
    if (event.code === 'Escape') {
      canvas.blur()
      return
    }
    if (!focused) return
    event.preventDefault()
    if (event.code === 'Space') {
      if (!event.repeat) act()
      return
    }
    keys.add(event.code)
    steer = 'keys'
  }

  function onKeyUp(event) {
    keys.delete(event.code)
  }

  function onFocus() {
    focused = true
  }

  function onBlur() {
    focused = false
    keys.clear()
  }

  function onPointerDown(event) {
    if (event.button !== 0) return
    canvas.focus()
    engaged = true
    pointerFrom(event)
    act()
  }

  function onPointerMove(event) {
    if (!engaged) return
    pointerFrom(event)
  }

  canvas.addEventListener('keydown', onKeyDown)
  canvas.addEventListener('keyup', onKeyUp)
  canvas.addEventListener('focus', onFocus)
  canvas.addEventListener('blur', onBlur)
  canvas.addEventListener('pointerdown', onPointerDown)
  canvas.addEventListener('pointermove', onPointerMove)
  canvas.addEventListener('contextmenu', (event) => event.preventDefault())

  shell.handlers.play = () => {
    engaged = true
    canvas.focus()
  }
  shell.handlers.next = () => {
    if (beginNext(match)) canvas.focus()
  }
  shell.handlers.retry = () => {
    restart()
    canvas.focus()
  }
  shell.handlers.sound = () => {
    audio.setMuted(!audio.muted)
    shell.setSoundLabel(audio.muted)
  }

  shell.sync(match, engaged)
  renderer.draw(match)
  startLoop()

  return {
    focus() {
      canvas.focus()
    },
    getStats() {
      return {
        score: match.score,
        best: match.best,
        lives: match.lives,
        level: match.level,
        phase: match.phase,
        bricks: match.bricks.filter((brick) => brick.alive).length,
        engaged,
      }
    },
    destroy() {
      loopOn = false
      cancelAnimationFrame(raf)
      canvas.remove()
    },
  }
}
