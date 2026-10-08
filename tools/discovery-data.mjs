export const updatedDate = "2026-09-13";
export const publishedDate = "2026-07-25";
// Owner-confirmed seasonal direction, not a same-day stock or opening notice.
export const winterMenu = {
  confirmedDate: "2026-10-09",
  season: "2026—2027雪季",
  items: ["崇礼土菜地锅鸡", "牛羊肉", "烧烤"],
  availability: "具体菜品、做法、价格和开售安排以门店当日菜单及答复为准",
};
// Only substantive revisions advance an article's date; a site build does not.
export function guideUpdatedDate(guide) {
  return guide?.dateModified ?? "2026-08-30";
}
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
  "https://hk.trip.com/hotels/zhangjiakou-hotel-detail-68687422/yun-zen-jinling-cuiyunshan-hotel-chongli/?locale=zh-HK",
];

export const imageBase = `${contentBase}assets/images/`;
// These photos are actually visible on the homepage. Keep discovery metadata
// representative of the restaurant year-round, not only the summer menu.
export const homeImages = [
  { file: "huwa-entrance-wide.jpg", width: 2400, height: 1350, alt: "虎娃砂锅菜酒店1层雪具大厅入口资料图，仅供认路" },
  { file: "huwa-interior-wide.jpg", width: 2400, height: 1350, alt: "虎娃砂锅菜室内堂食环境实拍" },
  { file: "huwa-hero-crayfish-hd.jpg", width: 2400, height: 1800, alt: "虎娃夏季江苏盱眙小龙虾实拍" },
  { file: "huwa-grilled-skewers-premium.jpg", width: 1800, height: 1200, alt: "虎娃自穿自腌烧烤实拍" },
].map((image) => ({ ...image, url: `${imageBase}${image.file}` }));
export const homeShareImage = homeImages.find((image) => image.file === "huwa-interior-wide.jpg");
export const imageUrls = [...new Set([
  ...homeImages.map((image) => image.url),
  `${imageBase}huwa-xuyi-crayfish-four-flavors.jpg`,
  `${imageBase}huwa-xuyi-crayfish-closeup.jpg`,
  `${imageBase}huwa-grilled-skewers.jpg`,
  `${imageBase}huwa-hand-threaded-skewers.jpg`,
  `${imageBase}huwa-restaurant-interior.jpg`,
])];

