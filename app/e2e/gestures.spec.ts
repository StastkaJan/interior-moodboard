import { expect, test } from '@playwright/test'

const key = 'interior-moodboard:v1'

for (const viewportWidth of [1440, 390]) {
  test.describe(`gestures at ${viewportWidth}px`, () => {
    test.use({ viewport: { width: viewportWidth, height: 900 } })

    for (const kind of ['move', 'resize'] as const) {
      test(`${kind}: release commits; cancellation and lost capture discard previews`, async ({
        page,
      }) => {
        await page.goto('/')
        await page
          .getByRole('button', { name: 'Add Linen sofa', exact: true })
          .click()
        const item = page.getByRole('button', {
          name: 'Select Linen sofa, item 1',
          exact: true,
        })
        const board = page.getByRole('group', { name: 'Moodboard items' })
        const target =
          kind === 'move'
            ? item
            : page.getByRole('button', { name: 'Resize selected item' })
        const stored = () =>
          page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), key)
        const before = await stored()
        const boardBox = (await board.boundingBox())!
        await target.scrollIntoViewIfNeeded()
        const box = (await target.boundingBox())!
        const start = { x: box.x + 8, y: box.y + 8 }
        const delta = boardBox.width * 0.1
        await page.mouse.move(start.x, start.y)
        await page.mouse.down()
        await page.mouse.move(
          start.x + delta,
          start.y + (kind === 'move' ? delta : 0),
          { steps: 4 },
        )
        await expect(item).toHaveAttribute('data-dragging', 'true')
        expect(await stored()).toEqual(before)
        await page.mouse.up()
        await expect(item).not.toHaveAttribute('data-dragging')
        await expect.poll(stored).not.toEqual(before)
        const after = await stored()
        if (kind === 'move') {
          expect(after.items[0].x).toBeCloseTo(before.items[0].x + 100, 0)
          expect(after.items[0].y).toBeCloseTo(before.items[0].y + 100, 0)
        } else {
          expect(after.items[0].width).toBeCloseTo(
            before.items[0].width + 100,
            0,
          )
          expect(after.items[0].height / after.items[0].width).toBeCloseTo(0.65)
        }
        for (const [name, field] of [
          ['Position X (units)', 'x'],
          ['Position Y (units)', 'y'],
          ['Width (units)', 'width'],
        ] as const) {
          await expect(
            page.getByRole('spinbutton', { name, exact: true }),
          ).toHaveValue(String(after.items[0][field]))
        }

        for (const interruption of ['pointercancel', 'lostpointercapture']) {
          await target.scrollIntoViewIfNeeded()
          const currentBox = (await target.boundingBox())!
          await page.mouse.move(currentBox.x + 8, currentBox.y + 8)
          await page.mouse.down()
          await page.mouse.move(currentBox.x + 25, currentBox.y + 8)
          await expect(item).toHaveAttribute('data-dragging', 'true')
          if (interruption === 'lostpointercapture') {
            await target.evaluate((element) => element.releasePointerCapture(1))
            await page.mouse.move(currentBox.x + 26, currentBox.y + 8)
          } else {
            await target.dispatchEvent(interruption, {
              pointerId: 1,
              bubbles: true,
            })
          }
          await expect(item).not.toHaveAttribute('data-dragging')
          await page.mouse.up()
          expect(await stored()).toEqual(after)
          expect(
            await item.evaluate((element) => parseFloat(element.style.width)),
          ).toBeCloseTo(after.items[0].width / 10)
          expect(
            await item.evaluate((element) => parseFloat(element.style.left)),
          ).toBeCloseTo(after.items[0].x / 10)
        }
      })
    }
  })
}

test('an unrelated pointer cannot change or end an active gesture', async ({
  page,
}) => {
  await page.goto('/')
  await page
    .getByRole('button', { name: 'Add Linen sofa', exact: true })
    .click()
  const item = page.getByRole('button', {
    name: 'Select Linen sofa, item 1',
    exact: true,
  })
  const box = (await item.boundingBox())!
  await page.mouse.move(box.x + 8, box.y + 8)
  await page.mouse.down()
  await page.mouse.move(box.x + 28, box.y + 18)
  await expect(item).toHaveAttribute('data-dragging', 'true')
  const preview = await item.getAttribute('style')
  const stored = await page.evaluate((key) => localStorage.getItem(key), key)
  for (const event of [
    'pointerdown',
    'pointermove',
    'pointerup',
    'pointercancel',
    'lostpointercapture',
  ]) {
    await item.dispatchEvent(event, {
      pointerId: 99,
      button: 0,
      clientX: box.x + 200,
      clientY: box.y + 200,
      bubbles: true,
    })
    await expect(item).toHaveAttribute('data-dragging', 'true')
    await expect(item).toHaveAttribute('style', preview!)
    expect(await page.evaluate((key) => localStorage.getItem(key), key)).toBe(
      stored,
    )
  }
  await page.mouse.up()
  await expect(item).not.toHaveAttribute('data-dragging')
  expect(await page.evaluate((key) => localStorage.getItem(key), key)).not.toBe(
    stored,
  )
})
