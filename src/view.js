const CSS = `
:host {
  display: block;
  color: #e7dcc0;
  font-family: ui-monospace, "Cascadia Code", "Segoe UI Mono", Menlo, Consolas, monospace;
  line-height: 1.35;
}
:host(.bricks-mount) { height: 100%; }
* { box-sizing: border-box; }
[hidden] { display: none !important; }
button {
  font: inherit;
  color: inherit;
  background: transparent;
  border: 0;
  padding: 0;
  cursor: pointer;
}
.win {
  display: flex;
  flex-direction: column;
  background: #14120e;
  border: 1px solid #3c3426;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 22px 60px rgba(0, 0, 0, 0.48);
  user-select: none;
}
header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 8px 8px 12px;
  background: #221e17;
  cursor: grab;
  touch-action: none;
}
header:active { cursor: grabbing; }
.title {
  letter-spacing: 0.16em;
  font-size: 12px;
  font-weight: 700;
  color: #f0e2bc;
}
.status {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #b7ab8e;
  font-size: 11px;
}
.tools { display: flex; gap: 2px; }
.tools button {
  width: 26px;
  height: 22px;
  border-radius: 6px;
  color: #cbbd96;
}
.tools button:hover { background: #3a3226; color: #fff8e8; }
.progress { height: 3px; background: #2a241c; }
.progress > div { height: 100%; width: 0; background: #d2a24a; }
.win.is-embed {
  height: 100%;
  border: 0;
  border-radius: 0;
  box-shadow: none;
}
.body { min-height: 0; display: flex; flex-direction: column; }
.win.is-embed .body { flex: 1; }
.stage-wrap { position: relative; width: 100%; background: #100e0b; }
.win.is-float .stage-wrap { aspect-ratio: 3 / 4; }
.win.is-embed .stage-wrap { flex: 1; min-height: 220px; }
canvas {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: contain;
  background: #100e0b;
  cursor: none;
  outline: none;
  touch-action: none;
}
.overlay, .panel {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 16px;
  text-align: center;
  background: rgba(8, 7, 5, 0.42);
  color: #f3e6c4;
}
.overlay { cursor: pointer; }
.overlay strong, .panel strong {
  letter-spacing: 0.18em;
  font-size: 15px;
}
.overlay span, .panel p {
  max-width: 26em;
  margin: 0;
  font-size: 12px;
  color: #d9c89a;
}
.panel button, .retry {
  border: 1px solid #6a5430;
  border-radius: 999px;
  padding: 6px 12px;
  color: #f0e2bc;
}
.hud {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  padding: 7px 10px 0;
  font-size: 12px;
}
.hud b { color: #f0e2bc; font-weight: 700; margin-right: 4px; }
.hud b.low { color: #e15a4a; }
.hud i { font-style: normal; color: #8d826c; font-size: 10px; letter-spacing: 0.08em; }
footer {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  align-items: center;
  padding: 6px 10px 8px;
  color: #8d826c;
  font-size: 10px;
}
.sound {
  border: 1px solid #3c3426;
  border-radius: 999px;
  padding: 3px 8px;
  color: #d9c89a;
  flex: none;
}
.win.is-min .body { display: none; }
`

function el(root, sel) {
  return root.querySelector(sel)
}

function setText(node, value) {
  const next = String(value)
  if (node.textContent !== next) node.textContent = next
}

