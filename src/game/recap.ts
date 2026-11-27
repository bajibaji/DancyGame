import { CHAPTERS, chapterTitle, getScene, getSceneBaseId, START_SCENE } from '../content'
import { isReleasedScene, RELEASED_CLUES } from '../content/release'
import type { GameState } from './types'

export const RECAP_AFTER_MS = 4 * 60 * 60 * 1000

type RecapState = Pick<GameState, 'sceneId' | 'visited' | 'history' | 'clues'>
type SessionState = RecapState & { started: boolean; ending: unknown }

export interface StoryRecap {
  chapter: string
  scene: string
  location: string
  facts: string[]
  choices: string[]
  question?: string
}

const checkpoints: { scene: string; text: string; question?: string }[] = [
  { scene: 'p01a', text: '你叫江嘉，二十六岁，是刑侦一队的代理队长。你六岁时有一段记忆缺口，后脑留着旧伤。' },
  { scene: 'p01b', text: '你来参加旧线人叶小满的婚礼。她坚持给一个多年没有消息的人留一把空椅，暂时还没说出姓名。', question: '叶小满等的那个人是谁？' },
  { scene: 'pw03a', text: '马宏图是新郎杜衡的老同学，忙着照顾宾客和小工，还答应次日八点前来帮忙接亲。' },
  { scene: 'p03c', text: '前夜 23:42，马宏图空手离席，说出去后还会回来。他留下了手机、外套和没送出去的喜饼。', question: '他出去办什么事，为什么连手机都没带？' },
  { scene: 'pw06a', text: '天亮以后，马宏图错过了接亲时间。家里说他整夜未归，朋友开始分头寻找。' },
  { scene: 'pw07b', text: '整场午宴也没等到马宏图。小工补送了喜饼，老人始终没接到他答应再打的第二通电话。' },
  { scene: 'pw08b', text: '后门原片里，23:42 是离席时点，23:44 有车轮经过。那两分钟只是录像间隔，推车人和车上物品都没有看清。' },
  { scene: 'p05a', text: '次日 15:10，已过去十五个多小时，几路寻找仍没结果。去熏肉林近道的帮厨看见桶口蓝布，退到林口报信。' },
  { scene: 'p06a', text: '你在熏桶里发现人的躯干，暂时不能认作失联的马宏图。', question: '桶里是谁，马宏图又去了哪里？' },
  { scene: 'p07b', text: '树上又找到一组遗骸。桶内记 01，树上记 02，两处分别交接，身份另查。' },
  { scene: 'p08a', text: '桶盖的两声响让你想起六岁时一间上锁的小屋。你记得门外有人等回应，却还想不起他的脸。', question: '当年门外的人是谁，自己为什么不敢回答？' },
  { scene: 'p12a', text: '杜衡主动说付给马宏图八万元，称是货款，却承认没有看见货入仓。真实付款仍要独立核验。' },
  { scene: 'p13b', text: '杜衡一再关心伴郎的外套和一个本子，杜远山也在问伴郎留下的票据。', question: '他们关心的本子和票据究竟记了什么？' },
  { scene: 'p16b', text: '旧货运部原页写着登记法人章冽，背面留下半山、竖井的字样，老厂调查有了可查的位置。' },
  { scene: 'c0101a', text: '身份检验确认 01 是马宏图，02 不属于他；两人遇害时间不同，放置先后仍未查明。', question: '为什么把两个不同时间遇害的人摆在同一片林子里？' },
  { scene: 'lab03a', text: '02 的生前损伤符合高处坠落，需要另找受伤地点。林里的摆放没有回答他在哪里遇害。' },
  { scene: 'c0102b', text: '案件里的气味又触动童年记忆：你想起那扇门从外面关着。这段记忆与现场检验分开追查。', question: '气味来自哪里，那扇门为什么从外面关着？' },
  { scene: 'feast01b', text: '挡酒的小工说，马宏图那晚特意要保持清醒，离席后还有事要办。几名同桌人都没亲眼看完他回家的路。' },
  { scene: 'family01b', text: '刘琼说自己没有催儿子回家拿药，旧手机背壳还留着儿子写的号码，可以继续核联系来源。' },
  { scene: 'money01b', text: '卢旭承认经手付款凭证，也替人搬过封着的铁皮桶。付款和搬运分别核查，不能靠一人一句话连成全程。' },
  { scene: 'money02b', text: '银行确认杜衡向马宏图付过三笔钱，合计八万元，备注货款；实际交货仍缺独立记录。', question: '明知没有货，杜衡为什么还要付款？' },
  { scene: 'money03b', text: '一张回单背面粘着蓝格纸角。杜衡开始补说货从三车间走，纸角与他说法需要分别核。' },
  { scene: 'c0104b', text: '老厂第八条报废审批缺页。杜衡从不知情改口说可能签过，付款用途的几种说法也未接上实物。' },
  { scene: 'clock01b', text: '校时保留了约两分钟的筛查窗，车轮后还有一道人影；画面不足以认推车人或装载物。' },
  { scene: 'clock02b', text: '目击者带你回到井盖旁，说车曾在画外停过。新的停顿位置可以继续找邻街原片。' },
  { scene: 'c0106b', text: '老厂井口有活动痕迹。特勤队员战远来做另一项任务，提出在封控外再观察十分钟。' },
  { scene: 'c0107b', text: '井口外找到的钥匙能开章冽名下的桑塔纳。闻茉有车辆领用记录，钥匙怎样到井口仍待查。', question: '谁用过这把钥匙，谁又将它留在井口？' },
  { scene: 'school01b', text: '章冽与闻茉先后离开同一所学校。学籍有三行涂痕，闻茉对同学往来的回答有过更正。' },
  { scene: 'c0108b', text: '闻茉提到孟小禾，可能是曾等过叶小满的女孩；照片、失踪登记与涂痕仍需分别核。' },
  { scene: 'handoff01a', text: '叶小满带来旧相册，确认自己认识孟小禾。婚礼的空椅是留给这位十年前失踪的朋友。', question: '孟小禾离开校门以后去了哪里？' },
  { scene: 'handoff01b', text: '袁衷是 02 身份比对的一个方向，样本还在路上，尚未正式确认。战远愿意补二鸡巷的亲见说明。', question: '谁经过二鸡巷，失踪女孩离开校门以后又走过哪里？' },
]

