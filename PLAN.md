# LifeGO — 产品与技术蓝图

> 本文档是 LifeGO 的单一真相源。所有产品决策、技术选型、假用户剧本、投资人演示脚本都在这里。
> 后续开发以本文档为准；如有修改，先改文档再写代码。

---

## 1. 产品一句话

**AI 副本养成器**——你去过的每一个地方、做过的每一件事，都成为你 Q 版副本的进化养料。AI 看见你，并替你看见你自己。

### 核心洞察
- 年轻人沉迷自我探索（MBTI / 星座 / 捏脸），但现有工具是**一次性消费**。
- 现有 LBS 产品（小红书、大众点评）让用户**生产内容给别人看**，心理负担重。
- LifeGO 让用户**轻打卡收集自己的证据**，AI 替你把证据翻译成"另一个你"。

### 与同类产品的区隔

| 维度 | 小红书 | 大众点评 | MBTI 测试 | **LifeGO** |
|---|---|---|---|---|
| 打卡负担 | 重（笔记） | 中（点评） | 无（一次性） | **轻（一键 / 可选加重）** |
| 产出物 | 给别人看的内容 | 给别人看的评价 | 测验结果 | **属于你自己的 Q 版形象** |
| 复访动力 | 算法推送 | 决策查询 | 几乎为零 | **形象养成进化** |
| AI 使用 | 推荐 feed | 推荐商家 | 无 | **人格画像 + 个性化建议** |

---

## 2. 核心循环

```
打卡 (POI + 可选标签/照片)
   ↓ 按重量折算属性点
属性累积 (6 主轴：探索/社交/运动/美食/文艺/工作学习) + 隐藏彩蛋特质
   ↓ 达到阈值
Q 版形象解锁新元素 (视觉可见的"进化")
   ↓
"今天做什么？" 询问 → Claude 基于当前画像 + LBS 给推荐
   ↓
用户去做 → 回来打卡 → 闭环
```

### 打卡权重设计

| 重量 | 交互 | 属性点 | 适用场景 |
|---|---|---|---|
| 轻 | 一键打卡（仅 POI） | × 1 | 路过、不想停留 |
| 中 | + 选择标签（吃饭/运动/工作/约会…） | × 3 | 大多数场景 |
| 重 | + 上传照片 / 写一句话 | × 5 | 有感而发、特别经历 |

**特殊地点加成**：罕见 POI（米其林餐厅、博物馆夜场、24h 独立书店等）+ 行为模式（深夜/早起/独行）触发**隐藏彩蛋特质**，详见 §7。

---

## 3. 目标群体 & 卖点

### 目标用户
- **核心**：18–28 岁、爱探索、爱分享身份标签的 Gen Z
- **首发市场**：海外（demo 阶段，绕开国内合规）
- **画像延展**：将来可向"社恐改变型"扩展（V2）

### 三大卖点
1. **AI 帮你看见你自己** — 行为数据反推人格，社交货币级别的截图欲
2. **Q 版副本养成** — 不是头像，是会随你成长的"另一个你"
3. **懂你的推荐** — 不是附近热门，是"以你这种人，今天适合做 X"

---

## 4. MVP 范围 (Demo)

### ✅ 包含
- 单用户演示账号（Mia in Tokyo）
- 地图选点 + 三档打卡
- 6 轴属性面板（雷达图）
- DiceBear Lorelei 形象 + 槽位实时切换
- "今天做什么"对话 → Claude 推荐 3 个 POI
- 类星座人格描述卡（Claude 生成）
- 时间轴：3 天打卡历史
- **投资人引导式演示模式**（按步骤高亮 UI）

### ❌ 砍掉
- 多用户系统、注册、登录
- 社交分享、好友、Feed
- 付费、订阅、皮肤商店
- 推送、IM、深夜陪聊
- 复杂隐私设置、合规弹窗（demo 阶段）
- 形象生成式 AI（用 DiceBear 替代）

---

## 5. 技术架构

### 技术栈

| 层 | 选型 | 备注 |
|---|---|---|
| 前端 | Next.js 14 (App Router) + TypeScript | 一栈到底 |
| UI | Tailwind CSS + shadcn/ui | 投资人级别外观 |
| 地图 | Mapbox GL JS | 免费额度大；POI 用 Mapbox Search Box API |
| 状态 | Zustand | 轻量、不上 Redux |
| 后端 | Next.js API Routes | 不单独起服务 |
| LLM | Google Gemini API（demo 期）+ 抽象层 | 2.5-pro 做人格画像，2.5-flash 做日常推荐；通过 `lib/llm.ts` 抽象，未来可切 Claude |
| 数据库 | SQLite + Prisma | demo 够用，Vercel 也支持 |
| 形象 | DiceBear `lorelei` 风格 | 通过 URL 参数控制槽位 |
| 部署 | Vercel | 一键预览链接，方便投资人远程看 |

