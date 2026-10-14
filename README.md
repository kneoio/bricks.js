# Bricks.js

A breakout-style brick court you can drop into a JavaScript app. It opens in its own window so someone can play while a long operation runs. The page underneath keeps working.

The play is the familiar portrait breaker: the ball rides the paddle until you launch it, the hit point on the paddle sets the angle, and each cleared board is faster with another row of bricks. Three lives. This is an original game. It does not use the art or code from any other breakout page.

No dependencies. Sound is off until the player turns it on.

## Play the demo

```bash
npm run demo
```

Open `http://localhost:5181`. **Run a long job** opens the court and pushes progress into the window. The notes field stays editable the whole time.

## Use it while a job runs

```js
import { Bricks } from 'bricks.js'

await Bricks.during(async (box) => {
  for (let step = 1; step <= 5; step++) {
    box.setStatus('Step ' + step + ' of 5')
    box.setProgress(step / 5)
    await doStep(step)
  }
}, { title: 'Packaging build' })
```

`during` closes the window when the task settles, including when the task throws. The promise result is unchanged. Closing the window does not cancel your task.

Pass `keepOpen: true` to leave the court up.

A promise works too, if you do not need to update the status:

```js
await Bricks.during(fetch('/api/export'), { title: 'Exporting' })
```

## Open it yourself

```js
const box = Bricks.open({
  title: 'Exporting report',
  status: 'Starting…',
  position: 'bottom-right', // or 'bottom-left' or 'center'
})

box.setStatus('Uploading part 2')
box.setProgress(0.4)

box.close()
```

## Mount it in your own panel

```js
const box = Bricks.mount(document.querySelector('#side'), {
  title: 'While you wait',
})
```

Or drop in the custom element. The module registers it on import.

```html
<script type="module" src="./src/index.js"></script>
<brick-box title="Uploading" style="height: 640px"></brick-box>
```

```js
const el = document.querySelector('brick-box')
el.setStatus('Verifying')
el.setProgress(0.8)
```

## Controls

| Input | Action |
| --- | --- |
| Click the court | Play. On a served ball, launch it |
| Mouse or touch | Move the paddle |
| Arrow keys or A and D | Move the paddle while the court is focused |
| Space | Launch, continue, or play again |
| Esc | Hand focus back to the page |

Clear the bricks to climb a level. The best score stays in this browser. Closing the window, or finishing the job, ends the session.

## Options

| Option | Meaning |
| --- | --- |
| `title` | Window title |
| `status` | Line next to the title. `setStatus` updates it |
| `position` | `bottom-right` (default), `bottom-left`, or `center` |
| `width`, `height` | Floating window size in pixels |
| `keepOpen` | `during` leaves the window open |
| `sound` | Start unmuted |
| `onClose`, `onLevel`, `onScore` | Hooks |

`getStats()` returns score, best, lives, level, phase, bricks left, and whether the player has clicked into the game.

Drag the title bar to move the floating window. Drag the corner to resize it.

## Tests

```bash
npm test
```

## License

MIT
