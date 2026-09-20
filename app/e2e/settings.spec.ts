import { expect, test } from '@playwright/test'

test('title and every palette can be committed with the keyboard', async ({
  page,
}) => {
  await page.goto('/')
  await expect(
    page.getByRole('group', { name: 'Moodboard items' }).getByRole('button'),
  ).toHaveCount(0)
  const title = page.getByRole('textbox', { name: 'Board title' })
  await title.fill('  Quiet room  ')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'My room concept',
  )
  await title.press('Enter')
  await expect(title).toHaveValue('Quiet room')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Quiet room')
  await title.fill('   ')
  await title.press('Tab')
  await expect(title).toHaveValue('My room concept')

  const sand = page.getByRole('radio', { name: 'Sand', exact: true })
  await sand.focus()
  await expect(sand).toBeChecked()
  const board = page.getByRole('group', { name: 'Moodboard items' })
  for (const [label, color] of [
    ['Olive', 'rgb(227, 232, 218)'],
    ['Clay', 'rgb(240, 225, 217)'],
    ['Chalk', 'rgb(247, 246, 242)'],
    ['Sand', 'rgb(236, 233, 225)'],
  ]) {
    await page.keyboard.press('ArrowRight')
    const palette = page.getByRole('radio', { name: label, exact: true })
    await expect(palette).toBeChecked()
    await expect(palette).toBeFocused()
    await expect(board).toHaveCSS('background-color', color)
  }
})