### 目录结构

```
lifego/
├── app/
│   ├── page.tsx                  # 主界面（地图 + 形象 + 属性）
│   ├── demo/page.tsx             # 投资人引导式演示
│   ├── layout.tsx
│   ├── api/
│   │   ├── checkin/route.ts      # POST 打卡
│   │   ├── recommend/route.ts    # 推荐（Claude）
│   │   ├── persona/route.ts      # 生成人格描述
│   │   └── seed/route.ts         # 重置到 Mia 初始状态
│   └── globals.css
├── components/
│   ├── Map.tsx                   # Mapbox + POI 标记
│   ├── Avatar.tsx                # DiceBear SVG 渲染 + 动画过渡
│   ├── AttributeRadar.tsx        # 6 轴雷达图（recharts）
│   ├── CheckinModal.tsx          # 三档打卡弹窗
│   ├── RecommendDialog.tsx       # "今天做什么"
│   ├── Timeline.tsx              # 打卡历史
│   ├── PersonaCard.tsx           # 类星座描述卡
│   └── DemoGuide.tsx             # 投资人步骤引导浮层
├── lib/
│   ├── attributes.ts             # 属性计算
│   ├── avatar-mapping.ts         # 属性 → DiceBear 参数
│   ├── llm.ts                    # LLM 抽象层（当前: Gemini，未来可切 Claude）
│   ├── fake-user.ts              # Mia 数据
│   ├── tokyo-pois.ts             # POI 池
│   └── db.ts                     # Prisma client
├── data/
│   └── mia-trajectory.json       # 3 天剧本
├── prisma/
│   └── schema.prisma
└── .env.local                    # ANTHROPIC_API_KEY, MAPBOX_TOKEN
```

---

## 6. 数据模型

```prisma
model User {
  id              String   @id @default(cuid())
  name            String
  city            String   // 东京
  attributes      Json     // { 探索: 7, 社交: 10, 运动: 8, 美食: 6, 文艺: 11, 工作学习: 6 }
  unlockedSlots   Json     // { hair: "long30", glasses: "variant01", accessories: ["backpack","laptop"], ... }
  unlockedEggs    Json     // ["nocturnal", "lone-wolf"] —— 见 §7 隐藏彩蛋
  personaTitle    String?  // "探险家诗人 / The Wandering Aesthete"
  personaDesc     String?  // Claude 生成的长文
  createdAt       DateTime @default(now())
  checkins        Checkin[]
}

model Checkin {
  id             String   @id @default(cuid())
  userId         String
  user           User     @relation(fields: [userId], references: [id])
  poiName        String
  poiCategory    String   // restaurant, park, museum, bar, ...
  lat            Float
  lng            Float
  weight         Int      // 1 / 3 / 5
  tags           String   // JSON array
  photoUrl       String?
  note           String?
  attributeDelta String   // JSON: { 美食: 2, 探索: 1 }
  isSpecial      Boolean  @default(false)
  createdAt      DateTime
}
```

---

## 7. 属性系统

### 6 个属性轴

| 属性 | 中文 | 英文 | 触发场景 |
|---|---|---|---|
| 探索 | Explorer | exploration | 新地点、远距离、罕见 POI |
| 社交 | Social | social | 酒吧、咖啡馆、活动、群体场景 |
| 运动 | Athletic | athletic | 公园跑步、健身房、瑜伽 |
| 美食 | Foodie | foodie | 餐厅、市场、咖啡馆（美食类） |
| 文艺 | Aesthete | aesthete | 美术馆、书店、剧场、独立咖啡 |
| 工作/学习 | Productive | productive | 图书馆、co-working、24h 学习咖啡馆、大学校园 |

### 属性计算

