import { beforeEach, describe, expect, it } from 'vitest'
import { useGameStore } from '../src/stores/gameStore'

beforeEach(() => {
  useGameStore.getState().reset()
})

describe('空内容下的存档', () => {
  it('开始游戏不报错，停在空场景', () => {
    useGameStore.getState().start()
    const state = useGameStore.getState()
    expect(state.started).toBe(true)
    expect(state.sceneId).toBe('')
    expect(state.ending).toBeNull()
  })

  it('没有快照时撤销不改变状态', () => {
    useGameStore.getState().start()
    const before = useGameStore.getState().sceneId
    useGameStore.getState().undo()
    expect(useGameStore.getState().sceneId).toBe(before)
  })

  it('重置后回到未开始状态', () => {
    useGameStore.getState().start()
    useGameStore.getState().reset()
    const state = useGameStore.getState()
    expect(state.started).toBe(false)
    expect(state.history).toEqual([])
    expect(state.snapshot).toBeNull()
  })
})
