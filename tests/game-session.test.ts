import { afterEach, describe, expect, it, vi } from 'vitest'
import { RECAP_AFTER_MS } from '../src/game/recap'

const session = vi.hoisted(() => ({
  cleanup: undefined as undefined | (() => void),
  enterSession: vi.fn(),
  recordActive: vi.fn(),
}))

vi.mock('react', () => ({ useEffect: (setup: () => () => void) => { session.cleanup = setup() } }))
vi.mock('../src/stores/gameStore', () => ({ useGameStore: { getState: () => session } }))

import { useGameSession } from '../src/game/useGameSession'

afterEach(() => {
  session.cleanup?.()
  session.cleanup = undefined
  vi.useRealTimers()
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

describe('返回游戏的会话时间', () => {
  it('页面切后台时记离开，后台不续时间，满四小时回前台时先检查旧时间', () => {
    vi.useFakeTimers()
    const now = 1_900_000_000_000
    vi.setSystemTime(now)
    const page = Object.assign(new EventTarget(), { visibilityState: 'visible' })
    const browser = Object.assign(new EventTarget(), { setInterval, clearInterval })
    vi.stubGlobal('document', page)
    vi.stubGlobal('window', browser)
    useGameSession()
    expect(session.enterSession).toHaveBeenLastCalledWith(now)
    vi.advanceTimersByTime(60_000)
    expect(session.recordActive).toHaveBeenLastCalledWith(now + 60_000)
    page.visibilityState = 'hidden'
    page.dispatchEvent(new Event('visibilitychange'))
    const recorded = session.recordActive.mock.calls.length
    vi.advanceTimersByTime(RECAP_AFTER_MS)
    expect(session.recordActive).toHaveBeenCalledTimes(recorded)
    browser.dispatchEvent(new Event('pagehide'))
    expect(session.recordActive).toHaveBeenCalledTimes(recorded)
    page.visibilityState = 'visible'
    page.dispatchEvent(new Event('visibilitychange'))
    expect(session.enterSession).toHaveBeenLastCalledWith(now + 60_000 + RECAP_AFTER_MS)
    const calls = session.enterSession.mock.calls.length
    session.cleanup?.()
    session.cleanup = undefined
    page.dispatchEvent(new Event('visibilitychange'))
    expect(session.enterSession).toHaveBeenCalledTimes(calls)
  })
})