```ts
function computeDelta(poi: POI, weight: 1|3|5): AttributeDelta {
  const base = POI_CATEGORY_MAPPING[poi.category]; // e.g. cafe → { 美食: 1, 文艺: 1 }
  let scaled = scaleBy(base, weight);
  if (poi.isRare) scaled = scaleBy(scaled, 1.5);
  return scaled;
}

// 彩蛋基于"行为模式"而非属性轴，独立判定
function checkEasterEggs(checkins: Checkin[]): EasterEgg[] {
  const eggs: EasterEgg[] = [];
  const nightCount  = checkins.filter(c => hour(c.createdAt) >= 22 || hour(c.createdAt) < 5).length;
  const earlyCount  = checkins.filter(c => hour(c.createdAt) < 7).length;
  const soloRatio   = checkins.filter(c => !c.tags.includes('with-friends')).length / checkins.length;

  if (nightCount >= 3)                            eggs.push('nocturnal');
  if (earlyCount >= 3)                            eggs.push('early-bird');
  if (checkins.length >= 5 && soloRatio >= 0.8)   eggs.push('lone-wolf');
  return eggs;
}
```

### 解锁阈值

| 阈值 | 含义 |
|---|---|
| 5 | 解锁基础配件（眼镜、头带、背包等） |
| 7 | 解锁专属外观元素 |
| 10 | 解锁稀有元素（背景、特效） |
| 15 | 解锁"专家"称号 |

### 🎭 隐藏彩蛋特质

主轴是阳光面，彩蛋是隐藏面。默认在属性面板**不可见**，达成时触发"You discovered a hidden trait"弹窗，形象上叠加细微元素，人格卡片末尾多一行 `Hidden: ...`。

| 彩蛋 | 触发条件 | 视觉揭示 | 人格附加 |
|---|---|---|---|
| 🌙 夜行 | 累计 3 次 22:00 后打卡 | 眼下星砂叠加 | "午夜才完整的灵魂" |
| 🌅 早鸟 | 累计 3 次 7:00 前打卡 | 耳后小太阳贴纸 | "晨光收集者" |
| 🐺 独行侠 | 总打卡 ≥5 且 80%+ 无社交标签 | 肩头小狼贴纸 | "独处是你的充电方式" |

**Demo 设计**：Mia 的剧本设计成只触发 🌙 夜行 + 🐺 独行侠，🌅 早鸟保持锁定——投资人看到"还有未发现的特质"，传达"这是个系统不是个功能"。

---

## 8. 形象系统 (DiceBear Lorelei)

### URL 构造范例
```
https://api.dicebear.com/9.x/lorelei/svg
  ?seed=mia
  &hair=variant30
  &glasses=variant01
  &glassesProbability=100
  &earrings=variant05
  &earringsProbability=100
  &backgroundColor=ffd5dc
```

### 属性 → DiceBear 参数映射表

| 属性 | 阈值 5 | 阈值 7 | 阈值 10 |
|---|---|---|---|
| 探索 | 自定义叠加：背包 SVG | 自定义叠加：探险帽 | backgroundColor=mapBlue |
| 社交 | mouth=variant26 (笑) | earrings=variant05 | 自定义叠加：花环 |
| 运动 | 自定义叠加：头带 | hair=variant10 (短发) | 自定义叠加：运动鞋 |
| 美食 | features=blush | 自定义叠加：腮红+小蛋糕 | 自定义叠加：厨师帽 |
| 文艺 | glasses=variant01 | hair=variant30 (长发) | backgroundColor=warmCream |
| 工作/学习 | 手持道具：笔记本电脑/平板 | hair=variant05 (束发/马尾) + 咖啡杯道具 | 学院针织衫叠加 |

**彩蛋叠加层**（独立于属性槽位）：
- 🌙 夜行 → 眼下星砂小贴纸（半透明 PNG）
- 🌅 早鸟 → 耳后小太阳贴纸
- 🐺 独行侠 → 肩头小狼贴纸

### 实现要点
- DiceBear 原生参数能搞定 60% 的视觉差异
- **剩余 40% 通过 SVG 叠加层**（背包、帽子、特效）解决——在 `<svg>` 容器里把 DiceBear SVG 和自定义 PNG/SVG 叠加
- 自定义叠加素材首批准备 8–10 个，覆盖关键阈值

---

## 9. 假用户：Mia in Tokyo

### Persona
- **姓名**：Mia Tanaka
- **年龄**：24
- **背景**：刚从大阪搬到东京 5 天的设计师，在 Shibuya 一家 startup 上班
- **性格关键词**：好奇、爱独自探索、白天上班晚上文艺
- **演示目的**：3 天的打卡轨迹要让形象**肉眼可见地进化**

### 初始状态（Day 0）
- 所有属性 = 0
- 形象：默认 Lorelei seed=mia，无配件
- 人格描述：空（解锁条件：任一属性 ≥ 5）

### Day 1 — Sunday (探索日)

