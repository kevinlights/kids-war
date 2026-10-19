/**
 * 百科知识 · Encyclopedia question bank.
 *
 * This is a declarative bank: every entry has a stable `id`, so the memory
 * scheduler can track each question individually ("this one is mastered,
 * that one keeps coming back"). The same shape is what an external mod in
 * `public/mods/` produces, so this file doubles as the reference example.
 *
 * Fields: id, grade (3 or 4), prompt, options, answer (index), explain.
 */

export const ENCYCLOPEDIA_ITEMS = [
  // ------------------------------- Grade 3 -------------------------------
  {
    id: 'g3-sunrise',
    grade: 3,
    prompt: '太阳每天从哪个方向升起？',
    options: ['东边', '西边', '南边', '北边'],
    answer: 0,
    explain: '太阳东升西落，因为地球在自西向东自转。'
  },
  {
    id: 'g3-month-count',
    grade: 3,
    prompt: '一年有多少个月？',
    options: ['10 个', '11 个', '12 个', '24 个'],
    answer: 2,
    explain: '一年有 12 个月，平年 365 天，闰年 366 天。'
  },
  {
    id: 'g3-week-days',
    grade: 3,
    prompt: '一个星期有几天？',
    options: ['5 天', '6 天', '7 天', '10 天'],
    answer: 2,
    explain: '一个星期有 7 天，最后两天是周末。'
  },
  {
    id: 'g3-water-freeze',
    grade: 3,
    prompt: '水在多少摄氏度时会结冰？',
    options: ['0 ℃', '10 ℃', '100 ℃', '−10 ℃'],
    answer: 0,
    explain: '标准大气压下，水的凝固点是 0 ℃，沸点是 100 ℃。'
  },
  {
    id: 'g3-rainbow-colors',
    grade: 3,
    prompt: '彩虹一共有几种颜色？',
    options: ['3 种', '5 种', '7 种', '9 种'],
    answer: 2,
    explain: '红、橙、黄、绿、蓝、靛、紫，一共七种。'
  },
  {
    id: 'g3-panda-food',
    grade: 3,
    prompt: '大熊猫最喜欢吃什么？',
    options: ['竹子', '鱼', '肉', '树叶'],
    answer: 0,
    explain: '大熊猫的食物中竹子占绝大多数。'
  },
  {
    id: 'g3-capital',
    grade: 3,
    prompt: '中国的首都是哪座城市？',
    options: ['上海', '北京', '广州', '西安'],
    answer: 1,
    explain: '北京是中国的政治和文化中心。'
  },
  {
    id: 'g3-longest-river',
    grade: 3,
    prompt: '中国最长的河流是哪一条？',
    options: ['黄河', '长江', '珠江', '松花江'],
    answer: 1,
    explain: '长江全长约 6300 千米，是中国第一长河。'
  },
  {
    id: 'g3-tallest-mountain',
    grade: 3,
    prompt: '世界上海拔最高的山峰是哪一座？',
    options: ['泰山', '珠穆朗玛峰', '富士山', '阿尔卑斯山'],
    answer: 1,
    explain: '珠穆朗玛峰海拔 8848.86 米，是世界第一高峰。'
  },
  {
    id: 'g3-fish-breathe',
    grade: 3,
    prompt: '鱼靠什么呼吸？',
    options: ['肺', '鳃', '皮肤', '鳍'],
    answer: 1,
    explain: '鱼用鳃吸收水中的氧气。'
  },
  {
    id: 'g3-tadpole',
    grade: 3,
    prompt: '青蛙小时候叫什么？',
    options: ['蝌蚪', '幼虫', '幼蛙', '鱼苗'],
    answer: 0,
    explain: '青蛙的幼体是蝌蚪，长大后变成青蛙。'
  },
  {
    id: 'g3-seed-spread',
    grade: 3,
    prompt: '蒲公英的种子主要靠什么传播？',
    options: ['风', '水', '动物', '自己弹射'],
    answer: 0,
    explain: '蒲公英的种子带着绒毛，可以随风飘到远处。'
  },
  {
    id: 'g3-compass',
    grade: 3,
    prompt: '指南针静止时，指针指向哪个方向？',
    options: ['东', '南', '西', '北'],
    answer: 3,
    explain: '指南针利用地球磁场，指针指向南北方向。'
  },
  {
    id: 'g3-day-hours',
    grade: 3,
    prompt: '一天有多少个小时？',
    options: ['12 小时', '24 小时', '48 小时', '60 小时'],
    answer: 1,
    explain: '地球自转一周约 24 小时，也就是一天。'
  },
  {
    id: 'g3-moon-light',
    grade: 3,
    prompt: '月亮会自己发光吗？',
    options: ['会，月亮是光源', '不会，它反射太阳光', '只有满月会发光', '只有新月会发光'],
    answer: 1,
    explain: '月亮本身不发光，我们看到的是它反射的太阳光。'
  },
  {
    id: 'g3-ant-sense',
    grade: 3,
    prompt: '蚂蚁主要靠什么传递信息？',
    options: ['翅膀', '触角', '尾巴', '脚'],
    answer: 1,
    explain: '蚂蚁用触角互相碰触，传递气味和信息。'
  },
  {
    id: 'g3-fire-call',
    grade: 3,
    prompt: '发生火灾时应该拨打哪个电话？',
    options: ['110', '119', '120', '114'],
    answer: 1,
    explain: '119 是火警电话，110 是报警电话，120 是急救电话。'
  },
  {
    id: 'g3-biggest-desert',
    grade: 3,
    prompt: '世界上最大的热带沙漠是哪个？',
    options: ['塔克拉玛干沙漠', '撒哈拉沙漠', '戈壁沙漠', '阿拉伯沙漠'],
    answer: 1,
    explain: '撒哈拉沙漠位于非洲北部，是世界上最大的热带沙漠。'
  },
  {
    id: 'g3-national-animal',
    grade: 3,
    prompt: '被称为中国「国宝」的动物是什么？',
    options: ['大熊猫', '金丝猴', '东北虎', '丹顶鹤'],
    answer: 0,
    explain: '大熊猫是中国的国宝，也是世界自然基金会的标志。'
  },
  {
    id: 'g3-rain-source',
    grade: 3,
    prompt: '天空中的雨水主要来自哪里？',
    options: ['云', '风', '山', '河'],
    answer: 0,
    explain: '水蒸气在高空遇冷凝结成云，再以雨雪落下。'
  },
  {
    id: 'g3-biggest-animal',
    grade: 3,
    prompt: '地球上体型最大的动物是什么？',
    options: ['大象', '蓝鲸', '长颈鹿', '鲨鱼'],
    answer: 1,
    explain: '蓝鲸是现存最大的动物，体长可达 30 米。'
  },
  {
    id: 'g3-bee-honey',
    grade: 3,
    prompt: '蜜蜂采花粉主要是为了酿造什么？',
    options: ['蜂蜜', '牛奶', '果汁', '雨水'],
    answer: 0,
    explain: '蜜蜂采花粉和花蜜，酿成蜂蜜作为食物。'
  },
  {
    id: 'g3-penguin-home',
    grade: 3,
    prompt: '企鹅主要生活在哪里？',
    options: ['北极', '南极', '热带雨林', '沙漠'],
    answer: 1,
    explain: '企鹅生活在南半球，大多数在南极及其附近。'
  },
  {
    id: 'g3-camel-hump',
    grade: 3,
    prompt: '骆驼的驼峰里主要储存的是什么？',
    options: ['水', '脂肪', '空气', '沙子'],
    answer: 1,
    explain: '驼峰储存脂肪，需要时分解成能量和水。'
  },
  {
    id: 'g3-brush-teeth',
    grade: 3,
    prompt: '每天最好刷几次牙？',
    options: ['0 次', '1 次', '2 次', '5 次'],
    answer: 2,
    explain: '早晚各刷一次，能有效预防蛀牙。'
  },
  {
    id: 'g3-giraffe-neck',
    grade: 3,
    prompt: '长颈鹿的脖子和人类一样，由几块颈椎组成？',
    options: ['3 块', '7 块', '12 块', '20 块'],
    answer: 1,
    explain: '长颈鹿的颈椎也是 7 块，只是每块特别长。'
  },
  {
    id: 'g3-plant-food',
    grade: 3,
    prompt: '绿色植物主要靠什么制造养分？',
    options: ['阳光', '泥土', '风', '石头'],
    answer: 0,
    explain: '植物靠光合作用，用阳光、水和二氧化碳制造养分。'
  },
  {
    id: 'g3-oxygen',
    grade: 3,
    prompt: '我们呼吸时，主要从空气中吸收哪种气体？',
    options: ['二氧化碳', '氧气', '氮气', '水蒸气'],
    answer: 1,
    explain: '人呼吸需要氧气，呼出二氧化碳。'
  },
  {
    id: 'g3-flag-color',
    grade: 3,
    prompt: '中国国旗五星红旗的底色是什么颜色？',
    options: ['黄色', '红色', '蓝色', '白色'],
    answer: 1,
    explain: '五星红旗是红底，左上方有五颗黄色五角星。'
  },
  {
    id: 'g3-spring-festival',
    grade: 3,
    prompt: '中国最隆重的传统节日是哪一个？',
    options: ['端午节', '春节', '中秋节', '劳动节'],
    answer: 1,
    explain: '春节是农历新年，是中国人最隆重的传统节日。'
  },
  {
    id: 'g3-traffic-light',
    grade: 3,
    prompt: '过马路时，看到什么颜色的灯才能通行？',
    options: ['红灯', '绿灯', '黄灯', '任何灯'],
    answer: 1,
    explain: '红灯停、绿灯行、黄灯等一等。'
  },
  {
    id: 'g3-heart-job',
    grade: 3,
    prompt: '人的心脏最主要的作用是什么？',
    options: ['泵送血液', '消化食物', '呼吸空气', '思考问题'],
    answer: 0,
    explain: '心脏像水泵一样，把血液送到全身各处。'
  },

  // ------------------------------- Grade 4 -------------------------------
  {
    id: 'g4-earth-year',
    grade: 4,
    prompt: '地球绕太阳公转一圈，大约需要多长时间？',
    options: ['一天', '一个月', '一年', '十年'],
    answer: 2,
    explain: '地球公转一周约 365 天，就是一年。'
  },
  {
    id: 'g4-light-speed',
    grade: 4,
    prompt: '光在真空中的传播速度约为多少？',
    options: ['每秒 30 万千米', '每秒 30 千米', '每秒 3000 千米', '每秒 3 千米'],
    answer: 0,
    explain: '光速约为每秒 30 万千米，是最快的速度。'
  },
  {
    id: 'g4-skin',
    grade: 4,
    prompt: '人体面积最大的器官是什么？',
    options: ['肝脏', '皮肤', '大脑', '肺'],
    answer: 1,
    explain: '皮肤包住整个身体，是面积最大的器官。'
  },
  {
    id: 'g4-four-inventions',
    grade: 4,
    prompt: '下面哪一项不是中国古代四大发明？',
    options: ['造纸术', '指南针', '火药', '地动仪'],
    answer: 3,
    explain: '四大发明是造纸术、印刷术、火药和指南针。'
  },
  {
    id: 'g4-largest-country',
    grade: 4,
    prompt: '世界上陆地面积最大的国家是哪个？',
    options: ['中国', '俄罗斯', '美国', '加拿大'],
    answer: 1,
    explain: '俄罗斯陆地面积约 1700 万平方千米，居世界第一。'
  },
  {
    id: 'g4-nearest-planet',
    grade: 4,
    prompt: '太阳系中离太阳最近的行星是哪一颗？',
    options: ['水星', '金星', '地球', '火星'],
    answer: 0,
    explain: '八大行星由近到远是：水、金、地、火、木、土、天王、海王。'
  },
  {
    id: 'g4-china-area',
    grade: 4,
    prompt: '中国的陆地面积大约是多少万平方千米？',
    options: ['96 万', '320 万', '960 万', '1700 万'],
    answer: 2,
    explain: '中国陆地面积约 960 万平方千米，居世界第三。'
  },
  {
    id: 'g4-yellow-river',
    grade: 4,
    prompt: '黄河发源于哪座高原？',
    options: ['云贵高原', '青藏高原', '黄土高原', '内蒙古高原'],
    answer: 1,
    explain: '黄河发源于青藏高原的巴颜喀拉山北麓。'
  },
  {
    id: 'g4-paper',
    grade: 4,
    prompt: '改进造纸术的中国古代科学家是谁？',
    options: ['张衡', '蔡伦', '毕昇', '祖冲之'],
    answer: 1,
    explain: '东汉蔡伦改进造纸术，让纸张变得便宜好用。'
  },
  {
    id: 'g4-yangtze-length',
    grade: 4,
    prompt: '长江全长大约多少千米？',
    options: ['6300 千米', '1200 千米', '5400 千米', '3600 千米'],
    answer: 0,
    explain: '长江全长约 6300 千米，是中国第一长河。'
  },
  {
    id: 'g4-deepest-trench',
    grade: 4,
    prompt: '世界上最深的海沟是哪一条？',
    options: ['马里亚纳海沟', '波多黎各海沟', '日本海沟', '汤加海沟'],
    answer: 0,
    explain: '马里亚纳海沟最深处超过 11000 米。'
  },
  {
    id: 'g4-insect-legs',
    grade: 4,
    prompt: '昆虫一般有几条腿？',
    options: ['4 条', '6 条', '8 条', '10 条'],
    answer: 1,
    explain: '昆虫都有 6 条腿，身体分为头、胸、腹三部分。'
  },
  {
    id: 'g4-spider-legs',
    grade: 4,
    prompt: '蜘蛛有几条腿？',
    options: ['6 条', '8 条', '10 条', '12 条'],
    answer: 1,
    explain: '蜘蛛有 8 条腿，不属于昆虫。'
  },
  {
    id: 'g4-red-blood-cell',
    grade: 4,
    prompt: '血液中主要负责运输氧气的是什么？',
    options: ['红细胞', '白细胞', '血小板', '血浆'],
    answer: 0,
    explain: '红细胞里的血红蛋白能携带氧气。'
  },
  {
    id: 'g4-sound-vacuum',
    grade: 4,
    prompt: '声音能在真空中传播吗？',
    options: ['能', '不能', '只能很小声', '不确定'],
    answer: 1,
    explain: '声音需要空气等介质，真空中无法传播。'
  },
  {
    id: 'g4-air-most',
    grade: 4,
    prompt: '空气中含量最多的气体是什么？',
    options: ['氧气', '氮气', '二氧化碳', '水蒸气'],
    answer: 1,
    explain: '空气中氮气约占 78%，氧气约占 21%。'
  },
  {
    id: 'g4-journey-author',
    grade: 4,
    prompt: '《西游记》的作者是谁？',
    options: ['罗贯中', '吴承恩', '曹雪芹', '施耐庵'],
    answer: 1,
    explain: '《西游记》是明代吴承恩写的长篇神话小说。'
  },
  {
    id: 'g4-national-day',
    grade: 4,
    prompt: '中国的国庆节是每年的哪一天？',
    options: ['10 月 1 日', '7 月 1 日', '5 月 1 日', '1 月 1 日'],
    answer: 0,
    explain: '1949 年 10 月 1 日中华人民共和国成立。'
  },
  {
    id: 'g4-thermometer',
    grade: 4,
    prompt: '用来测量气温的仪器叫什么？',
    options: ['温度计', '气压计', '天平', '量筒'],
    answer: 0,
    explain: '温度计用来测量温度，气温通常用摄氏度表示。'
  },
  {
    id: 'g4-bat',
    grade: 4,
    prompt: '蝙蝠在黑暗中主要靠什么辨别方向？',
    options: ['眼睛', '超声波', '嗅觉', '触觉'],
    answer: 1,
    explain: '蝙蝠发出超声波，靠回声定位在黑暗中飞行。'
  },
  {
    id: 'g4-whale',
    grade: 4,
    prompt: '鲸鱼属于哪一类动物？',
    options: ['鱼类', '哺乳动物', '两栖动物', '爬行动物'],
    answer: 1,
    explain: '鲸鱼用肺呼吸、胎生并哺乳幼崽，是哺乳动物。'
  },
  {
    id: 'g4-bamboo',
    grade: 4,
    prompt: '竹子属于哪一类植物？',
    options: ['木本植物', '草本植物', '蕨类植物', '藻类植物'],
    answer: 1,
    explain: '竹子是禾本科的草本植物，茎中空有节。'
  },
  {
    id: 'g4-earthquake',
    grade: 4,
    prompt: '地震发生时，在教室里最应该怎么做？',
    options: ['立即跳窗逃生', '躲在结实的桌子下护住头', '乘电梯下楼', '站在原地不动'],
    answer: 1,
    explain: '地震时先就近躲避、护住头部，等震动停止再有序撤离。'
  },
  {
    id: 'g4-highest-plateau',
    grade: 4,
    prompt: '世界上海拔最高的高原是哪一座？',
    options: ['巴西高原', '青藏高原', '东非高原', '黄土高原'],
    answer: 1,
    explain: '青藏高原平均海拔 4000 米以上，被称为「世界屋脊」。'
  },
  {
    id: 'g4-dragon-boat',
    grade: 4,
    prompt: '端午节的传统食品是什么？',
    options: ['月饼', '粽子', '汤圆', '饺子'],
    answer: 1,
    explain: '端午节吃粽子、赛龙舟，纪念屈原。'
  },
  {
    id: 'g4-jupiter',
    grade: 4,
    prompt: '太阳系中体积最大的行星是哪一颗？',
    options: ['地球', '木星', '土星', '火星'],
    answer: 1,
    explain: '木星是太阳系中体积和质量最大的行星。'
  },
  {
    id: 'g4-moon-month',
    grade: 4,
    prompt: '月亮绕地球一圈大约需要多少天？',
    options: ['约 7 天', '约 30 天', '约 365 天', '约 100 天'],
    answer: 1,
    explain: '月球绕地球一周约 27.3 天，接近一个月。'
  },
  {
    id: 'g4-rust',
    grade: 4,
    prompt: '铁生锈需要同时接触氧气和什么？',
    options: ['水', '氮气', '二氧化碳', '阳光'],
    answer: 0,
    explain: '铁在潮湿的空气中容易生锈，所以要保持干燥。'
  },
  {
    id: 'g4-body-temp',
    grade: 4,
    prompt: '人体的正常体温大约是多少摄氏度？',
    options: ['27 ℃', '32 ℃', '37 ℃', '42 ℃'],
    answer: 2,
    explain: '人体正常体温约 37 ℃，过高或过低都不健康。'
  },
  {
    id: 'g4-quiet-night',
    grade: 4,
    prompt: '古诗《静夜思》的作者是谁？',
    options: ['杜甫', '李白', '白居易', '王维'],
    answer: 1,
    explain: '《静夜思》是唐代诗人李白的名作。'
  },
  {
    id: 'g4-pi',
    grade: 4,
    prompt: '把圆周率精确计算到小数点后七位的中国古代科学家是谁？',
    options: ['祖冲之', '张衡', '僧一行', '徐光启'],
    answer: 0,
    explain: '南北朝时期的祖冲之把圆周率算到 3.1415926 和 3.1415927 之间。'
  },
  {
    id: 'g4-oil-pan',
    grade: 4,
    prompt: '炒菜时油锅着火，最不应该做的是什么？',
    options: ['盖上锅盖', '往锅里浇水', '关掉火源', '用湿抹布覆盖'],
    answer: 1,
    explain: '水比油重会沉下去并飞溅，油火会爆开，应该盖锅盖隔绝空气。'
  }
]
