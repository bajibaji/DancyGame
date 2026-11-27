export function resolveChapters(chapters) {
  const raw = new Map()
  for (const chapter of chapters) for (const scene of chapter.scenes) {
    if (raw.has(scene.id)) throw new Error('重复场景：' + scene.id)
    raw.set(scene.id, { ...scene, chapter: chapter.chapter })
  }
  const resolved = new Map()
  const pending = new Set()
  const resolve = (id) => {
    if (resolved.has(id)) return resolved.get(id)
    const source = raw.get(id)
    if (!source) throw new Error('继承目标不存在：' + id)
    if (pending.has(id)) throw new Error('场景继承循环：' + id)
    pending.add(id)
    const parent = source.inherits ? resolve(source.inherits) : undefined
    const scene = globalThis.structuredClone({ ...parent, ...source })
    if (source.next !== undefined) delete scene.options
    if (source.options !== undefined) delete scene.next
    if (!scene.body || !scene.title || !scene.locationId || !scene.timeOfDay) throw new Error('场景字段不完整：' + id)
    pending.delete(id)
    resolved.set(id, scene)
    return scene
  }
  return chapters.map((chapter) => ({ ...chapter, scenes: chapter.scenes.map(({ id }) => resolve(id)) }))
}
