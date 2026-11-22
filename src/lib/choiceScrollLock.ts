const guard = (event: TouchEvent) => {
  if (event.cancelable) event.preventDefault()
}

export function pinChoices(scroller: HTMLElement, choices: HTMLElement): (() => void) | undefined {
  if (choices.offsetHeight + 8 > scroller.clientHeight) return undefined
  scroller.style.overflow = 'hidden'
  scroller.style.touchAction = 'none'
  scroller.scrollTop = Math.max(scroller.scrollHeight - scroller.clientHeight, 0)
  scroller.addEventListener('touchmove', guard, { passive: false })
  return () => {
    scroller.removeEventListener('touchmove', guard)
    scroller.style.overflow = ''
    scroller.style.touchAction = ''
  }
}
