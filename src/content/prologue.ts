import type { ChoiceKey } from '../ai/world'

export interface PrologueOption {
  key: ChoiceKey
  label: string
  next: string
}

export interface PrologueScene {
  id: string
  title: string
  body: string
  system?: string
  options: PrologueOption[]
}

export const PROLOGUE_START = 'p1'

export const PROLOGUE: PrologueScene[] = [
  {
    id: 'p1',
    title: '日头底下',
    body: '三木村的日头毒得能晒脱一层皮。\n\n你叫伊阳，今年六十。穿越到这世上一甲子，种过地，砍过柴，亲眼看着爹娘把两间铺子、全部家底塞给弟弟伊巡，只因为十六岁那年，武馆教头丢下四个字：无缘武道。\n\n这世道讲拳头。没有拳头的老人，连句重话都不敢说。\n\n你躺在院里的旧躺椅上，摇着破扇子。蝉叫得人脑仁发胀。\n\n六十岁了，这辈子也就这样了。\n\n就在你闭上眼的时候，脑子里忽然浮出一行字。',
    options: [
      { key: 'A', label: '睁眼坐起来，看看这行字是什么', next: 'p2' },
      { key: 'B', label: '闭着眼装睡，等它自己消失', next: 'p2' },
      { key: 'C', label: '低声骂一句，哪个兔崽子装神弄鬼', next: 'p2' },
    ],
  },
  {
    id: 'p2',
    title: '天命',
    body: '【天命：老骥伏枥，志在千里。】\n\n一行字悬在眼前，只有你能看见。\n\n信息像凉水一样灌进脑子里：从今天起，任何功法、技艺，只要你去练，就能涨进度。没有资质门槛，没有瓶颈。\n\n更要命的是后半句——进度受寿数加持。\n\n你六十岁。练一遍，顶六十遍。\n\n三十年砍柴挑担练出的这双老眼，把四周扫了一遍。院里没人，只有老槐树的影子。\n\n晚来的东西，也是东西。',
    system: '天命已激活。寿数加持：六十倍。',
    options: [
      { key: 'A', label: '站起来，照着记忆里的桩功试一遍', next: 'p3' },
      { key: 'B', label: '把这事咽进肚子里，先不试', next: 'p3' },
      { key: 'C', label: '冲屋里喊月欣，让她也来看看', next: 'p3' },
    ],
  },
  {
    id: 'p3',
    title: '第一遍桩功',
    body: '你按着当年在武馆墙外偷看的架势，双脚分开，膝盖微屈，双臂虚抱。\n\n第一口气沉下去，腰眼发酸，膝盖打颤，老骨头像要散架。\n\n你撑住了。\n\n一呼一吸之间，小腹里升起一点暖意，像灶膛里埋着的炭火。\n\n眼前又跳出一行小字。',
    system: '功法进度：乙木养生桩（60/1000）。练一遍，顶六十遍。',
    options: [
      { key: 'A', label: '再来一遍，趁热打铁', next: 'p4' },
      { key: 'B', label: '收功，先去把院门拴上', next: 'p4' },
      { key: 'C', label: '坐下来，把身体的变化摸清楚', next: 'p4' },
    ],
  },
  {
    id: 'p4',
    title: '月欣回来了',
    body: '你收了架势，坐在门槛上。\n\n天亮前那点热乎劲还没散，你心里已经凉下来了。财不露白，力也一样。这世道，谁露底谁先死。\n\n院门口传来脚步声。\n\n姜月欣从外面回来，脸白得像纸，裙子下摆沾着泥。她看见你，脚步硬生生停在门槛外。\n\n平时这孩子回来，隔着半条街都能听见她喊爷爷。',
    options: [
      { key: 'A', label: '先递碗水，等她自己开口', next: 'p5' },
      { key: 'B', label: '直接问，谁欺负你了', next: 'p5' },
      { key: 'C', label: '什么都不问，先去院里拿柴刀', next: 'p5' },
    ],
  },
  {
    id: 'p5',
    title: '孙麻子的话',
    body: '月欣低着头，两只手攥着衣角，指节都白了。\n\n「爷爷……孙麻子说，让你把院子底下埋的紫木交出来。」\n\n她吸了一口气，声音发抖：「他说今天不给，明天就带人来拆屋。」\n\n说完眼泪就掉了：「都怪我，前些天跟二妞说漏了嘴。」\n\n你手里的扇子停住。\n\n紫木是半年前你在青木山捡回来的，一截紫黑的木头，你连月欣都没细说过来历。消息漏出去，来的就不会只是一个孙麻子。',
    system: '威胁已记录。任务：护住姜月欣。',
    options: [
      { key: 'A', label: '拍拍她的头，说没事，爷爷在', next: '' },
      { key: 'B', label: '让她回屋，自己去会会孙麻子', next: '' },
      { key: 'C', label: '问清楚，孙麻子背后是谁', next: '' },
    ],
  },
]

export function getPrologueScene(id: string): PrologueScene | undefined {
  return PROLOGUE.find((scene) => scene.id === id)
}
