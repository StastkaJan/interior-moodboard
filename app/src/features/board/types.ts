export type BoardItem = {
  id: string
  assetId: string
  x: number
  y: number
  width: number
  height: number
}

export type Board = {
  version: 1
  title: string
  width: 1000
  height: 700
  paletteId: string
  items: BoardItem[]
}
