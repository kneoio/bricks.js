export interface BricksStats {
  score: number
  best: number
  lives: number
  level: number
  phase: 'serve' | 'play' | 'level' | 'over'
  bricks: number
  engaged: boolean
}

export interface BricksSession {
  closed: boolean
  setStatus(text: string): void
  setProgress(value: number): void
  focus(): void
  getStats(): BricksStats
  close(): void
  destroy(): void
}

export interface BricksOptions {
  title?: string
  status?: string
  width?: number
  height?: number
  zIndex?: number
  position?: 'bottom-right' | 'bottom-left' | 'center'
  /** Leave the window open when `during` finishes. */
  keepOpen?: boolean
  /** Start with sound on. Sound is off until the player opts in. */
  sound?: boolean
  onClose?: () => void
  onLevel?: (level: number) => void
  onScore?: (score: number) => void
}

export function open(options?: BricksOptions): BricksSession
export function mount(container: HTMLElement, options?: BricksOptions): BricksSession
export function during<T>(
  task: Promise<T> | ((box: BricksSession) => T | Promise<T>),
  options?: BricksOptions,
): Promise<T>

export const version: string

export const Bricks: {
  open: typeof open
  mount: typeof mount
  during: typeof during
  version: string
}
