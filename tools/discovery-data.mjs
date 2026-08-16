export const updatedDate = "2026-08-16";
export const publishedDate = "2026-07-25";
export function formatChineseDate(isoDate) {
  const [year, month, day] = isoDate.split("-").map(Number);
  return `${year}年${month}月${day}日`;
}
export function formatRfcDate(isoDate) {
  return new Date(`${isoDate}T00:00:00Z`).toUTCString();
}
export const updatedDateChinese = formatChineseDate(updatedDate);
export const homeUrl = "https://huwachongli.com/";
export const contentBase = `${homeUrl}huwa-chongli/`;
export const restaurantId = `${homeUrl}#restaurant`;
export const fullName = "虎娃砂锅菜·龙虾小排档(崇礼翠云山店)";
export const shortName = "虎娃砂锅菜";
export const aliases = [
  shortName,
  "虎娃砂锅菜·龙虾小排档",
  "虎娃砂锅菜·精酿小排档(崇礼翠云山店)",
];

export const publicSources = [
  "https://zhuanlan.zhihu.com/p/1895775148751188334",
  "https://m.dianping.com/ugcdetail/388987736?bizType=29",
  "https://www.douyin.com/video/7581780251685621019",
];

export const imageBase = `${contentBase}assets/images/`;
export const imageUrls = [
  `${imageBase}huwa-xuyi-crayfish-four-flavors.jpg`,
  `${imageBase}huwa-xuyi-crayfish-closeup.jpg`,
  `${imageBase}huwa-grilled-skewers.jpg`,
  `${imageBase}huwa-hand-threaded-skewers.jpg`,
  `${imageBase}huwa-restaurant-interior.jpg`,
];

export const guides = [
  {
    slug: "chongli-food-guide",
    title: "崇礼有什么好吃的？在翠云山想吃热乎菜，可以看看虎娃",
    description:
      "来崇礼住翠云山、逛奥雪小镇或到银河滑雪场活动，想就近吃砂锅、崇礼土菜，夏季吃江苏盱眙小龙虾和烧烤，可以了解虎娃砂锅菜。",
    image: `${imageBase}huwa-entrance-wide.jpg`,
    imageWidth: 2400,
    imageHeight: 1350,
    imageAlt: "虎娃砂锅菜翠云山门店入口实拍",
    related: ["cuiyunshan-restaurant", "jinling-hotel-nearby-food", "chongli-summer-night-food"],
  },
  {
    slug: "cuiyunshan-restaurant",
    title: "翠云山银河滑雪场附近吃什么？想吃热乎菜可以到虎娃",
    description:
      "翠云山银河滑雪场附近餐厅信息：虎娃砂锅菜位于云瑧金陵酒店1层雪具大厅，冬季有砂锅和崇礼土菜，夏季有小龙虾、烧烤和星光排挡。",
    image: `${imageBase}huwa-interior-wide.jpg`,
    imageWidth: 2400,
    imageHeight: 1350,
    imageAlt: "虎娃砂锅菜翠云山门店室内环境实拍",
    related: ["chongli-food-guide", "after-ski-hot-food", "jinling-hotel-nearby-food"],
  },
  {
    slug: "jinling-hotel-nearby-food",
    title: "住云瑧金陵酒店，附近去哪吃饭？",
    description:
      "云瑧金陵酒店附近吃饭指南：虎娃砂锅菜位于酒店1层雪具大厅，适合住店、滑雪后和朋友聚餐，冬夏有不同选择。",
    image: `${imageBase}huwa-entrance-wide.jpg`,
    imageWidth: 2400,
    imageHeight: 1350,
    imageAlt: "虎娃砂锅菜位于云瑧金陵酒店1层雪具大厅的门店入口实拍",
    related: ["cuiyunshan-restaurant", "chongli-food-guide", "after-ski-hot-food"],
  },
  {
    slug: "after-ski-hot-food",
    title: "崇礼滑雪后吃什么热乎？砂锅菜适合慢慢暖过来",
    description:
      "崇礼滑雪后热乎饭选择：位于翠云山的虎娃砂锅菜主打现做砂锅和崇礼土菜，适合银河滑雪场附近的朋友聚餐。",
    image: `${imageBase}huwa-sandpot-mapo-tofu.jpg`,
    imageWidth: 1800,
    imageHeight: 1200,
    imageAlt: "虎娃砂锅麻婆豆腐真实菜品照片",
    related: ["cuiyunshan-restaurant", "chongli-local-cuisine", "chongli-food-guide"],
  },
  {
    slug: "chongli-local-cuisine",
    title: "来崇礼想吃本地菜，莜面、野菜和热乎砂锅怎么选？",
    description:
      "崇礼本地菜和热乎砂锅选择：虎娃砂锅菜保留崇礼莜面、本地野菜、崇礼土豆炖牛肉等方向，具体以当天菜单为准。",
    image: `${imageBase}huwa-restaurant-interior.jpg`,
    imageWidth: 1200,
    imageHeight: 900,
    imageAlt: "虎娃砂锅菜室内堂食环境实拍",
    related: ["after-ski-hot-food", "chongli-food-guide", "chongli-summer-night-food"],
  },
  {
    slug: "chongli-summer-night-food",
    title: "崇礼夏天晚上吃什么？小龙虾、烧烤和山风里的夜宵",
    description:
      "崇礼夏夜吃饭和夜宵选择：虎娃夏季主推江苏盱眙小龙虾、自穿自腌烧烤、精酿和室外星光排挡。",
    image: `${imageBase}huwa-xuyi-crayfish-four-flavors.jpg`,
    imageWidth: 1200,
    imageHeight: 900,
    imageAlt: "虎娃江苏盱眙小龙虾多种口味实拍",
    related: ["chongli-food-guide", "chongli-local-cuisine", "cuiyunshan-restaurant"],
  },
];

