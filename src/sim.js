import {
  BALL_R,
  BRICK_H,
  BRICK_TOP,
  COLS,
  GAP,
  LIVES,
  PADDLE_H,
  PADDLE_W,
  ROW_COLORS,
  VIEW_H,
  VIEW_W,
  ballSpeed,
  court,
  rowCount,
} from './constants.js'

export function emptyInput() {
  return { axis: 0, pointerX: null, launch: false }
}

function rand(match) {
  match.seed = (Math.imul(match.seed, 1664525) + 1013904223) >>> 0
  return match.seed / 4294967296
}

function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n))
}

function stick(match) {
  const ball = match.ball
  const paddle = match.paddle
  ball.x = paddle.x + paddle.w / 2
  ball.y = paddle.y - ball.r - 1
  ball.vx = 0
  ball.vy = 0
}

function layout(match) {
  const box = court()
  const rows = rowCount(match.level)
  const width = (box.right - box.left - GAP * (COLS - 1)) / COLS
  const bricks = []
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < COLS; col++) {
      bricks.push({
        x: box.left + col * (width + GAP),
        y: BRICK_TOP + row * (BRICK_H + GAP),
        w: width,
        h: BRICK_H,
        row,
        color: ROW_COLORS[row % ROW_COLORS.length],
        alive: true,
      })
    }
  }
  match.rows = rows
  match.bricks = bricks
}

export function createMatch(seed = 1) {
  const box = court()
  const match = {
    seed: seed >>> 0 || 1,
    phase: 'serve',
    score: 0,
    best: 0,
    lives: LIVES,
    level: 1,
    rows: 0,
    w: VIEW_W,
    h: VIEW_H,
    paddle: {
      x: (VIEW_W - PADDLE_W) / 2,
      y: box.paddleY,
      w: PADDLE_W,
      h: PADDLE_H,
      vx: 0,
    },
    ball: { x: 0, y: 0, vx: 0, vy: 0, r: BALL_R, speed: ballSpeed(1) },
    bricks: [],
    particles: [],
    trail: [],
  }
  layout(match)
  stick(match)
  return match
}

export function resetMatch(prev) {
  const next = createMatch((prev.seed + 1) >>> 0)
  next.best = Math.max(prev.best, prev.score)
  return next
}

export function launch(match) {
  if (match.phase !== 'serve') return false
  const off = rand(match) * 0.5 - 0.25
  const speed = match.ball.speed
  match.ball.vx = Math.sin(off) * speed
  match.ball.vy = -Math.cos(off) * speed
  match.phase = 'play'
  return true
}

export function beginNext(match) {
  if (match.phase !== 'level') return false
  match.phase = 'serve'
  stick(match)
  return true
}

function movePaddle(match, input, dt) {
  const box = court()
  const paddle = match.paddle
  const lo = box.left
  const hi = box.right - paddle.w
  if (input.pointerX != null && Number.isFinite(input.pointerX)) {
    const nx = clamp(input.pointerX - paddle.w / 2, lo, hi)
    paddle.vx = dt > 0 ? (nx - paddle.x) / dt : 0
    paddle.x = nx
    return
  }
  const axis = clamp(input.axis || 0, -1, 1)
  if (!axis) {
    paddle.vx *= 0.6
    return
  }
  paddle.vx = axis * 460
  paddle.x = clamp(paddle.x + paddle.vx * dt, lo, hi)
}

function burst(match, brick) {
  for (let i = 0; i < 8; i++) {
    match.particles.push({
      x: brick.x + brick.w / 2,
      y: brick.y + brick.h / 2,
      vx: (rand(match) - 0.5) * 220,
      vy: (rand(match) - 0.8) * 180,
      life: 0.4 + rand(match) * 0.15,
      color: brick.color,
      size: 2 + (i % 3),
    })
  }
  if (match.particles.length > 80) {
    match.particles.splice(0, match.particles.length - 80)
  }
}

function decayFx(match, dt) {
  for (let i = match.particles.length - 1; i >= 0; i--) {
    const bit = match.particles[i]
    bit.x += bit.vx * dt
    bit.y += bit.vy * dt
    bit.vy += 520 * dt
    bit.life -= dt
    if (bit.life <= 0) match.particles.splice(i, 1)
  }
  if (match.phase === 'play') {
    match.trail.push({ x: match.ball.x, y: match.ball.y, life: 1 })
    if (match.trail.length > 12) match.trail.shift()
  }
  for (let i = match.trail.length - 1; i >= 0; i--) {
    match.trail[i].life -= dt * 3.2
    if (match.trail[i].life <= 0) match.trail.splice(i, 1)
  }
}

function bouncePaddle(match) {
  const ball = match.ball
  const paddle = match.paddle
  const hit = clamp((ball.x - (paddle.x + paddle.w / 2)) / (paddle.w / 2), -1, 1)
  const ang = hit * 1.05
  const speed = Math.min(ball.speed + Math.min(80, Math.abs(paddle.vx) * 0.04), 560)
  ball.vx = Math.sin(ang) * speed
  ball.vy = -Math.cos(ang) * speed
  ball.y = paddle.y - ball.r - 0.2
}