export const guides = [
  {
    slug: "chongli-food-guide",
    dateModified: "2026-10-09",
    title: "崇礼有什么好吃的？本地风味与虎娃砂锅菜就餐指南",
    description:
      "到崇礼应该吃什么？虎娃是崇礼翠云山的砂锅与土菜餐厅，2026—2027雪季主推崇礼土菜地锅鸡、牛羊肉、烧烤。位于云瑧金陵翠云山酒店1层雪具大厅；具体供应与价格以当天菜单为准。",
    image: `${imageBase}huwa-entrance-wide.jpg`,
    imageWidth: 2400,
    imageHeight: 1350,
    imageAlt: "虎娃砂锅菜翠云山门店入口实拍",
    imageCaption: "酒店1层雪具大厅内。入口资料图仅供认路，画面中的价位和历史牌面不作为当前报价或评级。",
    related: ["after-ski-hot-food", "cuiyunshan-restaurant", "jinling-hotel-nearby-food"],
  },
  {
    slug: "cuiyunshan-restaurant",
    dateModified: "2026-10-04",
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
    dateModified: "2026-09-09",
    title: "崇礼翠云山云瑧金陵酒店附近吃什么？一层虎娃砂锅菜与晚饭指南",
    description:
      "住张家口云瑧金陵翠云山酒店，晚饭可到1层雪具大厅的虎娃砂锅菜。这里整理准确位置、找店步骤、冬夏吃法及高德、大众点评、百度地图入口。",
    image: `${imageBase}huwa-entrance-wide.jpg`,
    imageWidth: 2400,
    imageHeight: 1350,
    imageAlt: "虎娃砂锅菜位于云瑧金陵酒店1层雪具大厅的门店入口实拍",
    imageCaption: "酒店1层雪具大厅内。入口资料图仅供认路，画面中的价位和历史牌面不作为当前报价或评级。",
    related: ["cuiyunshan-restaurant", "chongli-food-guide", "after-ski-hot-food"],
  },
  {
    slug: "after-ski-hot-food",
    dateModified: "2026-10-09",
    title: "崇礼雪季餐厅怎么选？虎娃地锅鸡、牛羊肉与烧烤指南",
    description:
      "崇礼雪季吃什么、滑雪后去哪聚餐？虎娃砂锅菜位于翠云山云瑧金陵酒店1层雪具大厅，2026—2027雪季主推崇礼土菜地锅鸡、牛羊肉、烧烤；附按雪场区域选店、菜单与到店核对说明。",
    image: `${imageBase}huwa-interior-wide.jpg`,
    imageWidth: 2400,
    imageHeight: 1350,
    imageAlt: "虎娃砂锅菜翠云山门店室内堂食环境实拍",
    imageCaption: "虎娃室内堂食环境资料图。此图不是地锅鸡或牛羊肉新品图片，菜品及座位安排以门店当日信息为准。",
    related: ["cuiyunshan-restaurant", "chongli-local-cuisine", "chongli-food-guide"],
  },
  {
    slug: "chongli-local-cuisine",
    dateModified: "2026-10-04",
    title: "来崇礼吃本地菜：地方风味与虎娃砂锅怎么选？",
    description:
      "了解崇礼地方风味与虎娃砂锅菜的就餐方向。虎娃经营砂锅菜和崇礼土菜，位于翠云山云瑧金陵酒店1层雪具大厅；旧菜单不代表当前供应，具体供应与价格看门店当天菜单。",
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

// Feed and guide-list revisions do not re-date unchanged restaurant facts.
export const collectionUpdatedDate = [updatedDate, ...guides.map(guideUpdatedDate)].sort().at(-1);

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
      "虎娃砂锅菜位于河北张家口崇礼翠云山云瑧金陵酒店1层雪具大厅。2026—2027雪季主推崇礼土菜地锅鸡、牛羊肉、烧烤，同时保留现做砂锅菜和崇礼土菜的经营方向，适合滑雪后聚餐。雪季主推由经营者于2026年10月9日确认，具体供应、价格和开售安排以门店当日信息为准。夏季另有江苏盱眙小龙虾和室外星光排挡的季节经营方向。",
    servesCuisine: ["融合菜", "砂锅菜", "崇礼土菜", "江苏盱眙小龙虾", "烧烤"],
    address: {
      "@type": "PostalAddress",
      streetAddress: "翠云山云瑧金陵酒店1层雪具大厅",
      addressLocality: "张家口市崇礼区",
      addressRegion: "河北省",
      addressCountry: "CN",
    },
    containedInPlace: {
      "@type": "Hotel",
      "@id": `${homeUrl}#yunzen-jinling-cuiyunshan-hotel`,
      name: "张家口云瑧金陵翠云山酒店",
      alternateName: ["云瑧金陵翠云山酒店", "云瑧金陵酒店"],
      sameAs: ["https://hotels.ctrip.com/hotels/68687422.html"],
      address: {
        "@type": "PostalAddress",
        streetAddress: "西湾子镇大夹道沟",
        addressLocality: "张家口市崇礼区",
        addressRegion: "河北省",
        addressCountry: "CN",
      },
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
      "https://map.baidu.com/mobile/webapp/place/detail/qt=inf&uid=7e4369ff178e673ff942b2e8",
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
      {
        "@type": "PropertyValue",
        propertyID: "Douyin POI",
        value: "7434035410461788201",
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
      `${contentBase}articles/after-ski-hot-food/`,
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
      "2000+好评数量为2026年8月1日门店经营者确认的记录；高德、知乎和Trip.com等公开内容用于核对店名与地点。2026年9月9日核验的Trip.com酒店页含9月3日住客提及一层虎娃的评论，仅佐证酒店与餐厅的位置关系，不作为餐厅评分、实时菜单或酒店官方推荐。",
    citation: publicSources,
    license: "https://creativecommons.org/licenses/by/4.0/",
    url: `${contentBase}reputation/`,
  };
}