| 时间 | POI | 类别 | 重量 | Δ |
|---|---|---|---|---|
| 09:30 | Blue Bottle Coffee Aoyama | cafe | 3 | 美食+1, 文艺+1 |
| 11:00 | Yoyogi Park（散步） | park | 1 | 运动+1, 探索+1 |
| 14:00 | teamLab Borderless ⭐ | art | 5 | 文艺+4, 探索+3 |
| 19:30 | Ichiran Ramen Shibuya | restaurant | 3 | 美食+2, 社交+1 |
| 22:30 | Omoide Yokocho 居酒屋 🌙 | bar | 3 | 社交+2（夜行打卡#1） |

**Day 1 累计**：探索 4, 美食 3, 文艺 5, 运动 1, 社交 3
**形象解锁**：文艺=5 → **圆框眼镜**
**人格首次解锁**：Claude 生成 "初探者 · The Curious Newcomer"
**彩蛋进度**：🌙 1/3，🐺 累积中

### Day 2 — Monday (习惯日)

| 时间 | POI | 类别 | 重量 | Δ |
|---|---|---|---|---|
| 07:00 | Imperial Palace 跑步道 ⭐ | running | 3 | 运动+5（稀有加成） |
| 12:30 | WeWork Shibuya | coworking | 3 | 工作学习+3, 社交+1 |
| 16:00 | Tsutaya Books Daikanyama | bookstore | 3 | 文艺+2 |
| 22:30 | Golden Gai (Bar Albatross) 🌙 | bar | 5 | 社交+3（夜行打卡#2） |

**Day 2 累计**：探索 4, 美食 3, 文艺 7, 运动 6, 社交 7, 工作学习 3
**形象解锁**：文艺=7 → **长发**；工作学习=5 → **手持笔记本电脑**
**人格更新**：Claude 改写为 "都市游吟者 · The Urban Bard"
**彩蛋进度**：🌙 2/3

### Day 3 — Tuesday (沉浸日)

| 时间 | POI | 类别 | 重量 | Δ |
|---|---|---|---|---|
| 08:00 | Yoga Plus Omotesando | gym | 3 | 运动+2 |
| 12:00 | Tsukiji Outer Market 寿司 📷 | restaurant | 5 | 美食+3, 探索+2 |
| 15:30 | 国立国会图书馆 | library | 3 | 工作学习+3, 文艺+1 |
| 17:00 | Nakameguro 运河散步 | walk | 1 | 探索+1, 文艺+1 |
| 22:30 | Shimokitazawa Shelter 现场 ⭐ 🌙 | livehouse | 5 | 社交+3, 文艺+2（夜行打卡#3） |

**Day 3 累计**：探索 7, 美食 6, 文艺 11, 运动 8, 社交 10, 工作学习 6
**形象解锁**：探索=7（背包） + 运动=7（运动鞋） + 文艺=10（暖色背景） + 工作学习=5（笔记本道具）

**🎭 彩蛋揭示瞬间**（demo 高潮）：
- 🌙 **夜行解锁**（3/3 次夜场）→ 眼下星砂叠加层动画浮现
- 🐺 **独行侠解锁**（14 次打卡全部独行 = 100%）→ 肩头小狼贴纸
- 🌅 早鸟保持锁定（1/3）→ 灰色未知卡，埋下"还有未发现的你"

**人格终态**：Claude 生成长文 "**探险家诗人 · The Wandering Aesthete**"
> "你在城市的褶皱里寻找诗意。你属于'宁愿走 20 分钟去一家独立咖啡馆，也不愿在连锁店凑合'的那种人。
> 文艺 ★★★★★ / 探索 ★★★★ / 社交 ★★★★ / 运动 ★★★ / 美食 ★★★ / 工作学习 ★★
> **Hidden:** 🌙 夜行 · 🐺 独行侠
> 你的副本特质：低声细语的好奇心、对独处的甜蜜依恋、夜晚才完整的灵魂。"

### Day 3 推荐示例（Claude 生成）

询问"今天做什么"，基于 Mia 当前画像，推荐：
1. **Shimokitazawa 古着街 + 午后咖啡** — "继续你的诗意发现"
2. **与昨晚 Golden Gai 偶遇的人约下午茶** — "把陌生人变成故事"
3. **Mt. Takao 夜间徒步** — "升级你的夜行 + 探索属性"

---

## 10. 投资人 Demo 脚本 (3 分钟)

### 0:00 — 0:20 / 开场
- 屏幕：Mia 的形象（已带眼镜+长发）+ 人格卡片
- 旁白：「这是 Mia，24 岁，刚搬到东京。她过去 3 天的每次打卡，都让这个 Q 版的她长成了现在这样。」

