import { describe, expect, it, vi } from 'vitest'
import { pinChoices } from '../src/lib/choiceScrollLock'

function makeScroller(clientHeight = 600, scrollHeight = 1400, scrollTop = 120) {
  const listeners = new Map<string, EventListener>()
  const scroller = {
    scrollTop,
    scrollHeight,
    clientHeight,
    style: { overflow: '', touchAction: '' },
    addEventListener: vi.fn((type: string, listener: EventListener) => {
      listeners.set(type, listener)
    }),
    removeEventListener: vi.fn((type: string) => {
      listeners.delete(type)
    }),
  }
  return { scroller, listeners }
}

const choices = (offsetHeight: number) => ({ offsetHeight }) as HTMLElement

describe('pinChoices', () => {
  it('scrolls the choices to the end and locks the reading area', () => {
    const { scroller, listeners } = makeScroller()
    const release = pinChoices(scroller as unknown as HTMLElement, choices(320))
    expect(scroller.scrollTop).toBe(800)
    expect(scroller.style.overflow).toBe('hidden')
    expect(scroller.style.touchAction).toBe('none')
    expect(scroller.addEventListener).toHaveBeenCalledWith('touchmove', expect.any(Function), { passive: false })
    expect(listeners.has('touchmove')).toBe(true)
    expect(typeof release).toBe('function')
  })

  it('keeps the reading area unlocked when the choices do not fit', () => {
    const { scroller, listeners } = makeScroller(300, 900)
    const release = pinChoices(scroller as unknown as HTMLElement, choices(340))
    expect(release).toBeUndefined()
    expect(scroller.scrollTop).toBe(120)
    expect(scroller.style.overflow).toBe('')
    expect(scroller.style.touchAction).toBe('')
    expect(listeners.size).toBe(0)
  })

  it('releases the lock and restores the reading area', () => {
    const { scroller, listeners } = makeScroller()
    const release = pinChoices(scroller as unknown as HTMLElement, choices(320))
    release?.()
    expect(scroller.style.overflow).toBe('')
    expect(scroller.style.touchAction).toBe('')
    expect(scroller.removeEventListener).toHaveBeenCalledWith('touchmove', expect.any(Function))
    expect(listeners.has('touchmove')).toBe(false)
  })

  it('cancels touch scrolling while pinned', () => {
    const { scroller, listeners } = makeScroller()
    pinChoices(scroller as unknown as HTMLElement, choices(320))
    const preventDefault = vi.fn()
    listeners.get('touchmove')?.({ cancelable: true, preventDefault } as unknown as Event)
    expect(preventDefault).toHaveBeenCalled()
  })

  it('pins at the top when the content is shorter than the reading area', () => {
    const { scroller } = makeScroller(600, 500)
    pinChoices(scroller as unknown as HTMLElement, choices(200))
    expect(scroller.scrollTop).toBe(0)
  })
})
