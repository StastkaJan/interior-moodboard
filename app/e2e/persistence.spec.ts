import { test, expect } from '@playwright/test'

const key = 'interior-moodboard:v1'
const saved = {
  version: 1,
  title: 'Stored room',
  width: 1000,
  height: 700,
  paletteId: 'sand',
  items: [
    {
      id: 'sofa',
      assetId: 'linen-sofa',
      x: 100,
      y: 100,
      width: 200,
      height: 130,
    },
  ],
}

test('hydrate before writes; previews do not save; release and reload preserve committed state', async ({
  page,
}) => {
  await page.addInitScript(
    ({ key, saved }) => {
      if (!localStorage.getItem(key))
        localStorage.setItem(key, JSON.stringify(saved))
      const native = Storage.prototype.setItem
      Object.assign(window, { writes: [] })
      Storage.prototype.setItem = function (k, value) {
        if (k === key)
          (window as unknown as { writes: string[] }).writes.push(value)
        return native.call(this, k, value)
      }
    },
    { key, saved },
  )
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Stored room' })).toBeVisible()
  const writes = () =>
    page.evaluate(() => (window as unknown as { writes: string[] }).writes)
  expect(await writes()).toHaveLength(0)
  const item = page.getByRole('button', {
    name: 'Select Linen sofa, item 1',
    exact: true,
  })
  const box = (await item.boundingBox())!
  await page.mouse.move(box.x + 10, box.y + 10)
  await page.mouse.down()
  await page.mouse.move(box.x + 35, box.y + 25, { steps: 3 })
  expect(await writes()).toHaveLength(0)
  await page.mouse.up()
  await expect.poll(async () => (await writes()).length).toBe(1)
  const committed = await page.evaluate((key) => localStorage.getItem(key), key)
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Stored room' })).toBeVisible()
  expect(await writes()).toHaveLength(0)
  expect(await page.evaluate((key) => localStorage.getItem(key), key)).toBe(
    committed,
  )
})

for (const raw of [
  '{ broken saved bytes',
  JSON.stringify({ ...saved, version: 2 }),
]) {
  test(`protected ${raw.startsWith('{ broken') ? 'invalid' : 'newer'} data survives edits and declined replacement`, async ({
    page,
  }) => {
    await page.addInitScript(({ key, raw }) => localStorage.setItem(key, raw), {
      key,
      raw,
    })
    await page.goto('/')
    await page
      .getByRole('button', { name: 'Add Linen sofa', exact: true })
      .click()
    expect(await page.evaluate((key) => localStorage.getItem(key), key)).toBe(
      raw,
    )
    page.once('dialog', async (dialog) => {
      expect(dialog.message()).toContain('permanently discarded')
      await dialog.dismiss()
    })
    const replace = page.getByRole('button', {
      name: 'Replace saved data with this board',
    })
    await replace.click()
    expect(await page.evaluate((key) => localStorage.getItem(key), key)).toBe(
      raw,
    )
    await expect(replace).toBeFocused()
    page.once('dialog', (dialog) => dialog.accept())
    await replace.click()
    await expect(
      page.getByRole('status').filter({ hasText: 'Saved on this device.' }),
    ).toHaveText('Saved on this device.')
    await expect(page.locator('#board')).toBeFocused()
    const board = await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key)!),
      key,
    )
    expect(board.items).toHaveLength(1)
  })
}

test('failed writes stay visible and editable; retry persists latest board', async ({
  page,
}) => {
  await page.addInitScript(() => {
    const native = Storage.prototype.setItem
    Object.assign(window, { failWrites: true })
    Storage.prototype.setItem = function (key, value) {
      if ((window as unknown as { failWrites: boolean }).failWrites)
        throw new DOMException('Quota exceeded')
      return native.call(this, key, value)
    }
  })
  await page.goto('/')
  await page
    .getByRole('button', { name: 'Add Linen sofa', exact: true })
    .click()
  await expect(
    page.getByRole('status').filter({ hasText: 'Changes could not be saved' }),
  ).toContainText('Changes could not be saved')
  await page
    .getByRole('button', { name: 'Add Linen sofa', exact: true })
    .click()
  await expect(
    page
      .getByRole('group', { name: 'Moodboard items' })
      .getByRole('button', { name: /^Select/ }),
  ).toHaveCount(2)
  await page.evaluate(() => {
    ;(window as unknown as { failWrites: boolean }).failWrites = false
  })
  await page.getByRole('button', { name: 'Retry saving' }).click()
  await expect(
    page.getByRole('status').filter({ hasText: 'Saved on this device.' }),
  ).toHaveText('Saved on this device.')
  expect(
    await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key)!).items.length,
      key,
    ),
  ).toBe(2)
})

test('unavailable initial read never automatically overwrites saved data even if writes work', async ({
  page,
}) => {
  await page.addInitScript(
    ({ key, saved }) => {
      localStorage.setItem(key, JSON.stringify(saved))
      const native = Storage.prototype.getItem
      Object.assign(window, { originalGet: native })
      Storage.prototype.getItem = function (k) {
        if (k === key) throw new DOMException('Read blocked')
        return native.call(this, k)
      }
    },
    { key, saved },
  )
  await page.goto('/')
  await expect(
    page
      .getByRole('status')
      .filter({ hasText: 'Saved data could not be read' }),
  ).toContainText('Saved data could not be read')
  await page
    .getByRole('button', { name: 'Add Linen sofa', exact: true })
    .click()
  expect(
    await page.evaluate(
      (key) =>
        (
          window as unknown as { originalGet: typeof Storage.prototype.getItem }
        ).originalGet.call(localStorage, key),
      key,
    ),
  ).toBe(JSON.stringify(saved))
})
