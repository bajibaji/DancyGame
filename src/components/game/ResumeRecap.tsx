import { useEffect, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { buildStoryRecap } from '../../game/recap'
import { useGameStore } from '../../stores/gameStore'

export default function ResumeRecap() {
  const navigate = useNavigate()
  const state = useGameStore()
  const dialog = useRef<HTMLDialogElement>(null)
  const { sceneId, visited, history, clues } = state
  const recap = useMemo(() => buildStoryRecap({ sceneId, visited, history, clues }), [sceneId, visited, history, clues])
  const open = state.recapPending && state.started && !state.ending

  useEffect(() => {
    const element = dialog.current
    if (!element) return
    if (open && !element.open) element.showModal()
    else if (!open && element.open) element.close()
  }, [open])

  return (
    <dialog
      ref={dialog}
      aria-labelledby="recap-title"
      aria-describedby="recap-context"
      aria-modal="true"
      onCancel={(event) => { event.preventDefault(); state.dismissRecap() }}
      onKeyDown={(event) => event.stopPropagation()}
      className="m-auto max-h-[85dvh] w-[calc(100%_-_2rem)] max-w-[560px] overflow-y-auto rounded-[18px] border border-border bg-surface p-5 text-text shadow-2xl backdrop:bg-black/70"
    >
      <div className="flex items-center justify-between gap-4">
        <h2 id="recap-title" className="font-display text-xl text-text-hi">前情提要</h2>
        <button type="button" onClick={state.dismissRecap} className="min-h-11 px-2 text-sm text-text-secondary">关闭</button>
      </div>
      <p id="recap-context" className="mt-1 text-sm leading-7 text-text-secondary">你停在{recap.chapter}「{recap.scene}」。</p>
      <p className="text-xs leading-6 text-text-dim">{recap.location}</p>
      <ul className="mt-4 space-y-3 text-sm leading-7">
        {recap.facts.map((fact) => <li key={fact}>{fact}</li>)}
      </ul>
      {recap.choices.length > 0 && (
        <section className="mt-5 border-t border-border pt-4">
          <h3 className="mb-2 text-sm text-clue">你最近的行动</h3>
          <ul className="space-y-2 text-sm leading-7 text-text-secondary">
            {recap.choices.map((choice, index) => <li key={index}>{choice}</li>)}
          </ul>
        </section>
      )}
      {recap.question && <p className="mt-4 text-sm leading-7 text-clue">还在追问：{recap.question}</p>}
      <button type="button" onClick={() => { state.dismissRecap(); navigate('/story') }} className="glass-slab mt-5 min-h-12 w-full rounded-[12px] px-4 py-3 text-sm text-text-hi">继续调查</button>
    </dialog>
  )
}
