import { expect, test } from '@playwright/test'

test('compose two independent items and restore the complete board after reload', async ({
  page,
}) => {
  await page.goto('/')
  const board = page.getByRole('group', { name: 'Moodboard items' })
  const items = board.getByRole('button', { name: /^Select / })
  await expect(items).toHaveCount(0)
  const picker = page.getByRole('combobox', { name: 'Selected item' })

  await page
    .getByRole('button', { name: 'Add Linen sofa', exact: true })
    .click()
  const firstId = await picker.inputValue()
  for (const [name, value] of [
    ['Width (units)', '300'],
    ['Position X (units)', '120'],
    ['Position Y (units)', '160'],
  ]) {
    const field = page.getByRole('spinbutton', { name, exact: true })
    await field.fill(value)
    await field.press('Enter')
    await expect(field).toHaveValue(value)
  }
  await expect(
    page.getByRole('spinbutton', { name: 'Height (units, automatic)' }),
  ).toHaveValue('195')

  await page
    .getByRole('button', { name: 'Add Linen sofa', exact: true })
    .click()
  const secondId = await picker.inputValue()
  expect(secondId).not.toBe(firstId)
  for (const [name, value] of [
    ['Width (units)', '240'],
    ['Position X (units)', '200'],
    ['Position Y (units)', '200'],
  ]) {
    const field = page.getByRole('spinbutton', { name, exact: true })
    await field.fill(value)
    await field.press('Enter')
  }
  await expect(
    page.getByRole('button', { name: 'Bring forward' }),
  ).toBeDisabled()
  await page.getByRole('button', { name: 'Send backward' }).click()
  await expect(picker).toHaveValue(secondId)
  await expect(
    page.getByRole('button', { name: 'Send backward' }),
  ).toBeDisabled()

  const title = page.getByRole('textbox', { name: 'Board title' })
  await title.fill('Sunday reading room')
  await title.press('Enter')
  await page.getByRole('radio', { name: 'Olive', exact: true }).check()
  const expected = {
    version: 1,
    title: 'Sunday reading room',
    width: 1000,
    height: 700,
    paletteId: 'olive',
    items: [
      {
        id: secondId,
        assetId: 'linen-sofa',
        x: 200,
        y: 200,
        width: 240,
        height: 156,
      },
      {
        id: firstId,
        assetId: 'linen-sofa',
        x: 120,
        y: 160,
        width: 300,
        height: 195,
      },
    ],
  }
  await expect
    .poll(() =>
      page.evaluate(() =>
        JSON.parse(localStorage.getItem('interior-moodboard:v1')!),
      ),
    )
    .toEqual(expected)
  await expect(
    page.getByRole('status').filter({ hasText: 'Saved on this device.' }),
  ).toBeVisible()

  await page.reload()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    expected.title,
  )
  await expect(title).toHaveValue(expected.title)
  await expect(
    page.getByRole('radio', { name: 'Olive', exact: true }),
  ).toBeChecked()
  await expect(board).toHaveCSS('background-color', 'rgb(227, 232, 218)')
  await expect(items).toHaveCount(2)
  expect(
    await picker
      .getByRole('option')
      .evaluateAll((options) =>
        options.map((option) => option.getAttribute('value')),
      ),
  ).toEqual(['', secondId, firstId])

  for (const [index, item] of expected.items.entries()) {
    await picker.selectOption(item.id)
    for (const [name, value] of [
      ['Position X (units)', item.x],
      ['Position Y (units)', item.y],
      ['Width (units)', item.width],
      ['Height (units, automatic)', item.height],
    ] as const) {
      await expect(
        page.getByRole('spinbutton', { name, exact: true }),
      ).toHaveValue(String(value))
    }
    const rendered = items.nth(index)
    await expect(rendered).toHaveAttribute('aria-pressed', 'true')
    const style = await rendered.evaluate((element) => ({
      x: element.style.left,
      y: element.style.top,
      width: element.style.width,
      height: element.style.height,
    }))
    expect(parseFloat(style.x)).toBeCloseTo(item.x / 10)
    expect(parseFloat(style.y)).toBeCloseTo(item.y / 7)
    expect(parseFloat(style.width)).toBeCloseTo(item.width / 10)
    expect(parseFloat(style.height)).toBeCloseTo(item.height / 7)
    await expect(rendered.locator('img')).toHaveJSProperty('naturalWidth', 400)
  }
  expect(
    await page.evaluate(() =>
      JSON.parse(localStorage.getItem('interior-moodboard:v1')!),
    ),
  ).toEqual(expected)
})