### 0:20 — 1:00 / 倒带演示进化（含彩蛋揭示）
- 点 "Replay Day 1" → 形象瞬间回到初始（无配件）
- 快进 3 天打卡 → 配件**逐个浮现**（圆框眼镜→长发→笔记本电脑→背包→运动鞋→暖色背景）
- **Day 3 末尾**：屏幕中央弹出 `🌙 Hidden Trait Discovered: Nocturnal` + 眼下星砂动画，紧接 `🐺 Lone Wolf` + 肩头小狼贴纸
- 旁白：「行为变形象。她什么都没主动设置——一切来自她去过的地方。**而且系统在替她发现连她自己都没意识到的特质。**」

### 1:00 — 1:30 / 现场打卡演示
- 主持人："如果我现在让她去做点新事呢？" → 点地图上一个 POI（例如 Ueno 公园）→ 中重打卡
- 属性面板：探索+1, 运动+1（数字飞入动画）
- 旁白：「这不是头像编辑器。这是身份的延伸。」

### 1:30 — 2:20 / 推荐能力演示
- 点 "今天做什么" → 显示 3 条推荐 + 每条的"为什么是你"
- 主持人念第三条："因为你最近文艺+夜行属性都高了——这家在 Shimokitazawa 的深夜独立书店刚好契合"
- 旁白：「推荐准是因为我们真的'懂'她，不是因为她和别人相似。」

### 2:20 — 3:00 / 收尾 & 市场定位
- 显示 slide（不在 app 内）：
  - 赛道交集：Pokemon Go（LBS游戏化）× Replika（AI伴侣）× MBTI（身份消费）
  - 市场尺寸：全球 Gen Z 自我探索市场（引用数据待补）
  - 留存假设：形象养成的 D7/D30 显著高于 LBS 工具类
- 关单一句话：「我们让一代人**重新爱上记录生活**——因为这一次，记录是为了自己。」

### 后备方案
- 在 `/demo` 页面内嵌一段 90 秒的同样剧本的预录视频
- 任何环节卡顿 → 主持人切到视频继续

---

## 11. 开发路线图

### Sprint 0 (1 天) — 项目骨架
- [ ] `npx create-next-app` + 装依赖
- [ ] Tailwind + shadcn/ui 初始化
- [ ] Prisma + SQLite schema
- [ ] `.env.local` 占位
- [ ] 部署 Vercel preview，跑通空页面

### Sprint 1 (2–3 天) — 核心可视化
- [ ] DiceBear `<Avatar>` 组件（接收属性状态，输出 SVG）
- [ ] 自定义叠加层素材（背包/运动鞋/帽子等 8–10 个 SVG）
- [ ] `<AttributeRadar>` 雷达图
- [ ] Mapbox `<Map>` 组件 + Tokyo POI 标记
- [ ] 假用户 seed：Mia + 3 天剧本数据

### Sprint 2 (2 天) — 打卡循环
- [ ] `<CheckinModal>` 三档交互
- [ ] `api/checkin` 路由：写入 + 属性计算 + 解锁判定
- [ ] 时间轴组件
- [ ] 解锁动画（配件浮现 + 数字飞入）

### Sprint 3 (1–2 天) — LLM 集成（Gemini）
- [ ] `lib/llm.ts` 抽象层封装（provider-agnostic 接口，当前实现 Gemini）
- [ ] `api/persona`：根据属性 + 打卡历史生成人格描述（gemini-2.5-pro，含 Hidden 标签）
- [ ] `api/recommend`：根据当前画像 + 时间 + 位置生成 3 条推荐（gemini-2.5-flash）
- [ ] Prompt 工程：用 Gemini `responseSchema` 保证 JSON 输出稳定
- [ ] 调低 safety filter 阈值（人格描述偶尔触发误伤）
- [ ] 留好切换路径：未来拿到 Claude API key 仅需替换 `lib/llm.ts`

### Sprint 4 (1 天) — 投资人模式
- [ ] `/demo` 引导式页面（步骤高亮 + 倒带功能）
- [ ] `api/seed` 重置接口（一键回到初始 / 跳到 Day N）
- [ ] 录制 90 秒后备视频

### Sprint 5 (0.5 天) — 打磨
- [ ] 过渡动画、加载态、错误兜底
- [ ] Vercel 正式预览链接 + 自定义域名

**总预估**：8–10 个工作日

---

## 11.5 平台转向 Mobile（2026-05-22 决策）

