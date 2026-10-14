export const VIEW_W = 360
export const VIEW_H = 480
export const COLS = 8
export const WALL = 12
export const BALL_R = 6
export const PADDLE_W = 74
export const PADDLE_H = 12
export const GAP = 4
export const BRICK_H = 18
export const BRICK_TOP = 26
export const MAX_ROWS = 6
export const LIVES = 3
export const ROW_COLORS = ['#c45a4a', '#d4923c', '#d2b15a', '#6d9a4a', '#3d8f86']

export function rowCount(level) {
  return Math.min(MAX_ROWS, 2 + Math.max(1, level))
}

export function ballSpeed(level) {
  return Math.min(520, 250 + (Math.max(1, level) - 1) * 32)
}

export function court() {
  return {
    left: WALL,
    right: VIEW_W - WALL,
    top: WALL,
    bottom: VIEW_H - 8,
    paddleY: VIEW_H - 34,
  }
}
