import { expect, test, type Page } from '@playwright/test'

async function thirtyItems(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem(
      'interior-moodboard:v1',
      JSON.stringify({
        version: 1,
        title: 'Thirty-piece study',
        width: 1000,
        height: 700,
        paletteId: 'sand',
        items: Array.from({ length: 30 }, (_, index) => ({
          id: `piece-${index}`,
          assetId: 'linen-sofa',
          x: (index % 6) * 150 + 20,
          y: Math.floor(index / 6) * 120 + 20,
          width: 140,
          height: 91,
        })),
      }),
    )
  })
  await page.goto('/')
  await expect(page.getByRole('button', { name: /^Select / })).toHaveCount(30)
}

async function noOverflow(page: Page) {
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(await page.evaluate(() => innerWidth))
}

test('desktop rail and 30 items retain immediate tracking and release feedback', async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await thirtyItems(page)
  const board = page.getByRole('group', { name: 'Moodboard items' })
  const library = page.locator('#library')
  const originalBoard = await board.boundingBox()
  await library.evaluate((element) => {
    element.scrollTop = element.scrollHeight
  })
  await expect(library.getByRole('button').last()).toBeInViewport()
  expect(await board.boundingBox()).toEqual(originalBoard)
  const item = board.getByRole('button', { name: /^Select / }).last()
  const box = (await item.boundingBox())!
  await page.mouse.move(box.x + 10, box.y + 10)
  await page.mouse.down()
  await expect(item).toHaveAttribute('data-dragging', 'true')
  await expect(item.locator('img')).toHaveCSS('transition-duration', '0s')
  await expect(item.locator('img')).toHaveCSS(
    'transform',
    'matrix(1, 0, 0, 1, 0, -3)',
  )
  await page.mouse.move(box.x - 20, box.y - 20, { steps: 12 })
  expect((await item.boundingBox())!.x).toBeCloseTo(box.x - 30, 0)
  await expect(item).toHaveCSS('transition-duration', '0s')
  await page.mouse.up()
  await expect(item).not.toHaveAttribute('data-dragging')
  await expect(item.locator('img')).toHaveCSS(
    'transition-duration',
    '0.14s, 0.14s',
  )
  await expect(item.locator('img')).toHaveCSS('transform', 'none')
  const stored = await page.evaluate(() =>
    localStorage.getItem('interior-moodboard:v1'),
  )
  await page.screenshot({
    path: testInfo.outputPath('desktop-30.png'),
    fullPage: true,
  })
  for (const width of [1024, 760, 390, 320]) {
    await page.setViewportSize({ width, height: 844 })
    await noOverflow(page)
    expect(
      await page.evaluate(() => localStorage.getItem('interior-moodboard:v1')),
    ).toBe(stored)
    if (width <= 760) {
      expect((await board.boundingBox())!.y).toBeLessThan(
        (await library.boundingBox())!.y,
      )
    }
  }
  await page.screenshot({
    path: testInfo.outputPath('narrow-320.png'),
    fullPage: true,
  })
  const title = page.getByRole('textbox', { name: 'Board title' })
  await title.fill('A'.repeat(80))
  await title.press('Enter')
  await noOverflow(page)
})

test.describe('touch and reduced motion', () => {
  test.use({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
    deviceScaleFactor: 3,
    reducedMotion: 'reduce',
  })
  test('30 items move and resize with touch while the page scrolls outside items', async ({
    page,
  }, testInfo) => {
    await thirtyItems(page)
    const board = page.getByRole('group', { name: 'Moodboard items' })
    const item = board.getByRole('button', { name: /^Select / }).first()
    const box = (await item.boundingBox())!
    const client = await page.context().newCDPSession(page)
    const touch = async (
      type: 'touchStart' | 'touchMove' | 'touchEnd',
      x = 0,
      y = 0,
    ) => {
      await client.send('Input.dispatchTouchEvent', {
        type,
        touchPoints: type === 'touchEnd' ? [] : [{ x, y, id: 1 }],
      })
    }
    await touch('touchStart', box.x + 10, box.y + 10)
    await expect(item).toHaveAttribute('data-dragging', 'true')
    await expect(item.locator('img')).toHaveCSS('transform', 'none')
    await touch('touchMove', box.x + 30, box.y + 25)
    await expect
      .poll(async () => (await item.boundingBox())!.x)
      .toBeCloseTo(box.x + 20, 0)
    await touch('touchEnd')
    await expect(item).not.toHaveAttribute('data-dragging')
    expect(
      await item
        .locator('img')
        .evaluate((element) =>
          parseFloat(getComputedStyle(element).transitionDuration),
        ),
    ).toBeLessThanOrEqual(0.00001)
    const handle = page.getByRole('button', { name: 'Resize selected item' })
    const handleBox = (await handle.boundingBox())!
    expect(handleBox.width).toBe(44)
    expect(handleBox.height).toBe(44)
    const originalWidth = (await item.boundingBox())!.width
    await touch('touchStart', handleBox.x + 22, handleBox.y + 22)
    await touch('touchMove', handleBox.x + 42, handleBox.y + 22)
    await touch('touchEnd')
    await expect
      .poll(async () => (await item.boundingBox())!.width)
      .toBeGreaterThan(originalWidth)
    await expect(item).toHaveCSS('touch-action', 'none')
    await expect(handle).toHaveCSS('touch-action', 'none')
    await expect(board).toHaveCSS('touch-action', 'auto')
    await expect(page.locator('#library')).toHaveCSS('touch-action', 'auto')
    await page.screenshot({
      path: testInfo.outputPath('touch-reduced-motion-30.png'),
      fullPage: true,
    })
    await touch('touchStart', 380, 650)
    for (let y = 620; y >= 320; y -= 30) {
      await touch('touchMove', 380, y)
      await page.evaluate(() => new Promise(requestAnimationFrame))
    }
    await touch('touchEnd')
    await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(100)
    await noOverflow(page)
    await client.detach()
  })
})