Web 版（Sprint 0-2）作为**参考实现 + 业务逻辑孵化器**保留在 `D:\LifeGO\`。
**真正交付的产品**：Expo / React Native，在 `D:\LifeGO\mobile\` 子目录开发。

### 关键决策
- **目标平台**：iOS + Android（双端）
- **运行容器**：Expo Go（开发期，无需 Mac）+ EAS Build（发布期）
- **调试设备**：用户自己的 iPhone（扫码连接 Expo Go）
- **截图来源**：真 iPhone 录屏 / TestFlight，**不需要买 Mac**

### Mobile 技术栈（实际版本）

| 层 | 选型 | 备注 |
|---|---|---|
| 框架 | **Expo SDK 54** (`expo@~54.0.34`) | App Store 上 Expo Go 只支持到 SDK 54，从 56 降下来 |
| RN | React Native 0.81.5 | SDK 54 锁定 |
| 路由 | expo-router 6.x file-based + `NativeTabs` | iOS 原生 tab bar；SF Symbols 图标 |
| 样式 | **StyleSheet + 模板 theme**（跳过 NativeWind） | 默认 theme 已含 Colors/Spacing/BottomTabInset，更原生 |
| 地图 | `@rnmapbox/maps`（条件 `require()`） | 静态 import 会 crash Expo Go，详见 §M0 caveats |
| 图表 | **react-native-svg 手画**（跳过 victory-native） | 避免 Skia/Reanimated 重依赖 |
| Avatar | `react-native-svg` 的 `<SvgXml/>` + DiceBear `createAvatar()` 本地生成 | 摆脱 dicebear.com 网络依赖 |
| 状态 | Zustand v5 | 原封不动从 web 复用 |
| LLM | `@google/generative-ai` (Gemini 2.5-flash) | persona + 推荐都用 flash，30× 比 pro 便宜 |
| Bottom Sheet | `@gorhom/bottom-sheet` v5 | CheckinSheet + RecommendDialog |
| 国际化 | 自建 `lib/i18n.ts`（50+ 字串）+ `useT()` hook | zh / en 切换，LLM prompts 同步切换 |
| Haptic | `expo-haptics` | 打卡 / 解锁 / 切语言 |

### Mobile UX 结构

**3 个 Tab（底部 navigation）**：
- 🏠 **Home**：动态问候语 + Avatar 英雄区 + 隐藏特质徽章 + 人格描述 + "今天做什么" CTA + 最近打卡概览
- 🗺 **Map**：全屏地图 + 点 POI 弹底部 sheet → 打卡按钮
- 📊 **Profile**：缩小 Avatar + 雷达图 + 6 轴数值列表 + 隐藏特质详情 + 完整历史

**核心交互**：
- 打卡 modal 用 **Bottom Sheet**（50-70% 屏高，下滑关闭）
- 解锁动画继承 Web 版的 overlayPop（用 RN Animated 或 reanimated 重做）
- Haptic 反馈（打卡成功、解锁触发）

### 代码复用情况

100% 复用：`lib/attributes.ts` · `lib/easter-eggs.ts` · `lib/tokyo-pois.ts` · `lib/store.ts`（迭代加 locale/replay/persona 状态）· `data/mia-trajectory.json` · `public/overlays/*.svg`（已内联到 mobile `lib/overlay-svgs.ts`）

95% 复用（小改）：`lib/llm.ts`（env var 改 `EXPO_PUBLIC_`）· `lib/avatar-mapping.ts`（URL 改 `createAvatar()` 本地生成）

0% 复用（UI 层重写）：`app/page.tsx` · `components/*.tsx`

### Sprint M0 — 项目骨架（2026-05-22）
- `npx create-expo-app mobile --template default` → SDK 56 出来；后续因 Expo Go SDK 54 兼容性两次降级（56→55→54）
- 3-tab `NativeTabs` (`expo-router/unstable-native-tabs`)：Home / Map / Profile，SF Symbols 图标
- lib/* 全部迁到 `mobile/src/lib/`；overlay SVG 内联为字符串常量
- DiceBear 切到 `createAvatar()` 本地生成（摆脱国内访问 dicebear.com 偶发慢/失败）
- 移植 14 次 Mia seed 数据，TS 0 error

### Sprint M1 — 核心可视化
- `<Avatar/>`：`<View>` + `<SvgXml/>`（DiceBear base）+ 绝对定位 overlay 叠层
- `<AttributeRadar/>`：纯 `react-native-svg` 原语手画 6 轴雷达（4 圈背景 + 6 轴线 + 紫色填充多边形 + 顶点圆 + 中文标签）。跳过 victory-native 省了 Skia 大依赖
- `<Map/>`：`@rnmapbox/maps` 全屏地图 + 14 POI marker（rare 加金色 pulse 光环）
- 三个 screen 全部接真组件

### Sprint M2 — 打卡循环 + 黑箱 + 时间衰减
两个产品哲学改动：
1. **黑箱**：CheckinSheet 不显示 "将获得 +X +Y"；Timeline 不显示 delta 数字。打完只通过 UnlockToast 揭示解锁，保留"AI 看见你"的惊喜
2. **30 天半衰期衰减**：`decayWeight(t, now) = 0.5^(days/30)`。`attributes` = 衰减后显示值，`attributesPeak` = 累计未衰减（驱动解锁判定 → 解锁永久保留）

实现：
- `<CheckinSheet/>` (`@gorhom/bottom-sheet`)：三档重量 + 标签 + 想法 + haptic，**无 delta 预览**
- `<Timeline/>`：FlatList 时间倒序，POI/时间/重量 emoji/标签/想法
- `<UnlockToast/>`：顶部 Animated 弹入 + 4s 自动消失 + haptic
- `_layout.tsx` 包 `GestureHandlerRootView` + `BottomSheetModalProvider`

### Sprint M3 — Gemini LLM 集成
- `lib/persona.ts`：`generatePersona()` 用 gemini-2.5-flash + JSON schema + 中文 system prompt（"避免陈词滥调"、"具体到画面"、"原创人格名"）。无 key 时返回 mock
- `lib/recommend.ts`：`generateRecommendations()` 同 flash，输入 persona + attrs + 时段 + 最近 POI，输出 3 条 `{place, area, category, why}`
- `<PersonaCard/>`：自动 fetch + loading + 长按 0.5s 强刷
- `<RecommendDialog/>`：bottom sheet 80%，3 卡片 + "再来 3 条"
- Home 加紫色 "今天做什么 →" CTA
- **关键优化**：persona 从 pro 改 flash（成本 30× 便宜，免费额度 50→1500 RPD，输出质量一致），加根布局预热 (fetchPersona in `_layout.tsx` useEffect)
- **smoke test**：`mobile/scripts/test-persona.mjs` 独立 Node ESM 脚本验证 prompt 质量（首次跑就出 "都市浮光收集者 / The Urban Glimmer Collector"）

### Sprint M4 — Demo Replay + EAS Build 配置

**核心交付：Replay 功能**
- Store 新增 `playReplay()` action + `isReplaying` 标志 + `replayProgress` 进度
- 流程：清空 → 800ms 停顿 → 14 次 checkin 按时间顺序加（每条 550ms，跨天加 1200ms）→ 末尾一次性 fire UnlockToast 显示全部解锁内容
- 总时长 ~11 秒，跨越 PLAN §10 投资人脚本的 0:20–1:00 倒带段
- Home 在 `isReplaying` 时把 greeting 换成 "📽️ Day N / 3 · X / 14" 进度条
- 触发入口：Profile → 开发工具 → "📽️ 投资人演示" 链接

**App 品牌信息**：`app.json` 改成 `LifeGO` / `lifego` / `com.lifego.app`（iOS + Android 同包名），splash 暖米黄 `#fef3c7`，iOS Info.plist 加 `NSLocationWhenInUseUsageDescription`

**EAS Build 配置**：新增 `mobile/eas.json` 三个 profile
- `development`：dev client，真机分发（用户 iPhone 装这个就能跑 @rnmapbox/maps）
- `preview`：内部分发 + iOS simulator
- `production`：自动版本号递增

### EAS Build 用户操作步骤

```bash
cd D:\LifeGO\mobile
npx eas login          # 用 Expo 账号登录（免费注册 expo.dev）
npx eas build:configure # 首次配置 project id（自动写回 app.json）
npx eas build --profile development --platform ios
```

第三步等待 ~20-30 分钟云端打包。打包完邮件/网页都会给一个 QR 码。

iPhone 操作：
1. Safari 打开邮件里的 QR 链接 / Expo dashboard
2. 点 "Install build" → iOS 提示安装描述文件
3. 设置 → 通用 → VPN 与设备管理 → 信任开发者证书
4. 桌面上会出现 LifeGO 图标 → 打开即是 dev client

之后 `npx expo start --dev-client` + iPhone Expo 内打开扫码即可热重载，**和 Expo Go 一样的开发流程，但带原生模块**。

### App Store 截图计划

iPhone 16 Pro 6.9" 截图（1320×2868），3-5 张：
1. **Home + 完整状态**：Mia 形象 + 🌙🐺 彩蛋徽章 + "✨ 探险家诗人" PersonaCard + "今天做什么 →"按钮
2. **Map**：东京全屏地图 + 14 个彩色 POI marker + 选中 Blue Bottle 弹出 popup
3. **打卡 sheet**：在 Map 上点中 teamLab → bottom sheet 滑入 →"✨ 重" 选中 + 标签 + 想法
4. **Profile + 雷达图**：6 轴雷达 + 隐藏特质详情 + Timeline
5. **Replay 演示**：Home 上 "📽️ Day 2 / 3" 进度条 + Avatar 半进化状态

直接用真 iPhone 录屏截图（设置 → 通用 → 关于本机改设备名为 "iPhone 16 Pro" 等以符合 Apple 命名要求）。

### Sprint M5 — 国际化（zh / en）

- `lib/i18n.ts` 新建：50+ zh/en 字串对 + `useT()` hook + `translate()` 纯函数 + `{key}` 模板插值
- Store 加 `locale` state + `setLocale()`（切换时清 persona+recommendations 缓存）
- `lib/persona.ts` + `lib/recommend.ts` 接 locale 参数：双语 system prompt + 双语 mock fallback
- 全部 9 个组件 + 3 个 screen 用 `useT()` 重构
- Profile 加紫色"🌐 中文 / English"切换卡
- PersonaCard 的 useEffect 加 locale 依赖，切换语言自动 refetch

切换后 Tab labels、问候语、Persona、推荐、所有 UI 字串瞬间双语切换。

### SDK 兼容性故事（踩坑）

| 阶段 | SDK | 结果 |
|---|---|---|
| `create-expo-app@latest` 默认 | 56 | App Store Expo Go 不兼容："Project is incompatible" |
| 第一次降级 | 55 | 仍报版本不够新 |
| 第二次降级 | **54** | ✓ 可在 App Store Expo Go 跑 |

降级要 `expo install --fix` 把所有 peer 同步；遇到 react peer 冲突用 `npm install --legacy-peer-deps`；漏装 `react-native-worklets` 要手动补。

### 已知 caveats

- **`@rnmapbox/maps` 不能 static import in Expo Go**：会触发 native module check → crash。必须用条件 `require()` + `import type` 拿类型。`Map.tsx` 已经处理
- **iPhone safe area**：3 个 screen 的 ScrollView paddingBottom 用 `BottomTabInset + useSafeAreaInsets().bottom + Spacing.four`（之前只 50pt 不够 iPhone home indicator 的 34pt）
- **iOS dev client 要 $99 Apple Developer Program**：免费 Apple ID 在 Apple Developer Portal 注册后没有 device:create 权限。EAS Build iOS dev profile 暂时跑不通。Expo Go 走 SDK 54 路径作为替代
- **Gemini 延迟 ~10-14s** 是 server 端 first-token 决定，client 无法优化。PersonaCard 的"✨ 正在解读你……" loading state 是产品化体验

---

## 12. 未来 (V2+，本期不做)

- 多用户系统 + 社交（好友互看形象、合体活动）
- 形象的生成式 AI（用户特征训练 LoRA，独一无二）
- "社恐改变型"分支：逐步任务系统
- 周报/月报：自动生成"本周的你"
- 品牌赞助 POI（投放点解锁特殊属性）
- 订阅制：高级人格分析 / 形象皮肤

---

## 附录 A：环境变量

```bash
# .env.local
GEMINI_API_KEY=AIza...                       # https://aistudio.google.com/apikey 免费申请
MAPBOX_ACCESS_TOKEN=pk....
DATABASE_URL=file:./dev.db
NEXT_PUBLIC_DICEBEAR_BASE=https://api.dicebear.com/9.x

# 未来切回 Claude 时启用：
# ANTHROPIC_API_KEY=sk-ant-...
```

## 附录 B：关键链接

- DiceBear Lorelei 文档：https://www.dicebear.com/styles/lorelei/
- Mapbox Search Box API：https://docs.mapbox.com/api/search/search-box/
- Google Gemini API 文档：https://ai.google.dev/gemini-api/docs
- Gemini Node SDK：https://github.com/google/generative-ai-js
- Gemini 结构化输出：https://ai.google.dev/gemini-api/docs/structured-output
- Anthropic SDK（备用，未来切换用）：https://github.com/anthropics/anthropic-sdk-typescript
- shadcn/ui：https://ui.shadcn.com/

---

*Last updated: 2026-05-22 — 初版蓝图，决策已锁定，进入 Sprint 0。*
