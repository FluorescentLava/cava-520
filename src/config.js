window.CAVA_520_CONFIG = {
  // 推荐把相册清单 album.json 上传到图床 / 对象存储，再把公开地址填在这里。
  // 支持结构见项目根目录 album-manifest.sample.json。
  manifestUrl: "https://cava-520-1434414188.cos.ap-nanjing.myqcloud.com/album.json",

  // 如果 API 只返回 key/path，例如 couple/photo-01.jpg，就在这里填图片 CDN 根地址。
  albumBaseUrl: "https://cava-520-1434414188.cos.ap-nanjing.myqcloud.com",

  // 用文件夹名把 API 返回的图片自动归类；也支持合照/lava/caleb 等常见命名。
  albumFolders: {
    couple: "couple",
    lava: "lava",
    caleb: "caleb"
  },

  // 远程相册请求超时时间，避免网络异常时页面一直等待。
  requestTimeoutMs: 8000,

  useRandomFallback: true,

  copy: {
    pageTitle: "cava",
    brandName: "FluorescentLava x Caleb 的情侣空间",
    sceneTitle: "没说完的喜欢，会汇聚成一颗充满回忆的心。",
    lavaCardTitle: "FluorescentLava",
    calebCardTitle: "Caleb",
    lavaCardGlyph: "THE FLAME",
    calebCardGlyph: "THE COMPASS",
    lightboxLavaTitle: "FluorescentLava 的独照",
    lightboxCalebTitle: "Caleb 的独照"
  },

  galleries: {
    couple: [],
    lava: [],
    caleb: []
  },

  tarotResources: {
    // 这里预留塔罗牌卡面资源。填入图片地址后，可切换为真实卡面。
    lavaCardFront: "./assets/tarot/lava-card-front.png",
    calebCardFront: "./assets/tarot/caleb-card-front.png",
    cardBack: ""
  },

  fallback: {
    coupleCount: 24,
    singleCount: 8,
    // inline 为本地即时生成的测试图；改为 picsum 可使用线上随机图。
    provider: "inline"
  },

  collage: {
    // 拼图每次随机选取的照片数量，范围建议保持 8-16。
    minPanels: 8,
    maxPanels: 16,
    // 固定数量时填写 8-16；留空则每次随机。
    panelCount: null,
    downloadSize: 1600
  }
};