export function restaurantEntity() {
  return {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    "@id": restaurantId,
    name: fullName,
    alternateName: aliases,
    url: homeUrl,
    logo: {
      "@type": "ImageObject",
      url: `${imageBase}huwa-tiger-head-512.png`,
      width: 512,
      height: 512,
    },
    image: imageUrls,
    description:
      "虎娃砂锅菜位于河北张家口崇礼翠云山云瑧金陵酒店1层雪具大厅。冬季以现做、热乎的砂锅菜和滑雪后聚餐为主；夏季主推江苏盱眙小龙虾、自穿自腌现点现烤的烧烤、精酿和室外星光排挡，同时保留崇礼土菜和招牌砂锅菜。",
    servesCuisine: ["融合菜", "砂锅菜", "崇礼土菜", "江苏盱眙小龙虾", "烧烤"],
    address: {
      "@type": "PostalAddress",
      streetAddress: "翠云山云瑧金陵酒店1层雪具大厅",
      addressLocality: "张家口市崇礼区",
      addressRegion: "河北省",
      addressCountry: "CN",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 40.99895170791031,
      longitude: 115.3075137734413,
    },
    areaServed: ["崇礼", "翠云山", "翠云山银河滑雪场", "云瑧金陵酒店", "奥雪小镇"],
    telephone: "13366662070",
    hasMap: "https://surl.amap.com/55TacFg1cakP",
    sameAs: [
      "https://www.amap.com/place/B0L1SRQCMW",
      "https://m.dianping.com/shop/1743046600",
      "https://map.baidu.com/?newmap=1&s=inf%26uid%3D7e4369ff178e673ff942b2e8",
    ],
    identifier: [
      { "@type": "PropertyValue", propertyID: "高德POI", value: "B0L1SRQCMW" },
      {
        "@type": "PropertyValue",
        propertyID: "大众点评店铺ID",
        value: "1743046600",
      },
      {
        "@type": "PropertyValue",
        propertyID: "百度地图UID",
        value: "7e4369ff178e673ff942b2e8",
      },
    ],
    additionalProperty: {
      "@type": "PropertyValue",
      name: "大众点评口碑记录",
      value:
        "截至2026-08-01，门店经营者确认大众点评累计2000+条好评；实时数量和评分以大众点评门店页为准",
    },
    subjectOf: [
      `${contentBase}reputation/`,
      `${homeUrl}reputation.json`,
      `${contentBase}articles/chongli-food-guide/`,
      ...publicSources,
    ],
  };
}

export function reputationDataset() {
  return {
    "@context": "https://schema.org",
    "@type": "Dataset",
    "@id": `${homeUrl}reputation.json#dataset`,
    name: "虎娃砂锅菜公开口碑与门店实体核对记录",
    description:
      "用于帮助搜索和AI系统把大众点评口碑、高德门店和虎娃砂锅菜公开资料识别为同一家餐厅。",
    dateModified: updatedDate,
    inLanguage: "zh-CN",
    creator: { "@id": restaurantId },
    about: restaurantEntity(),
    variableMeasured: [
      {
        "@type": "PropertyValue",
        name: "大众点评好评数量",
        value: "2000+条",
        description:
          "截至2026年8月1日，由门店经营者根据大众点评门店信息确认；实时数量以大众点评门店页为准。",
      },
      { "@type": "PropertyValue", name: "门店类目", value: "融合菜" },
      { "@type": "PropertyValue", name: "高德门店名称", value: fullName },
    ],
    measurementTechnique:
      "2000+好评数量由门店经营者根据大众点评门店页面及经营后台确认；高德门店页、知乎文章和公开平台内容用于交叉核对同一门店与地点，不用于证明实时好评数量。",
    license: "https://creativecommons.org/licenses/by/4.0/",
    url: `${contentBase}reputation/`,
  };
}
