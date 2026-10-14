import { VIEW_H, VIEW_W, court } from './constants.js'

export function createRenderer(ctx) {
  const w = VIEW_W
  const h = VIEW_H

  function draw(match) {
    const box = court()
    ctx.fillStyle = '#100e0b'
    ctx.fillRect(0, 0, w, h)

    ctx.fillStyle = '#3c3426'
    ctx.fillRect(0, 0, box.left, h)
    ctx.fillRect(box.right, 0, w - box.right, h)
    ctx.fillRect(0, 0, w, box.top)

    for (const brick of match.bricks) {
      if (!brick.alive) continue
      ctx.fillStyle = brick.color
      ctx.fillRect(brick.x, brick.y, brick.w, brick.h)
    }

    const paddle = match.paddle
    ctx.fillStyle = '#f0e2bc'
    ctx.fillRect(paddle.x, paddle.y, paddle.w, paddle.h)

    const ball = match.ball
    for (const bit of match.trail) {
      ctx.globalAlpha = Math.max(0, bit.life) * 0.28
      ctx.fillStyle = '#e7c56a'
      ctx.beginPath()
      ctx.arc(bit.x, bit.y, ball.r * bit.life * 0.7, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.globalAlpha = 1
    ctx.fillStyle = '#f3e6c4'
    ctx.beginPath()
    ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2)
    ctx.fill()

    for (const bit of match.particles) {
      ctx.globalAlpha = Math.max(0, bit.life * 2)
      ctx.fillStyle = bit.color
      ctx.fillRect(bit.x, bit.y, bit.size, bit.size)
    }
    ctx.globalAlpha = 1

    if (match.phase === 'serve') {
      ctx.fillStyle = '#d9c89a'
      ctx.font = '12px ui-monospace, "Cascadia Code", Menlo, Consolas, monospace'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('click or space to launch', w / 2, paddle.y - 28)
    }
  }

  return { draw, width: w, height: h }
}
