export type ChoiceKey = 'A' | 'B' | 'C'

export interface RecentEntry {
  turn: number
  choice?: string
  narration: string
  raw?: string
}

export interface Quest {
  id: string
  title: string
  done: boolean
}

export interface WorldState {
  turn: number
  age: number
  realmLevel: number
  realmName: string
  progress: number
  progressGoal: number
  location: string
  gameTime: string
  stats: Record<string, number>
  relations: Record<string, number>
  flags: string[]
  inventory: string[]
  tasks: Quest[]
  summary: string
  recent: RecentEntry[]
}

export interface StatePatch {
  age?: number
  realmLevel?: number
  realmName?: string
  progress?: number
  progressGoal?: number
  location?: string
  gameTime?: string
  stats?: Record<string, number>
  relations?: Record<string, number>
  flags?: string[]
  inventory?: string[]
  tasks?: Quest[]
  summary?: string
}

export interface GeneratedOption {
  key: ChoiceKey
  label: string
}

export interface GeneratedScene {
  narration: string
  system: string
  options: GeneratedOption[]
  patch: StatePatch
}

export const REALMS = [
  '未入武道',
  '气血一重',
  '气血二重',
  '气血三重',
  '气血四重',
  '气血五重',
  '气血六重',
  '气血七重',
  '气血八重',
  '气血九重',
  '内气一重',
  '内气二重',
  '内气三重',
  '内气四重',
  '内气五重',
  '内气六重',
  '内气七重',
  '内气八重',
  '内气九重',
  '真罡境',
  '通玄境',
] as const

export const INITIAL_WORLD: WorldState = {
  turn: 0,
  age: 60,
  realmLevel: 0,
  realmName: '未入武道',
  progress: 0,
  progressGoal: 1000,
  location: '三木村',
  gameTime: '大虞历三百一十七年 夏',
  stats: { 寿元: 100, 危险: 0, 银两: 12, 威名: 0 },
  relations: { 姜月欣: 60, 周良: 20, 杨惠: 25, 伊巡: -10 },
  flags: [],
  inventory: ['柴刀', '破扇子'],
  tasks: [
    { id: 'guard', title: '护住姜月欣', done: false },
    { id: 'zicheng', title: '弄清紫木会引来什么', done: false },
    { id: 'survive', title: '活下去', done: false },
  ],
  summary: '',
  recent: [],
}

export function multiplier(age: number): number {
  return Math.max(1, age)
}