function overlaps(ball, brick) {
  const nx = clamp(ball.x, brick.x, brick.x + brick.w)
  const ny = clamp(ball.y, brick.y, brick.y + brick.h)
  const dx = ball.x - nx
  const dy = ball.y - ny
  return dx * dx + dy * dy <= ball.r * ball.r
}

function bounceBrick(ball, brick) {
  const left = brick.x
  const right = brick.x + brick.w
  const top = brick.y
  const bottom = brick.y + brick.h
  const inside = ball.x > left && ball.x < right && ball.y > top && ball.y < bottom
  if (!inside) {
    const dx = ball.x - clamp(ball.x, left, right)
    const dy = ball.y - clamp(ball.y, top, bottom)
    if (Math.abs(dx) >= Math.abs(dy)) {
      ball.vx = dx < 0 ? -Math.abs(ball.vx) : Math.abs(ball.vx)
      ball.x = dx < 0 ? left - ball.r - 0.2 : right + ball.r + 0.2
    } else {
      ball.vy = dy < 0 ? -Math.abs(ball.vy) : Math.abs(ball.vy)
      ball.y = dy < 0 ? top - ball.r - 0.2 : bottom + ball.r + 0.2
    }
    return
  }
  const gaps = [ball.x - left, right - ball.x, ball.y - top, bottom - ball.y]
  const nearest = Math.min(...gaps)
  if (nearest === gaps[0]) {
    ball.vx = -Math.abs(ball.vx)
    ball.x = left - ball.r - 0.2
  } else if (nearest === gaps[1]) {
    ball.vx = Math.abs(ball.vx)
    ball.x = right + ball.r + 0.2
  } else if (nearest === gaps[2]) {
    ball.vy = -Math.abs(ball.vy)
    ball.y = top - ball.r - 0.2
  } else {
    ball.vy = Math.abs(ball.vy)
    ball.y = bottom + ball.r + 0.2
  }
}

function hitBricks(match, events) {
  const ball = match.ball
  for (const brick of match.bricks) {
    if (!brick.alive || !overlaps(ball, brick)) continue
    brick.alive = false
    bounceBrick(ball, brick)
    match.score += 10 * (match.rows - brick.row)
    burst(match, brick)
    events.push('brick')
    if (match.bricks.every((item) => !item.alive)) {
      match.level += 1
      match.phase = 'level'
      match.ball.speed = ballSpeed(match.level)
      match.ball.vx = 0
      match.ball.vy = 0
      layout(match)
      stick(match)
      events.push('level')
    }
    return
  }
}

function integrate(match, events, dt) {
  const ball = match.ball
  const box = court()
  const speed = Math.hypot(ball.vx, ball.vy) || ball.speed
  const steps = Math.max(1, Math.ceil((speed * dt) / ball.r))
  const slice = dt / steps
  for (let i = 0; i < steps; i++) {
    if (match.phase !== 'play') return
    ball.x += ball.vx * slice
    ball.y += ball.vy * slice
    if (ball.x - ball.r < box.left) {
      ball.x = box.left + ball.r
      ball.vx = Math.abs(ball.vx)
      if (!events.includes('wall')) events.push('wall')
    } else if (ball.x + ball.r > box.right) {
      ball.x = box.right - ball.r
      ball.vx = -Math.abs(ball.vx)
      if (!events.includes('wall')) events.push('wall')
    }
    if (ball.y - ball.r < box.top) {
      ball.y = box.top + ball.r
      ball.vy = Math.abs(ball.vy)
      if (!events.includes('wall')) events.push('wall')
    }
    const paddle = match.paddle
    const onPaddle =
      ball.vy > 0 &&
      ball.y + ball.r >= paddle.y &&
      ball.y <= paddle.y + paddle.h &&
      ball.x >= paddle.x - ball.r &&
      ball.x <= paddle.x + paddle.w + ball.r
    if (onPaddle) {
      bouncePaddle(match)
      events.push('paddle')
    }
    hitBricks(match, events)
    if (ball.y - ball.r > match.h && ball.vy >= 0) {
      match.lives -= 1
      if (match.lives <= 0) {
        match.phase = 'over'
        if (match.score > match.best) match.best = match.score
        events.push('over')
      } else {
        match.phase = 'serve'
        stick(match)
        events.push('miss')
      }
      return
    }
  }
}

export function step(match, input, dt) {
  const events = []
  const frame = Math.max(0, Math.min(0.05, dt || 0))
  if (match.phase === 'over') {
    decayFx(match, frame)
    return events
  }
  movePaddle(match, input, frame)
  if (match.phase === 'serve' || match.phase === 'level') stick(match)
  if (match.phase === 'play') integrate(match, events, frame)
  decayFx(match, frame)
  return events
}

export function aliveCount(match) {
  let n = 0
  for (const brick of match.bricks) if (brick.alive) n += 1
  return n
}
