import { expect, test, type Locator, type Page } from '@playwright/test'

async function tabTo(page: Page, target: Locator) {
  for (let count = 0; count < 90; count++) {
    if (await target.evaluate((element) => element === document.activeElement))
      return
    await page.keyboard.press('Tab')
  }
  await expect(target).toBeFocused()
}

test('compose, edit, select, layer and remove using only keyboard input', async ({
  page,
}) => {
  await page.goto('/')
  const add = page.getByRole('button', { name: 'Add Linen sofa', exact: true })
  const x = page.getByRole('spinbutton', {
    name: 'Position X (units)',
    exact: true,
  })
  const width = page.getByRole('spinbutton', {
    name: 'Width (units)',
    exact: true,
  })
  await tabTo(page, add)
  await page.keyboard.press('Enter')
  await expect(add).toBeFocused()
  await page.keyboard.press('ArrowRight')
  await page.keyboard.press('Shift+ArrowRight')
  await expect(x).toHaveValue('421')
  await expect(
    page.getByRole('status').filter({ hasText: 'Linen sofa selected.' }),
  ).toContainText('Position 421, 292')
  await page.keyboard.press('Enter')
  await expect(
    page.getByRole('combobox', { name: 'Selected item' }).getByRole('option'),
  ).toHaveCount(3)

  const first = page.getByRole('button', {
    name: 'Select Linen sofa, item 1',
    exact: true,
  })
  await tabTo(page, first)
  await page.keyboard.press('Enter')
  await expect(first).toHaveAttribute('aria-pressed', 'true')
  await expect(x).toHaveValue('421')
  await tabTo(page, x)
  await page.keyboard.press('ControlOrMeta+A')
  await page.keyboard.type('0')
  await page.keyboard.press('Enter')
  await expect(x).toBeFocused()
  await expect(x).toHaveValue('0')
  await tabTo(page, width)
  await page.keyboard.press('ControlOrMeta+A')
  await page.keyboard.type('300')
  await page.keyboard.press('Enter')
  await expect(width).toBeFocused()
  await expect(
    page.getByRole('spinbutton', { name: 'Height (units, automatic)' }),
  ).toHaveValue('195')
  await tabTo(page, page.getByRole('button', { name: 'Bring forward' }))
  await page.keyboard.press('Enter')
  await expect(
    page.getByRole('status').filter({ hasText: 'Layer 2 of 2' }),
  ).toBeVisible()
  await page.keyboard.press('Shift+ArrowLeft')
  await expect(x).toHaveValue('0')

  const title = page.getByRole('textbox', { name: 'Board title' })
  await tabTo(page, title)
  await page.keyboard.press('ControlOrMeta+A')
  await page.keyboard.type('Keyboard room')
  await page.keyboard.press('ArrowLeft')
  await page.keyboard.press('Enter')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Keyboard room',
  )
  await expect(x).toHaveValue('0')
  await tabTo(page, page.getByRole('radio', { name: 'Sand', exact: true }))
  await page.keyboard.press('ArrowRight')
  await expect(
    page.getByRole('radio', { name: 'Olive', exact: true }),
  ).toBeChecked()
  await expect(x).toHaveValue('0')
  await tabTo(page, page.getByRole('button', { name: 'Remove selected item' }))
  await page.keyboard.press('Enter')
  await expect(page.locator('#board')).toBeFocused()
  await expect(
    page.getByRole('combobox', { name: 'Selected item' }),
  ).toHaveValue('')
  await expect(
    page.getByRole('status').filter({ hasText: 'No item selected.' }),
  ).toHaveText('1 piece on the board. No item selected.')
  const saved = await page.evaluate(() =>
    localStorage.getItem('interior-moodboard:v1'),
  )
  await page.keyboard.press('ArrowRight')
  expect(
    await page.evaluate(() => localStorage.getItem('interior-moodboard:v1')),
  ).toBe(saved)
})

test('preserves form, editable content, native modifiers and composition shortcuts', async ({
  page,
}) => {
  await page.goto('/')
  const add = page.getByRole('button', { name: 'Add Linen sofa', exact: true })
  await add.click()
  const before = await page.evaluate(() =>
    localStorage.getItem('interior-moodboard:v1'),
  )
  // Extra editable surfaces exercise bubbling from nested content as well as native fields.
  const results = await page.locator('main').evaluate((main) => {
    const results: boolean[] = []
    for (const markup of [
      '<input>',
      '<textarea></textarea>',
      '<select><option>A</option></select>',
      '<div contenteditable="true"><span>Text</span></div>',
    ]) {
      const wrapper = document.createElement('div')
      wrapper.innerHTML = markup
      main.append(wrapper)
      const target = wrapper.querySelector('span') ?? wrapper.firstElementChild!
      results.push(
        target.dispatchEvent(
          new KeyboardEvent('keydown', {
            key: 'ArrowRight',
            bubbles: true,
            cancelable: true,
          }),
        ),
      )
      wrapper.remove()
    }
    return results
  })
  expect(results).toEqual([true, true, true, true])
  for (const modifier of ['Control', 'Alt', 'Meta'])
    await add.press(`${modifier}+ArrowRight`)
  expect(
    await add.evaluate((button) =>
      button.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'ArrowRight',
          isComposing: true,
          bubbles: true,
          cancelable: true,
        }),
      ),
    ),
  ).toBe(true)
  expect(
    await page.evaluate(() => localStorage.getItem('interior-moodboard:v1')),
  ).toBe(before)
})
