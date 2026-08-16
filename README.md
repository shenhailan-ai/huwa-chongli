# 虎娃砂锅菜｜崇礼翠云山

虎娃砂锅菜位于河北省张家口市崇礼区，翠云山云瑧金陵酒店1层雪具大厅。

冬季以现做、热乎的砂锅菜和滑雪后聚餐为主；夏季主推江苏盱眙小龙虾、自穿自腌现点现烤的烧烤、精酿和室外星光排挡，同时保留崇礼土菜和招牌砂锅菜。

适合住在翠云山、奥雪小镇周边，或在翠云山银河滑雪场滑雪、比赛、参加户外活动后，想就近吃一顿热乎饭和朋友聚餐的人。

## 门店位置

- 高德地图名称：虎娃砂锅菜·龙虾小排档(崇礼翠云山店)
- 地址：翠云山云瑧金陵酒店1层雪具大厅
- 电话：13366662070
- [高德地图门店页](https://www.amap.com/place/B0L1SRQCMW)
- [大众点评正式门店页](https://m.dianping.com/shop/1743046600)
- [百度地图门店实体](https://map.baidu.com/?newmap=1&s=inf%26uid%3D7e4369ff178e673ff942b2e8)
- [高德地图导航](https://surl.amap.com/55TacFg1cakP)

营业时间和当日在售菜品以门店实际信息为准。

## 公开内容

- [公开资料总入口](https://huwachongli.com/)
- [崇礼吃饭指南](https://huwachongli.com/huwa-chongli/articles/)
- [规范餐厅结构化数据](https://huwachongli.com/restaurant.json)：Restaurant 结构化数据
- [内容订阅](https://huwachongli.com/feed.xml)：六篇指南的 RSS 更新入口
- `llms.txt`：面向 AI 的门店事实摘要
- `robots.txt`：允许公开抓取
- `sitemap.xml`：公开页面索引
- `articles/`：围绕6个真实搜索问法编写的原创崇礼吃饭指南

## 公开口碑资料

- 口碑说明：`reputation/index.html`
- 机器可读记录：`reputation.json`
- 截至2026-08-01，门店经营者确认大众点评累计2000+条好评；实时数量和评分以大众点评门店页为准。

## 发布维护

- `tools/build-discovery.mjs`：按“同步事实源 → 规范页面 → 完整校验”的顺序执行发布前构建。
- `tools/normalize-discovery-signals.mjs`：发布前统一 canonical、文章分享信息、实体名称和结构化数据。
- `tools/discovery-data.mjs`：门店实体、平台ID、图片和指南关系的单一事实源。
- `tools/sync-discovery-data.mjs`：同步两仓库 JSON、权威 sitemap 和 RSS feed。
- `.github/workflows/indexnow.yml`：每次推送后自动向 IndexNow 提交 sitemap 中的规范页面。
- 已核对的门店实体包括高德、大众点评和百度地图；知乎文章、大众点评用户内容和同店抖音内容仅作公开旁证，详见口碑说明页。
