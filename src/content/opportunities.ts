import type { ChoiceKey, Option } from '../game/types'

interface Opportunity {
  insteadOf: ChoiceKey
  context: string
  requires?: string
  action: Omit<Option, 'key' | 'next'>
}

export const OPPORTUNITIES: Readonly<Record<string, readonly Opportunity[]>> = {
  money02c: [{
    insteadOf: 'C', requires: 'MONEY01_0',
    context: '卢旭刚补过两次交纸的经过，陆晚已经约到接纸时在场的人。',
    action: {
      label: '先让接纸时在场的人独立认交付日期。',
      tendency: 'evidence', risk: 'low', effects: { relation: 1, world: -1, flags: ['MONEY02_2'] },
      consequence: '在场人只认得其中一张，说另外两张不在自己那次。你将他的范围独立记下，另请陆晚核收款联系；凭证流转与钱真正到账仍是不同的问题。',
      progress: '交纸见证有独立范围，收款与交付仍分别核。',
    },
  }],
  clock01c: [{
    insteadOf: 'C', requires: 'FEAST01_0',
    context: '摄影师留下的连续照片还在，能看清当时收摊占去半条巷子。',
    action: {
      label: '请摄影师先核拥堵时段，再更正车辆筛查条件。',
      tendency: 'evidence', risk: 'low', effects: { clue: 1, world: -1, flags: ['CLOCK01_2'] },
      consequence: '摄影师按原片说明收摊的前后，找车组收到新的遮挡条件。你同时撤回尚未核实的套牌描述，车型疑点保留，原片没有被当成车辆身份的结论。',
      progress: '收摊条件补入筛查，套牌描述仍待核。',
    },
  }],
  yuan03c: [{
    insteadOf: 'C', requires: 'YUAN01_2',
    context: '陆晚已经留住工人看原片前的回忆，食堂经办也愿意提供设备校时记录。',
    action: {
      label: '先对食堂设备时间，再给疑似片段留空档。',
      tendency: 'evidence', risk: 'low', effects: { clue: 1, world: -1, flags: ['YUAN03_2'] },
      consequence: '设备偏差有了维护来源，陆晚将可确认片段与只是同衣服的画面分列。工人的补述还要独立核，两份材料没有因为时间接近就变成一条完整路线。',
      progress: '袁衷片段有校时依据，疑似部分仍不硬接。',
    },
  }],
  key05c: [{
    insteadOf: 'C', requires: 'KEY04_0',
    context: '旧窗维护照片已留存，贺川找到能核抽屉搬动的经办人。',
    action: {
      label: '请经办人先认搬动日期，不先给他看闻茉的图。',
      tendency: 'empathy', risk: 'low', effects: { relation: 1, world: -1, flags: ['KEY05_2'] },
      consequence: '经办人独立指出一次搬动，但还要核原工单才敢定日。你保留他没看图前的描述，维护与保管时段继续分开核，不让窗台形状替钥匙归还作证。',
      progress: '保管地点的时期有独立经办人待核。',
    },
  }],
  well03c: [{
    insteadOf: 'C', context: '门卫带来一张旧巡查草图，指着已经封住的通道。',
    action: {
      label: '请门卫先画亲自巡查的范围，再找结构图比对。',
      tendency: 'evidence', risk: 'low', effects: { clue: 1, world: -1, flags: ['F_WELL_PASSAGE'] },
      consequence: '门卫把亲自到过的位置画实线，没进去过的地方留白。你请他签草图日期，交给勘查组核对旧结构；他不知道的入口没有被补画成运送路线。',
      progress: '巡查草图留下明确范围，等待结构图核验。',
    },
  }],
  p01c: [
    {
      insteadOf: 'B',
      context: '伴娘还举着镜子。她刚才一直站在叶小满身后。',
      action: {
        label: '请伴娘替你坐一下，看看叶小满会不会让座。',
        tendency: 'intuition', risk: 'medium', effects: { clue: 3, relation: -1, danger: 1, world: -1 },
        consequence: '伴娘刚碰到椅背，叶小满就把空椅往回拖了一寸。她没看伴娘，倒是先看杜衡。杜衡还在邻桌，手里的酒没往嘴边送。叶小满转过来问你：「你要问我，为什么不自己问？」',
        progress: '知道了那张空椅不能随便坐，也让叶小满起了戒心。',
      },
    },
    {
      insteadOf: 'B',
      context: '摄影师还在调焦，叶小满的手没离开椅背。',
      action: {
        label: '把自己的席卡翻过去，让她写空椅留给谁。',
        tendency: 'empathy', risk: 'low', effects: { relation: 1, world: 1, flags: ['F_WEDDING_BLANK_CARD'] },
        consequence: '叶小满接过笔，没有写名字。她把原来印着你名字的那面朝上，在下面加了个很小的问号。摄影师来拿席卡，她用手掌盖住：「这张是她的，等会儿还要还她。」',
        progress: '叶小满留下了席卡，等有机会再把话说完。',
      },
    },
  ],
  p03c: [{
    insteadOf: 'B', requires: 'F_WEDDING_BLANK_CARD',
    context: '叶小满经过时把那张席卡塞给你，问号下面多了一行字。',
    action: {
      label: '把席卡压在杯底，等她回来一起看。',
      tendency: 'empathy', risk: 'low', effects: { clue: 1, relation: 1, danger: -1, world: 1 },
      consequence: '纸上那行字是「后厨那桌有人没来」。叶小满换完鞋回来，你才把杯子抬起来。她没让你去找人，只把纸转过来，指给你看自己说的是哪一桌。司仪正好念到第二个奖，没人往这边看。',
      progress: '你和叶小满私下对过了后厨的席位。',
    },
  }],
  p04c: [{
    insteadOf: 'C', requires: 'F_P_WITNESS_VAN',
    context: '司机认出传话的那位乘客，他还在路边等车。',
    action: {
      label: '找后排乘客，当面核对他是怎么认出伴郎的。',
      tendency: 'evidence', risk: 'low', effects: { relation: 1, world: 1, flags: ['F_P_PASSENGER_CHECK'] },
      consequence: '乘客一开始说看到了胸花。你请他站回等车的位置，他才指着自己的手机说，胸花是从婚宴的照片上认出来的。真正经过巷口时，他没看清那人穿什么。',
      progress: '乘客认出的是婚宴照片里的人，不是巷口经过的人。',
    },
  }],
  p08c: [{
    insteadOf: 'A', context: '刘琼的妹妹每问一句收不收，就把袋口捏得更紧一点。',
    action: {
      label: '请她自己把东西拿出来，当面写一张接收单。',
      tendency: 'empathy', risk: 'low', effects: { clue: 1, relation: 1, world: 1, flags: ['F_P_FAMILY_RECEIPT'] },
      consequence: '她跟你走到车旁，把身份证和旧手机一样样搁在后备厢边沿。陆晚记下接收时间，撕下留存联。她接过来，还险些把手机又揣回去：「背壳也别丢，那是他自己换的。」',
      progress: '当面核对了手机和身份证，家属带走了接收单。',
    },
  }],
  c0102c: [{
    insteadOf: 'B', context: '送检单的备注栏还空着，顾淮正等你落笔。',
    action: {
      label: '把暂未排除的来源也写进送检单，由你签名。',
      tendency: 'evidence', risk: 'medium', effects: { clue: 2, danger: 1, flags: ['F_MISSING_LIST'] },
      consequence: '你把三种说法并排写在备注里，只在能确认的那一条下划线。顾淮看完，问要不要把另外两条擦掉。你在备注下面签了名。陆晚把失踪人口名单另存一页，等你回来再核。',
      progress: '保存了三种待查的来源，送检记录由你负责。',
    },
  }],
  c0106c: [{
    insteadOf: 'A', context: '战远没再往井口挪。贺川手里的封条还是完整的。',
    action: {
      label: '先封井，请战远在封条背面写下他非看不可的地方。',
      tendency: 'empathy', risk: 'low', effects: { clue: 1, danger: -2, world: 1, flags: ['F_TEN_MIN'] },
      consequence: '战远接了笔，却没有往井边去。他托着封条写了「第二级踏板」，又把笔还给贺川。你们在井口把这四个字一块儿记下来。封条贴上以后，他最后一个从车间出去。',
      progress: '井口先封起来了，第二级踏板留待复核。',
    },
  }],
  c0201c: [{
    insteadOf: 'C', context: '湖边还有信号，陆晚把手机举在肩侧等你。',
    action: {
      label: '请值班室先核山庄营业时间，约好正式访问。',
      tendency: 'intuition', risk: 'low', effects: { relation: 1, danger: -2, world: 1 },
      consequence: '值班室联系前台，约好次日上午核查调度。陆晚留下来车记录和联络单，请属地继续守车。安全组来电说井口可以复勘，你们先返回老厂，不让山庄预约挤掉现场交接。',
      progress: '山庄访问已预约，先返回老厂复勘。',
    },
  }],
  c0204c: [{
    insteadOf: 'A', context: '司机同意留下工单联络，车窗仍开着。',
    action: {
      label: '请司机指明工单哪一项是本人经手，再独立核单位。',
      tendency: 'intuition', risk: 'medium', effects: { clue: 2, relation: -1, danger: 1, world: -1, flags: ['VILLA_VAN_0'] },
      consequence: '司机只认自己接过的提货号，物品内容并不知情。你留下工单与本人联络，另由陆晚核单位签发；没有因为他不愿开袋就认定藏有案情，纸袋来源仍独立记录。',
      progress: '工单个人经手与单位签发分开核验。',
    },
  }],
  c0301c: [{
    insteadOf: 'B', context: '节目单落地时背面朝上，纸角有一块没干的糖。',
    action: {
      label: '请摊主把节目单翻过来，只问这张纸是不是他的。',
      tendency: 'intuition', risk: 'medium', effects: { clue: 2, relation: -1, world: -1 },
      consequence: '摊主捏住纸角翻过去。背面有两道糖印，一道完整，一道让人折过。他说前一张是自己垫竹签的，这张不是。说完他把纸往你这边一推，把刚放下的糖勺拿了回去。',
      progress: '摊主把两次出现的节目单区分开了。',
    },
  }],
  c0305c: [{
    insteadOf: 'A', context: '台口只留了一盏灯，他已经拿起自己的东西。',
    action: {
      label: '把笔递给他，让他自己划掉笔录里没亲眼看见的事。',
      tendency: 'evidence', risk: 'low', effects: { clue: 1, relation: 1, danger: -1, world: 1 },
      consequence: '他一行行读，划到第三行才停下来：「这个是我听人说的。」你拿另一张纸把那句话单独抄了下来。他起身走到门边，又折回来，在第一行「看见」两个字下面画了一条线。',
      progress: '把亲眼所见和听来的话分开了。',
    },
  }],
  c0403c: [{
    insteadOf: 'B', context: '照片露出一半，桌面留着它原来压住的浅色印子。',
    action: {
      label: '请陆晚拍下照片和桌上的印子，不去叫外面的人。',
      tendency: 'evidence', risk: 'low', effects: { clue: 2, danger: -1, world: 1 },
      consequence: '陆晚把灯挪低，先照整张香案，再照桌面上那块浅印。照片翻过来，背面留着一道香炉脚的黑印，和桌面上那一道接得上。她没有抹，把新照片和旧照片分开编号。',
      progress: '留下了照片原本摆放的位置，不用惊动祠堂外的人。',
    },
  }],
  c0407c: [{
    insteadOf: 'A', requires: 'F_WITH_GUHUAI', context: '顾淮发来一张车票的照片，是刚才在半山墓园没给你看的那张。',
    action: {
      label: '把车票上的日期念给战远听，先不提顾淮。',
      tendency: 'empathy', risk: 'low', effects: { memory: 2, relation: 1, world: 1 },
      consequence: '战远听到月份就抬起头，等你把日期念完。他用手把花底下的报纸往里收了收：「那年也是这几天，我爸第一次带我来。」你之前从没把那张车票和这条上坡的路放在一起。',
      progress: '把车票上的日期和战远记得的那段日子对上了。',
    },
  }],
  c0502c: [{
    insteadOf: 'A', context: '没有客人进门。靠柜台那头摊着一本店里的排班表。',
    action: {
      label: '只抄排班表的日期，请店员别在这儿说名字。',
      tendency: 'empathy', risk: 'low', effects: { relation: 2, danger: -1, world: 1 },
      consequence: '你把人名那列折到纸背后，拿自己的本子抄了三个日期。整理衣架的人站了一会儿，把其中一天纠正过来：「那天换过班。」她说完没再看旁边的人，继续把衣架一只只挂齐。',
      progress: '店员纠正了一个日期，没有当面留下姓名。',
    },
  }],
  c0508c: [{
    insteadOf: 'B', context: '顾淮不便多说。他还看着你手里的笔。',
    action: {
      label: '把笔交给顾淮，请他只写下材料该交给谁。',
      tendency: 'empathy', risk: 'low', effects: { clue: 1, relation: 2, world: 1 },
      consequence: '顾淮握笔握了两回，在登记本上写了陆晚的名字，又在下面添了「两个人在场」。他把笔放下，没有等你问第二件事。陆晚把那一页朝床那边转过去，等他点头才合上。',
      progress: '顾淮指定了接收人，也说清了交接条件。',
    },
  }],
  c0602c: [{
    insteadOf: 'A', context: '周组长站在原地，看着两本册子的空行。',
    action: {
      label: '请周组长指出哪一次没进病房，先查那天的空白。',
      tendency: 'evidence', risk: 'low', effects: { clue: 2, world: 1 },
      consequence: '周组长不看签名，只翻到值班记录最薄的那一页。那天有一栏没填，前后两栏却是同一支笔。你让她把亲眼看见的日期念了一遍，把另外几天单独留着，等查到值班人再说。',
      progress: '找到了一次明确没进病房的探视。',
    },
  }],
  c0607c: [{
    insteadOf: 'B', context: '方恬没进门，但一直看着封条那端。',
    action: {
      label: '把箱子转向方恬，请她决定谁来揭封条。',
      tendency: 'empathy', risk: 'low', effects: { relation: 2, danger: -1, world: 1 },
      consequence: '你把手收回来，把封条朝门口推过去。方恬过了门槛才说：「你来。我只想看着它怎么开。」陆晚把接收本端到她身前，给她腾出能看清箱盖的地方，没再叫她签字。',
      progress: '方恬亲自确认了开箱的人，陆晚保留了交接记录。',
    },
  }],
  c0702c: [{
    insteadOf: 'B', context: '陆晚把两个证物袋并排放好，日历只折到了三月。',
    action: {
      label: '让陆晚核对药瓶领用日，你只查日历上没打圈的那周。',
      tendency: 'evidence', risk: 'medium', effects: { clue: 2, danger: 1, world: -1 },
      consequence: '药瓶的领用日期和圈上的日子错了一周。你隔着袋子数过去，那一周没有圈，纸上却有两处针尖大的孔。陆晚把孔的位置画到记录上，打电话去核领用日期，等了很久才有人接。',
      progress: '找到了日历标记和领药日期的错位，也惊动了值班的人。',
    },
  }],
  c0707c: [{
    insteadOf: 'B', context: '十三个勾都清楚，最后一个名字后面的空格比别处长。',
    action: {
      label: '先把没勾的那一行单独抄给陆晚，两人各查一份。',
      tendency: 'evidence', risk: 'low', effects: { clue: 1, relation: 1, danger: -1, world: 1 },
      consequence: '你把单独的一行摊在陆晚面前，没报人名。她扫了一眼，把纸折起来收进外衣口袋：「各走各的，谁先查到谁回来。」岸边又响了一下，她合上问询本，没有从靠窗那一侧出去。',
      progress: '你和陆晚分开核实最后一行，名单没有对外传阅。',
    },
  }],
  c0410c: [{
    insteadOf: 'B', context: '顾淮站在门口，手里还捏着那张粉梅照片。',
    action: {
      label: '请他把照片留下，你亲自去核对遗物柜。',
      tendency: 'evidence', risk: 'medium', effects: { clue: 2, danger: 1, world: -1 },
      consequence: '顾淮把照片压在登记簿下，你跟着他回了法医室。柜门打开时，铁盒在最上层，干花已经压成薄片。他没替你念纸条，只把领取簿翻到那一页，让你自己抄下时间和签名。',
      progress: '遗物柜的领取记录由你亲手抄下，粉梅照片留在局里。',
    },
  }],
  c0510c: [{
    insteadOf: 'A', context: '护士换完药，姜瑾还坐在床边，手指扣着包带。',
    action: {
      label: '请她把看过的合同名称写一张便条，不留复印件。',
      tendency: 'evidence', risk: 'low', effects: { clue: 1, relation: 1, world: 0 },
      consequence: '姜瑾想了一会儿，写下三个项目名称，最后一个只写了半截。她说那半截还不能给，得先问过委托方。你把便条折好夹进问询本，没有追问她为什么坐在病房里。',
      progress: '你拿到了项目便条，姜瑾答应把缺的那截补上。',
    },
  }],
  c0610c: [{
    insteadOf: 'B', context: '门缝里的光一直没动，护工在走廊另一头收盘子。',
    action: {
      label: '先请护工把今晚的陪护表拿来，再决定进不进去。',
      tendency: 'evidence', risk: 'low', effects: { clue: 1, danger: -1, world: 1 },
      consequence: '护工把表递过来，最后一栏的签名被水浸过，只剩下半个字。陆晚用手机拍下角落的床号，说这张表不能单独证明谁在屋里。门缝里的光还亮着，你把表还回去，没有敲门。',
      progress: '陪护表留下了疑点，你没有在夜里惊动老人。',
    },
  }],
  c0710c: [{
    insteadOf: 'B', context: '退潮露出的小路只剩一条窄边，陆晚把防水袋背好了。',
    action: {
      label: '让守前门的一组多带一部对讲机，小路只留一个人。',
      tendency: 'evidence', risk: 'medium', effects: { clue: 1, danger: -1, world: 1 },
      consequence: '傅铮看了你一眼，把备用机塞给前门那组。小路上只留陆晚一个人，她说人少反而看得清。潮水还没涨回来，三组的手电依次亮了一下，谁也没有提前往院子里看。',
      progress: '前门通信加强，小路只留一人守候。',
    },
  }],
}