export function shouldShowRecap(state: SessionState, lastActiveAt: number | null, now: number): boolean {
  if (!state.started || state.ending || !isReleasedScene(state.sceneId)) return false
  if (state.sceneId === START_SCENE && !state.history.length && state.visited.length <= 1) return false
  return typeof lastActiveAt === 'number' && Number.isFinite(lastActiveAt) && lastActiveAt > 0 && now - lastActiveAt >= RECAP_AFTER_MS
}

export function buildStoryRecap(state: RecapState): StoryRecap {
  const current = getScene(state.sceneId)
  const ordered = CHAPTERS.flatMap(({ scenes }) => scenes).filter(({ id, inherits }) => !inherits && isReleasedScene(id))
  const indices = new Map(ordered.map(({ id }, index) => [id, index]))
  const currentIndex = indices.get(getSceneBaseId(state.sceneId)) ?? -1
  const completed = (id: string) => (indices.get(getSceneBaseId(id)) ?? Infinity) < currentIndex
  const seen = new Set(state.visited.filter(completed).map(getSceneBaseId))
  for (const entry of state.history) if (completed(entry.sceneId)) seen.add(getSceneBaseId(entry.sceneId))
  const known = checkpoints.filter(({ scene }) => seen.has(scene))
  const recent = known.slice(-4).map(({ text }) => text)
  const anchor = [...known].reverse().find(({ scene }) => ['c0101a', 'p07b', 'p06a', 'p03c', 'p01b', 'p01a'].includes(scene))?.text
  const facts = anchor && !recent.includes(anchor) ? [anchor, ...recent] : recent
  const clues = new Set(state.clues)
  const earlyChapter = current && ['prologue', 'ch01'].includes(current.chapter)
  if (current && !earlyChapter) {
    const sources = new Map<string, number>()
    ordered.forEach((scene, index) => {
      const grants = [...(scene.effects?.clues ?? []), ...(scene.options?.flatMap(({ effects }) => effects.clues ?? []) ?? [])]
      for (const id of grants) if (!sources.has(id)) sources.set(id, index)
    })
    const cards = RELEASED_CLUES.filter(({ id }) => clues.has(id) && (sources.get(id) ?? Infinity) < currentIndex).slice(-3)
    for (const card of cards) facts.push(card.title + '：' + card.description)
  }
  const choices = state.history.filter((entry) => completed(entry.sceneId)).slice(-2)
    .map((entry) => entry.progress || entry.consequence || '你选择了：' + entry.label)
  return {
    chapter: current ? chapterTitle(current.chapter) : '',
    scene: current?.title ?? '',
    location: current?.timeOfDay ?? '',
    facts: facts.length > 5 && anchor ? [anchor, ...facts.filter((fact) => fact !== anchor).slice(-4)] : facts.slice(-5),
    choices,
    question: earlyChapter ? [...known].reverse().find(({ question }) => question)?.question : undefined,
  }
}
