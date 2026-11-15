export {BRAND, ENGLISH_BRAND} from './brand.js';
export const SECTION_IDS = ['about', 'podcast', 'articles', 'contact'];
export const LANGUAGES = [
  {id: 'zh-CN', label: '简体中文', flag: 'cn'},
  {id: 'zh-TW', label: '繁體中文', flag: 'hk'},
  {id: 'en', label: 'English', flag: 'us'},
];

const stationId = '678bd3cc2271efa33738daf8';
export const LINKS = {
  xiaoyuzhou: 'https://www.xiaoyuzhoufm.com/podcast/' + stationId,
  redNote: 'https://xhslink.cn/m/3WX73xVhBbt',
};

// Recording IDs and durations from https://feed.xyzfm.space/ymtpn63mx4nu.
const recordings = [
  ['8.3', '6aef4abdb4a4e20202f64f05', 'lneKnMkkt91bzitPF-lfn3EAiUXl', 8600, '2026-11-08', 'festivals', 'cannes'],
  ['8.2', '6aef49a65b7c4709bfe29bf9', 'lnvHhpy_s5q-9khRtIqa8xYnTWkv', 7270, '2026-11-08', 'festivals', 'cannes'],
  ['8.1', '6a985441f03e74ee6b041e11', 'ltM9_Rz94YAegHhruD_ufPiVYTPM', 7785, '2026-09-03', 'festivals', 'cannes'],
  ['7', '69df84bcb977fb2c4705ef82', 'llW5EWwLAUw4DlvL3s1PgNSVp30G', 5791, '2026-04-15', 'focus'],
  ['6', '69cf8f4ae2c8be31554ccf8e', 'lgQRuhVPxqKbqfvrChVc05K9orGl', 2958, '2026-04-03', 'cinemas'],
  ['4.3', '698fbe86a22480add6142158', 'lpOCafRttGhHbwVsxoTb5g9XriAN', 10499, '2026-02-14', 'festivals', 'cannes'],
  ['5', '68815d13a12f9ff06ab5eb0c', 'ltDTjRzkZ03s-vRHgxmVRnxADE17', 2586, '2025-07-23', 'cinemas'],
  ['4.2', '684940edb23ed76e607fa4d9', 'ls4vKzk-fvXJSVEVMjbWlN-tYjwd', 3262, '2025-06-11', 'festivals', 'cannes'],
  ['4.1', '68493eed1c45a63232a602e6', 'lrxzEyrd97KJKdMjv887MxthZKm9', 3923, '2025-06-11', 'festivals', 'cannes'],
  ['3', '6810f5526970cc7b4df7a654', 'lrP31C9nNhgieHu2ZGCa_LZicr-V', 5770, '2025-04-29', 'focus'],
  ['2.2', '67d1c5c5e924d4525a310a8c', 'lmB6OyQBTJEE5P9VPrZqKRG5Egl5', 6137, '2025-03-13', 'festivals', 'berlin'],
  ['2.1', '67c1cb8fb0167b8db9aab41b', 'lu_nLiYYmdLa0kua_ML7UzqBzMpa', 2565, '2025-02-28', 'festivals', 'berlin'],
  ['1', '678c3353fd38652366ffe99b', 'll-3YQVNhMhPvhgSytDB2IX9CAyw', 8976, '2025-01-18', 'focus'],
];
// Compare each numeric part so, for example, 8.10 comes before 8.3.
const episodeNumbers = new Intl.Collator('en', {numeric: true});
recordings.sort(([a], [b]) => episodeNumbers.compare(b, a));


