import assert from 'node:assert/strict'
import test from 'node:test'
import { COLS, VIEW_H, WALL, rowCount } from '../src/constants.js'
import { createRenderer } from '../src/render.js'
import {
  aliveCount,
  beginNext,
  createMatch,
  emptyInput,
  launch,
  resetMatch,
  step,
} from '../src/sim.js'

function play(match) {
  match.phase = 'play'
}

test('a new court has three rows inside the walls and the ball rides the paddle', () => {
  const match = createMatch(4)
  assert.equal(match.phase, 'serve')
  assert.equal(match.lives, 3)
  assert.equal(match.bricks.length, rowCount(1) * COLS)
  assert.equal(aliveCount(match), 24)
  for (const brick of match.bricks) {
    assert.ok(brick.x >= WALL - 0.01)
    assert.ok(brick.x + brick.w <= match.w - WALL + 0.01)
    assert.equal(brick.alive, true)
  }
  const parked = match.ball.x
  step(match, { ...emptyInput(), axis: 1 }, 0.12)
  assert.equal(match.phase, 'serve')
  assert.ok(match.ball.x > parked)
  assert.equal(match.ball.x, match.paddle.x + match.paddle.w / 2)
  assert.equal(match.ball.vy, 0)
})

test('launch sends the ball upward and the side of the paddle steers it', () => {
  const match = createMatch(9)
  assert.equal(launch(match), true)
  assert.equal(match.phase, 'play')
  assert.ok(match.ball.vy < 0)

  const again = createMatch(3)
  play(again)
  const paddle = again.paddle
  again.ball.x = paddle.x + paddle.w - 1
  again.ball.y = paddle.y - again.ball.r
  again.ball.vx = 0
  again.ball.vy = 240
  const events = step(again, emptyInput(), 1 / 60)
  assert.ok(events.includes('paddle'))
  assert.ok(again.ball.vy < 0)
  assert.ok(again.ball.vx > 0)

  again.ball.x = paddle.x + 1
  again.ball.y = paddle.y - again.ball.r
  again.ball.vx = 10
  again.ball.vy = 240
  step(again, emptyInput(), 1 / 60)
  assert.ok(again.ball.vx < 0)
})

test('a brick hit scores more for a higher row and a side wall bounces', () => {
  const match = createMatch(2)
  play(match)
  const brick = match.bricks[0]
  match.ball.x = brick.x + brick.w / 2
  match.ball.y = brick.y + brick.h + match.ball.r - 0.4
  match.ball.vx = 0
  match.ball.vy = -80
  const events = step(match, emptyInput(), 1 / 60)
  assert.equal(brick.alive, false)
  assert.equal(match.score, 10 * match.rows)
  assert.ok(match.ball.vy > 0)
  assert.ok(events.includes('brick'))

  match.ball.x = WALL
  match.ball.y = 220
  match.ball.vx = -300
  match.ball.vy = 0
  const wall = step(match, emptyInput(), 1 / 60)
  assert.ok(wall.includes('wall'))
  assert.ok(match.ball.vx > 0)
  assert.ok(match.ball.x > WALL)
})

test('dropping the ball costs a life and the last life ends the court', () => {
  const match = createMatch(5)
  play(match)
  match.ball.x = match.w / 2
  match.ball.y = VIEW_H + 30
  match.ball.vx = 0
  match.ball.vy = 80
  const missed = step(match, emptyInput(), 1 / 60)
  assert.ok(missed.includes('miss'))
  assert.equal(match.lives, 2)
  assert.equal(match.phase, 'serve')

  match.lives = 1
  play(match)
  match.score = 40
  match.ball.y = VIEW_H + 30
  match.ball.vy = 80
  const done = step(match, emptyInput(), 1 / 60)
  assert.ok(done.includes('over'))
  assert.equal(match.phase, 'over')
  assert.equal(match.lives, 0)
  assert.equal(match.best, 40)
  const again = resetMatch(match)
  assert.equal(again.phase, 'serve')
  assert.equal(again.lives, 3)
  assert.equal(again.level, 1)
  assert.equal(again.score, 0)
  assert.equal(again.best, 40)
})

test('clearing the board opens the next level with a taller stack', () => {
  const match = createMatch(6)
  play(match)
  for (const brick of match.bricks) brick.alive = false
  const last = match.bricks[match.bricks.length - 1]
  last.alive = true
  match.ball.x = last.x + last.w / 2
  match.ball.y = last.y + last.h + match.ball.r - 0.4
  match.ball.vx = 0
  match.ball.vy = -80
  const events = step(match, emptyInput(), 1 / 60)
  assert.ok(events.includes('level'))
  assert.equal(match.phase, 'level')
  assert.equal(match.level, 2)
  assert.equal(aliveCount(match), rowCount(2) * COLS)
  assert.equal(beginNext(match), true)
  assert.equal(match.phase, 'serve')
  assert.ok(match.ball.speed > 250)
})

test('one rendered frame paints the court', () => {
  const match = createMatch(1)
  let fills = 0
  const gradient = { addColorStop() {} }
  const ctx = {
    createLinearGradient() {
      return gradient
    },
    fillRect() {
      fills += 1
    },
    beginPath() {},
    moveTo() {},
    lineTo() {},
    stroke() {},
    arcTo() {},
    closePath() {},
    fill() {
      fills += 1
    },
    arc() {},
    set fillStyle(_value) {},
    set strokeStyle(_value) {},
    set lineWidth(_value) {},
    set globalAlpha(_value) {},
    set font(_value) {},
    set textAlign(_value) {},
    set textBaseline(_value) {},
    fillText() {},
  }
  const renderer = createRenderer(ctx)
  renderer.draw(match)
  assert.ok(fills > 10)
})
