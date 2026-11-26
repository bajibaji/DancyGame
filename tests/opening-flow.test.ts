import { describe, expect, it } from 'vitest'
import { CHAPTERS, getScene } from '../src/content'
import { choiceOffers } from '../src/game/choices'
import { choose, createInitialState } from '../src/game/engine'
import { resolveSceneBody } from '../src/game/narrative'

const openingChapters = CHAPTERS.filter(({ chapter }) => ['prologue', 'ch01'].includes(chapter))

describe('开场角色扮演的调查节拍', () => {
  it('46 组三幕都有具体的新矛盾、发现或人物请求，不能删成空过渡', () => {
    const hooks: [string, string][] = [
      ['p01b', '回不了消息的人'],
      ['p03b', '过了今天'],
      ['p04b', '去拿什么'],
      ['p05b', '鞋跟'],
      ['p06b', '更早'],
      ['p06e', '皮肤'],
      ['p07b', '不存在的门'],
      ['p08b', '回过家'],
      ['p08e', '没有桶底'],
      ['p09b', '人群没有散'],
      ['p03e', '知道人家会等'],
      ['p04e', '所有能联系自己的东西'],
      ['p02b', '另有一笔'],
      ['p10b', '后厨外'],
      ['p11b', '儿子在等父亲'],
      ['p12b', '桶边找到了包'],
      ['p13b', '蓝格纸'],
      ['p14b', '材料能不能看一下'],
      ['p15b', '法人另有其人'],
      ['p16b', '半山，竖井'],
      ['c0101b', '为什么选婚礼'],
      ['lab01b', '也没叫马宏图提前回家'],
      ['lab03b', '附着物'],
      ['c0102b', '从外面关的门'],
      ['lab02b', '特意少喝酒'],
      ['feast01b', '得清醒'],
      ['guest01b', '他家能看吗'],
      ['feast02b', '为那次外出留余地'],
      ['family01b', '有人在等自己'],
      ['family02b', '孔云'],
      ['money01b', '杜衡向马宏图付款'],
      ['c0103b', '有人曾在外头等'],
      ['money02b', '最后一笔付出时，杜衡已经知道不会有货'],
      ['money03b', '纸角照片'],
      ['stock01b', '报废的东西'],
      ['c0104b', '他父亲的名字'],
      ['ask01b', '提前关心那口井'],
      ['c0105b', '如果他不是推车的人'],
      ['clock01b', '车后又多了一个人影'],
      ['clock02b', '车到这儿停过'],
      ['review01b', '不是嘉兴六岁时的屋子'],
      ['c0106b', '你姓江'],
      ['c0107b', '闻茉的领用签名'],
      ['school01b', '半个「禾」'],
      ['c0108b', '地图册'],
      ['handoff01b', '袁衷'],
    ]
    expect(hooks).toHaveLength(openingChapters.flatMap(({ scenes }) => scenes.filter(({ options }) => options)).length)
    for (const [id, anchor] of hooks) expect(getScene(id)!.body, id).toContain(anchor)
    for (const chapter of openingChapters) for (let index = 1; index < chapter.scenes.length; index += 3) {
      expect(hooks.some(([id]) => id === chapter.scenes[index].id), chapter.scenes[index].id).toBe(true)
    }
  })

  it.each(openingChapters)('$title 每组三幕才选择，组内无跳过正文或旧场景死路', ({ scenes }) => {
    expect(scenes.length % 3).toBe(0)
    for (let index = 0; index < scenes.length; index += 3) {
      const [first, discovery, decision] = scenes.slice(index, index + 3)
      expect(first.options, first.id).toBeUndefined()
      expect(discovery.options, discovery.id).toBeUndefined()
      expect(first.next, first.id).toBe(discovery.id)
      expect(discovery.next, discovery.id).toBe(decision.id)
      expect(decision.options?.map(({ key }) => key), decision.id).toEqual(['A', 'B', 'C'])
      const destination = scenes[index + 3]?.id ?? getScene(decision.options![0].next)!.id
      for (const option of decision.options!) expect(option.next, decision.id).toBe(destination)
    }
  })

  it('每个实际行动在下一组选项前有独立回应，随机替代也不会串用另外两条后果', () => {
    for (const chapter of openingChapters) for (const scene of chapter.scenes) {
      if (!scene.options) continue
      for (let seed = 0; seed < 48; seed++) {
        const flags = { F_WEDDING_BLANK_CARD: true, F_P_WITNESS_VAN: true, MONEY01_0: true, FEAST01_0: true }
        const offers = choiceOffers(scene, seed, flags)
        const responses = new Set<string>()
        for (const { option } of offers) {
          const state = choose({ ...createInitialState(scene.id, seed), flags }, scene, option)
          let target = getScene(option.next)!
          const arrival = state.history.at(-1)
          const arrived = resolveSceneBody(target, state.flags, arrival)
          expect(arrived, scene.id).toContain(option.consequence)
          const recalled: string[] = []
          while (!target.options) {
            for (const recall of target.recalls ?? []) {
              if (!state.flags[recall.flag] || !option.effects.flags?.includes(recall.flag)) continue
              recalled.push(recall.text)
              expect(resolveSceneBody(target, state.flags), scene.id).toContain(recall.text)
            }
            target = getScene(target.next!)!
          }
          expect(recalled.length, scene.id + '/' + option.key).toBeGreaterThan(0)
          responses.add(recalled.join('|'))
        }
        expect(responses.size, scene.id + '/' + seed).toBe(3)
      }
    }
  })

  it('进入现场前先认识刑警和婚宴三人，章末的朋友身份不混作无名死者的确认', () => {
    const introduction = ['p01a', 'p01b', 'p01c'].map((id) => getScene(id)!.body).join('')
    for (const name of ['江嘉', '叶小满', '杜衡', '马宏图']) expect(introduction).toContain(name)
    expect(introduction).toMatch(/刑侦一队.*代理队长/)
    expect(introduction).toMatch(/六岁.*嘉兴/)
    expect(getScene('p06b')!.body).toMatch(/陆晚.*技侦/)
    expect(getScene('p06c')!.body).toMatch(/顾淮.*法医/)
    expect(getScene('p06d')!.body).toMatch(/贺川.*痕检/)
    expect(getScene('c0106b')!.body).toMatch(/战远.*特勤队员/)
    expect(getScene('school01a')!.body).toMatch(/闻茉.*检验员/)
    expect(getScene('handoff01a')!.body).toContain('孟小禾')
    expect(getScene('handoff01b')!.body).toContain('袁衷')
    expect(getScene('handoff01b')!.body).toContain('正式结果还没回来')
  })
})
