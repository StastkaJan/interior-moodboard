import { describe, expect, it } from 'vitest'
import { assets } from './assets'

const images = import.meta.glob<string>('/public/assets/*.svg', {
  query: '?raw',
  import: 'default',
  eager: true,
})

describe('bundled catalogue', () => {
  it('has unique stable IDs, labelled local images, and exact source proportions', () => {
    expect(assets).toHaveLength(20)
    expect(new Set(assets.map((asset) => asset.id)).size).toBe(assets.length)

    for (const asset of assets) {
      expect(asset.id).toMatch(/^[a-z]+(?:-[a-z]+)*$/)
      expect(asset.label.trim()).not.toBe('')
      expect(asset.category.trim()).not.toBe('')
      expect(asset.imagePath).toBe(`/assets/${asset.id}.svg`)
      const svg = images[`/public${asset.imagePath}`]
      expect(svg).toBeDefined()
      const dimensions = svg.match(/<svg[^>]*width="(\d+)" height="(\d+)"/)
      expect(dimensions).not.toBeNull()
      expect(asset.aspectRatio).toBe(
        Number(dimensions![1]) / Number(dimensions![2]),
      )
      expect(svg).toContain(`<title>${asset.label}</title>`)
      expect(svg).not.toMatch(/<(?:script|image)\b/)
    }
  })
})