export function createShell(host, options) {
  const shadow = host.attachShadow({ mode: 'open' })
  shadow.innerHTML = `<style>${CSS}</style>
    <div class="win" role="application" aria-label="Bricks">
      <header data-drag>
        <div class="title"></div>
        <div class="status"></div>
        <div class="tools">
          <button type="button" data-act="min" title="Minimize" aria-label="Minimize">–</button>
          <button type="button" data-act="close" title="Close" aria-label="Close">×</button>
        </div>
      </header>
      <div class="progress" hidden><div></div></div>
      <div class="body">
        <div class="stage-wrap">
          <div class="stage"></div>
          <div class="overlay">
            <strong>CLICK TO PLAY</strong>
            <span>The job keeps running. Esc returns you to the page.</span>
          </div>
          <div class="panel level" hidden>
            <strong data-k="level-title">LEVEL 2</strong>
            <p>The ball is faster and the board is taller.</p>
            <button type="button" data-act="next">Continue</button>
          </div>
          <div class="panel over" hidden>
            <strong>NO BALLS LEFT</strong>
            <p data-k="final">Score 0</p>
            <button type="button" class="retry" data-act="retry">Play again</button>
          </div>
        </div>
        <div class="hud">
          <span><b data-k="score">0</b><i>SCORE</i></span>
          <span><b data-k="best">0</b><i>BEST</i></span>
          <span><b data-k="level">1</b><i>LEVEL</i></span>
          <span><b data-k="lives">♥♥♥</b><i>LIVES</i></span>
        </div>
        <footer>
          <span>Mouse or arrows move · click or space launches · Esc page</span>
          <button type="button" data-act="sound" class="sound">Unmute</button>
        </footer>
      </div>
    </div>`

  const win = el(shadow, '.win')
  win.classList.add(options.mode === 'embed' ? 'is-embed' : 'is-float')
  const stage = el(shadow, '.stage')
  stage.style.cssText = 'position:absolute;inset:0;'
  const els = {
    title: el(shadow, '.title'),
    status: el(shadow, '.status'),
    bar: el(shadow, '.progress'),
    fill: el(shadow, '.progress > div'),
    score: el(shadow, '[data-k="score"]'),
    best: el(shadow, '[data-k="best"]'),
    level: el(shadow, '[data-k="level"]'),
    lives: el(shadow, '[data-k="lives"]'),
    levelTitle: el(shadow, '[data-k="level-title"]'),
    final: el(shadow, '[data-k="final"]'),
    play: el(shadow, '.overlay'),
    levelPanel: el(shadow, '.level'),
    over: el(shadow, '.over'),
    sound: el(shadow, '[data-act="sound"]'),
    canvas: null,
  }
  setText(els.title, options.title || 'BRICKS')
  setText(els.status, options.status || 'Play while you wait')

  const api = {
    host,
    shadow,
    stage,
    els,
    handlers: {
      close() {},
      play() {},
      next() {},
      retry() {},
      sound() {},
    },
    setStatus(text) {
      setText(els.status, text ?? '')
    },
    setProgress(value) {
      const n = Number(value)
      if (!Number.isFinite(n)) return
      const clamped = Math.max(0, Math.min(1, n))
      els.bar.hidden = false
      els.fill.style.width = (clamped * 100).toFixed(1) + '%'
    },
    setSoundLabel(muted) {
      setText(els.sound, muted ? 'Unmute' : 'Mute')
    },
    sync(match, engaged) {
      setText(els.score, match.score)
      setText(els.best, match.best)
      setText(els.level, match.level)
      setText(els.lives, match.lives > 0 ? '♥'.repeat(match.lives) : '·')
      els.lives.classList.toggle('low', match.lives <= 1)
      setText(els.levelTitle, 'LEVEL ' + match.level)
      setText(els.final, 'Score ' + match.score)
      els.play.hidden = engaged
      els.levelPanel.hidden = match.phase !== 'level'
      els.over.hidden = match.phase !== 'over'
    },
  }

  el(shadow, '[data-act="close"]').addEventListener('click', () => api.handlers.close())
  el(shadow, '[data-act="min"]').addEventListener('click', () => {
    const next = !win.classList.contains('is-min')
    win.classList.toggle('is-min', next)
    if (options.mode === 'float') {
      if (next) {
        host.dataset.prevHeight = host.style.height
        host.style.height = 'auto'
        host.style.resize = 'none'
      } else {
        host.style.height = host.dataset.prevHeight || ''
        host.style.resize = 'both'
      }
    }
  })
  el(shadow, '[data-act="sound"]').addEventListener('click', () => api.handlers.sound())
  el(shadow, '[data-act="next"]').addEventListener('click', (event) => {
    event.stopPropagation()
    api.handlers.next()
  })
  el(shadow, '[data-act="retry"]').addEventListener('click', (event) => {
    event.stopPropagation()
    api.handlers.retry()
  })
  els.play.addEventListener('click', () => api.handlers.play())
  els.over.addEventListener('click', (event) => {
    if (event.target.closest('button')) return
    api.handlers.retry()
  })

  if (options.mode === 'float') {
    const header = el(shadow, 'header')
    header.addEventListener('pointerdown', (event) => {
      if (event.button !== 0 || event.target.closest('button')) return
      const rect = host.getBoundingClientRect()
      host.style.transform = 'none'
      host.style.left = rect.left + 'px'
      host.style.top = rect.top + 'px'
      host.style.right = 'auto'
      host.style.bottom = 'auto'
      const dx = event.clientX - rect.left
      const dy = event.clientY - rect.top
      header.setPointerCapture(event.pointerId)
      const move = (ev) => {
        const maxX = Math.max(0, window.innerWidth - 80)
        const maxY = Math.max(0, window.innerHeight - 40)
        host.style.left = Math.min(maxX, Math.max(-rect.width + 80, ev.clientX - dx)) + 'px'
        host.style.top = Math.min(maxY, Math.max(0, ev.clientY - dy)) + 'px'
      }
      const up = () => {
        header.removeEventListener('pointermove', move)
        header.removeEventListener('pointerup', up)
      }
      header.addEventListener('pointermove', move)
      header.addEventListener('pointerup', up)
    })
  }

  return api
}