const copy = {
  'zh-CN': {
    nav: {about: '关于我们', podcast: '播客', articles: '文章', contact: '联系我们'},
    ui: {
      navigation: '主导航', language: '切换语言', home: '回到电视首页', skip: '跳至正文',
      sections: '目录', hosts: '主播', socialAccounts: '社交账号', openLink: '在新窗口打开', articlesPending: '文章待更新',
    },
    about: {
      title: '关于我们', statement: ['视线有偏差，', '电影有回声。'],
      portraitAlt: '戴墨镜的人在街上望向右方。', handAlt: '戴戒指的手夹着一支烟。',
      paragraphs: [
        '每一双眼睛，乃至每一只眼，看电影和世界的角度都不尽相同，也造就了我们有时截然不同的“观点”。',
        '允许不同视角的交流、不同立场的碰撞，这里是“视差”发声的空间。',
      ],
      hosts: [
        {name: '红酒', account: '（豆瓣@红酒与谋杀）', bio: '不想再捣鼓学术的电影打工人'},
        {name: '新元', account: '（豆瓣@Kinyuan）', bio: '酷儿与电影研究的在读博士生。'},
      ],
    },
    podcast: {title: '播客', intro: '从柏林、戛纳的放映厅，聊到家门口的院线。'},
    articles: {title: '文章', status: 'stay tuned'},
    contact: {
      title: '联系我们', intro: '有想聊的选题、合作的念头，或只是想推荐一部电影？给我们捎个信。',
      channels: {redNote: '小红书', xiaoyuzhou: '小宇宙'},
    },
    categories: {festivals: '影节庆', focus: '焦点', cinemas: '院线'},
    titles: {
      '8.3': ['聚焦戛纳：《故土》最长？滨口最短？', '戛纳获奖片讨论的下半场，从《故土》聊到滨口龙介的《突如其来》。'],
      '8.2': ['聚焦戛纳：蒙吉的第二金，含金量如何？', '从《峡湾》拿下金棕榈说起，聊第79届戛纳评审团看中了什么。'],
      '8.1': ['聚焦戛纳：诺兰为什么没进戛纳', '八鸽带着《奥德赛》的 IMAX 画幅问题来做客，也聊到这一年在戛纳空手而归的电影。'],
      '7': ['震撼到“张口结舌”的2025新片', '从《无可奈何》到《局外人》和《罪人》，回看两个人的2025片单。'],
      '6': ['《至尊马蒂》到底“至尊”在哪儿？', '从球员的身体、剪辑的节奏，聊到乔什·萨弗迪镜头里的提莫西·查拉梅。'],
      '4.3': ['聚焦戛纳：你“戈达尔”了没？', '和鲍勃粥聊戛纳没拿奖的片子，也借《新浪潮》问一句：到底谁在学谁？'],
      '5': ['《F1》：可能这就是今年最好的工业电影', '怎样把赛车的速度拍给坐在影院里的人看？从《F1》聊车载摄影，也聊《极速风流》。'],
      '4.2': ['聚焦戛纳：深度讨论《风林火山》和《狂野时代》', '把麦浚龙和毕赣的两部新片放在一起，看他们怎样组织影像、讲故事。'],
      '4.1': ['聚焦戛纳：平庸的金棕榈是一次“普通事故”', '从《普通事故》的巧合与结尾，聊到第78届戛纳的整张获奖名单。'],
      '3': ['贝尼特·米勒和失落的美国梦', '从《巡游》到《狐狸猎手》，沿四部长片重看贝尼特·米勒笔下的美国。'],
      '2.2': ['聚焦柏林：全面回顾第75届柏林电影节', '新艺术总监上任后的第一届柏林，和前任留下的五年，放在一起看。'],
      '2.1': ['聚焦柏林：评《生息之地》《想飞的女孩》两部华语主竞赛作品', '两位主播在柏林碰头，无剧透地聊霍猛和文晏的两部主竞赛作品。'],
      '1': ['我们的2024新片总结', '第一次打开麦克风，从各自的年度五佳和五差聊起。'],
    },
  },
  'zh-TW': {
    nav: {about: '關於我們', podcast: '播客', articles: '文章', contact: '聯絡我們'},
    ui: {
      navigation: '主導覽', language: '切換語言', home: '回到電視首頁', skip: '跳至正文',
      sections: '目錄', hosts: '主持人', socialAccounts: '社群帳號', openLink: '在新視窗開啟', articlesPending: '文章待更新',
    },
    about: {
      title: '關於我們', statement: ['視線有偏差，', '電影有回聲。'],
      portraitAlt: '戴墨鏡的人在街上望向右方。', handAlt: '戴戒指的手夾著一支菸。',
      paragraphs: [
        '每一雙眼睛，乃至每一隻眼，看電影和世界的角度都不盡相同，也造就了我們有時截然不同的「觀點」。',
        '允許不同視角的交流、不同立場的碰撞，這裡是「視差」發聲的空間。',
      ],
      hosts: [
        {name: '紅酒', account: '（豆瓣@红酒与谋杀）', bio: '不想再搗鼓學術的電影打工人'},
        {name: '新元', account: '（豆瓣@Kinyuan）', bio: '酷兒與電影研究的在讀博士生。'},
      ],
    },
    podcast: {title: '播客', intro: '從柏林、坎城的放映廳，聊到家門口的電影院。'},
    articles: {title: '文章', status: 'stay tuned'},
    contact: {
      title: '聯絡我們', intro: '有想聊的題目、合作的念頭，或只是想推薦一部電影？歡迎來信。',
      channels: {redNote: '小紅書', xiaoyuzhou: '小宇宙'},
    },
    categories: {festivals: '影展', focus: '焦點', cinemas: '院線'},
    titles: {
      '8.3': ['聚焦坎城：《故土》最長？濱口最短？', '坎城得獎片討論的下半場，從《故土》聊到濱口龍介的《突如其來》。'],
      '8.2': ['聚焦坎城：蒙吉的第二金，含金量如何？', '從《峽灣》拿下金棕櫚說起，聊第79屆坎城評審團看中了什麼。'],
      '8.1': ['聚焦坎城：諾蘭為什麼沒進坎城', '八鴿帶著《奧德賽》的 IMAX 畫幅問題來作客，也聊到這一年在坎城空手而歸的電影。'],
      '7': ['震撼到「張口結舌」的2025新片', '從《無可奈何》到《局外人》和《罪人》，回看兩個人的2025片單。'],
      '6': ['《至尊馬蒂》到底「至尊」在哪兒？', '從球員的身體、剪接的節奏，聊到喬許・沙夫戴鏡頭裡的提摩西・夏勒梅。'],
      '4.3': ['聚焦坎城：你「高達」了沒？', '和鮑勃粥聊坎城沒得獎的片子，也借《新浪潮》問一句：到底誰在學誰？'],
      '5': ['《F1》：可能這就是今年最好的工業電影', '怎樣把賽車的速度拍給坐在戲院裡的人看？從《F1》聊車載攝影，也聊《決戰終點線》。'],
      '4.2': ['聚焦坎城：深度討論《風林火山》和《狂野時代》', '把麥浚龍和畢贛的兩部新片放在一起，看他們怎樣組織影像、說故事。'],
      '4.1': ['聚焦坎城：平庸的金棕櫚是一次「普通事故」', '從《普通事故》的巧合與結尾，聊到第78屆坎城的整張得獎名單。'],
      '3': ['貝尼特・米勒和失落的美國夢', '從《巡遊》到《暗黑冠軍路》，沿四部長片重看貝尼特・米勒筆下的美國。'],
      '2.2': ['聚焦柏林：全面回顧第75屆柏林影展', '新藝術總監上任後的第一屆柏林，和前任留下的五年，放在一起看。'],
      '2.1': ['聚焦柏林：評《生息之地》《想飛的女孩》兩部華語主競賽作品', '兩位主持人在柏林碰面，不爆雷地聊霍猛和文晏的兩部主競賽作品。'],
      '1': ['我們的2024新片總結', '第一次打開麥克風，從各自的年度五佳與五差聊起。'],
    },
  },
  en: {
    nav: {about: 'About us', podcast: 'Podcasts', articles: 'Articles', contact: 'Contact us'},
    ui: {
      navigation: 'Main navigation', language: 'Change language', home: 'Back to the television', skip: 'Skip to content',
      sections: 'Contents', hosts: 'Hosts', socialAccounts: 'Social profiles', openLink: 'Opens in a new window', articlesPending: 'Articles coming soon',
    },
    about: {
      title: 'About us', statement: ['Different perspectives.', 'Cinematic echoes.'],
      portraitAlt: 'A person wearing sunglasses looks to the right on a street.', handAlt: 'A hand with a ring holds a cigarette.',
      paragraphs: [
        'Even your own two eyes see things a little differently. Put two people in front of the same film and they might walk out with very different ideas of what they saw.',
        'Here, different perspectives meet and opinions can clash. We give that difference in perspective a voice.',
      ],
      hosts: [
        {name: 'Hongjiu', account: '(Douban @红酒与谋杀)', bio: 'A film worker who’s had enough of academia.'},
        {name: 'Kinyuan', account: '(Douban @Kinyuan)', bio: 'A PhD student in queer studies and film studies.'},
      ],
    },
    podcast: {title: 'Podcasts', intro: 'Film conversations from the screening rooms of Berlin and Cannes to our local cinemas.'},
    articles: {title: 'Articles', status: 'stay tuned'},
    contact: {
      title: 'Contact us', intro: 'Have an idea for an episode, a collaboration in mind, or a film you think we should see? Drop us a line.',
      channels: {redNote: 'RedNote', xiaoyuzhou: 'Xiaoyuzhou'},
    },
    categories: {festivals: 'Film festivals', focus: 'Focus', cinemas: 'In cinemas'},
    titles: {
      '8.3': ['Cannes: Fatherland the longest? Hamaguchi the shortest?', 'Our second look at the Cannes prizewinners takes us from Fatherland to Ryusuke Hamaguchi’s All of a Sudden.'],
      '8.2': ['Cannes: What is Mungiu’s second Palme worth?', 'Starting with Fjord, we look at what caught the jury’s eye at the 79th Cannes Film Festival.'],
      '8.1': ['Cannes: Why didn’t Nolan make the cut?', 'The Odyssey and the shape of an IMAX frame lead into a conversation about films that went home from Cannes empty-handed.'],
      '7': ['The films of 2025 that left us speechless', 'Our year in film, from No Other Choice to The Stranger and Sinners.'],
      '6': ['What’s so supreme about Marty Supreme?', 'How Josh Safdie films a player’s body, cuts a match and directs Timothée Chalamet.'],
      '4.3': ['Cannes: Had your Godard moment yet?', 'A return to the festival’s overlooked films. Richard Linklater’s Nouvelle Vague gets us talking about who’s borrowing from whom.'],
      '5': ['F1 might be the year’s best studio film', 'How do you make someone in a cinema seat feel the speed of a race car? We talk onboard cameras, F1 and Rush.'],
      '4.2': ['Cannes: Inside Sons of the Neon Night and Resurrection', 'Two films by Juno Mak and Bi Gan, and two very different ways to build a story out of images.'],
      '4.1': ['Cannes: A middling Palme for It Was Just an Accident', 'From the coincidences and final scene in Jafar Panahi’s film to the rest of the 78th festival’s prize list.'],
      '3': ['Bennett Miller and the lost American dream', 'Four features, from The Cruise to Foxcatcher, and the America that runs through them.'],
      '2.2': ['Berlin: Looking back at the 75th Berlinale', 'The new artistic director’s first Berlin, set alongside the five editions that came before it.'],
      '2.1': ['Berlin: Living the Land and Girls on Wire', 'Reunited in Berlin, the hosts compare Huo Meng’s and Vivian Qu’s competition entries, without spoilers.'],
      '1': ['Our year in film, 2024', 'For our first recording, we each brought five favourites and five disappointments.'],
    },
  },
};

export function getPublication(requestedLocale) {
  const locale = Object.hasOwn(copy, requestedLocale) ? requestedLocale : 'zh-CN';
  const {titles, categories, ...publication} = copy[locale];
  const episodes = recordings.map(([number, id, audioId, duration, date, categoryId, festival]) => {
    const [title, description] = titles[number];
    return {
      number, id, title, description, duration, date, categoryId, festival,
      category: categories[categoryId],
      minutes: Math.round(duration / 60),
      url: 'https://www.xiaoyuzhoufm.com/episode/' + id,
      audio: 'https://media.xyzcdn.net/' + stationId + '/' + audioId + '.m4a',
    };
  });
  return {locale, ...publication, episodes};
}
