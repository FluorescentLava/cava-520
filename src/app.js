const config = window.CAVA_520_CONFIG || {};
const ANNIVERSARY = { year: 2026, monthIndex: 2, day: 6 };
const MS_PER_DAY = 24 * 60 * 60 * 1000;

const state = {
  photos: {
    couple: [],
    lava: [],
    caleb: []
  },
  copy: {},
  tarotResources: {},
  currentCollage: {
    panels: [],
    photos: []
  },
  currentGallery: "lava",
  currentIndex: 0,
  activeAlbumGallery: "",
  isNight: false,
  hasEntered: false,
  themeWipe: null,
  resizeTimer: null,
  introTouchStartY: 0
};

const els = {
  introScreen: document.querySelector("#introScreen"),
  intro520: document.querySelector("#intro520"),
  enterButton: document.querySelector("#enterButton"),
  heartGrid: document.querySelector("#heartGrid"),
  photoMeter: document.querySelector("#photoMeter"),
  brandName: document.querySelector("#brandName"),
  sceneKicker: document.querySelector("#sceneKicker"),
  sceneTitle: document.querySelector("#sceneTitle"),
  shuffleButton: document.querySelector("#shuffleButton"),
  downloadButton: document.querySelector("#downloadButton"),
  themeButton: document.querySelector("#themeButton"),
  themeIcon: document.querySelector("#themeIcon"),
  lavaCardTitle: document.querySelector("#lavaCardTitle"),
  calebCardTitle: document.querySelector("#calebCardTitle"),
  lavaCardGlyph: document.querySelector("#lavaCardGlyph"),
  calebCardGlyph: document.querySelector("#calebCardGlyph"),
  lightbox: document.querySelector("#lightbox"),
  lightboxImage: document.querySelector("#lightboxImage"),
  lightboxTitle: document.querySelector("#lightboxTitle"),
  lightboxIndex: document.querySelector("#lightboxIndex"),
  prevButton: document.querySelector(".lightbox-prev"),
  nextButton: document.querySelector(".lightbox-next"),
  albumViewer: document.querySelector("#albumViewer"),
  albumPanel: document.querySelector(".album-panel"),
  albumCardStage: document.querySelector("#albumCardStage"),
  albumCardImage: document.querySelector("#albumCardImage"),
  albumGalleryKicker: document.querySelector("#albumGalleryKicker"),
  albumGalleryTitle: document.querySelector("#albumGalleryTitle"),
  albumGalleryGrid: document.querySelector("#albumGalleryGrid")
};

const galleryAliases = {
  couple: ["couple", "collage", "heart", "together", "shared", "us", "合照", "双人", "情侣"],
  lava: ["lava", "fluorescentLava", "fluorescentlava", "fluorescent_lava", "fluorescent-lava", "lava照片"],
  caleb: ["caleb", "caleb照片"]
};

const galleryKeys = ["couple", "lava", "caleb"];
const apiCollectionKeys = new Set([
  "data",
  "items",
  "list",
  "files",
  "images",
  "objects",
  "contents",
  "resources",
  "records",
  "rows",
  "result",
  "results"
]);
const imageUrlFields = [
  "src",
  "url",
  "secure_url",
  "download_url",
  "downloadUrl",
  "origin_url",
  "originUrl",
  "image_url",
  "imageUrl",
  "display_url",
  "displayUrl",
  "raw_url",
  "rawUrl",
  "link",
  "path",
  "key",
  "name",
  "filename"
];
const imageExtensionPattern = /\.(?:avif|bmp|gif|jpe?g|png|webp)(?:[?#].*)?$/i;

const fallbackWords = {
  couple: ["first-look", "river", "streetlight", "letter", "film", "rain", "window", "promise"],
  lava: ["ember", "bright", "road", "coffee", "afterglow", "quiet", "pages", "city"],
  caleb: ["caleb", "ink", "compass", "harbor", "blue", "late-night", "laugh", "cloud"]
};

init();

async function init() {
  hydrateOptions({});
  applyCopy();
  applyDates();
  applyTarotResources();
  setTheme(false, false);
  attachEvents();

  let remoteAlbum = {};

  try {
    remoteAlbum = await loadRemoteAlbum();
  } catch (error) {
    console.warn("cava 520 remote photo loading failed, using fallback.", error);
    setMeter("线上相册暂时没连上，已启用本地预览");
  }

  hydrateOptions(remoteAlbum);
  applyCopy();
  applyDates();
  applyTarotResources();
  state.photos = mergePhotos(remoteAlbum);
  renderHeart();
  updateMeter();
}

function hydrateOptions(remoteAlbum) {
  remoteAlbum = remoteAlbum && typeof remoteAlbum === "object" ? remoteAlbum : {};
  const remoteTarotResources = Object.fromEntries(
    Object.entries(remoteAlbum.tarotResources || {}).filter(([, value]) => trim(value))
  );

  state.copy = {
    ...(config.copy || {}),
    ...(remoteAlbum.copy || {})
  };

  state.tarotResources = {
    ...(config.tarotResources || {}),
    ...remoteTarotResources
  };
}

function applyCopy() {
  const copy = state.copy || {};
  const pageTitle = copy.pageTitle || copy.brandName || "cava";

  document.title = pageTitle;
  setText(els.brandName, copy.brandName, "FluorescentLava x Caleb 的情侣空间");
  setText(els.sceneTitle, copy.sceneTitle, "没说完的喜欢，会汇聚成一颗充满回忆的心。");
  setText(els.lavaCardTitle, copy.lavaCardTitle, "FluorescentLava");
  setText(els.calebCardTitle, copy.calebCardTitle, "Caleb");
  setText(els.lavaCardGlyph, copy.lavaCardGlyph, "THE FLAME");
  setText(els.calebCardGlyph, copy.calebCardGlyph, "THE COMPASS");
}

function applyDates() {
  const today = getLocalDateOnly(new Date());
  const relationshipDay = getRelationshipDay(today);
  if (els.sceneKicker) {
    els.sceneKicker.innerHTML = `我们已经相处了 <strong>${relationshipDay}</strong> 天`;
  }

  if (!els.intro520) return;

  if (today.getMonth() === 4 && today.getDate() === 20) {
    const count = getMay20Count(today);
    els.intro520.innerHTML = `今天是我们一起度过的第<strong>${count}</strong>个520~`;
    els.intro520.hidden = false;
  } else {
    els.intro520.textContent = "";
    els.intro520.hidden = true;
  }
}

function getLocalDateOnly(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function getAnniversaryDate() {
  return new Date(ANNIVERSARY.year, ANNIVERSARY.monthIndex, ANNIVERSARY.day);
}

function getRelationshipDay(today) {
  const diff = Math.floor((today - getAnniversaryDate()) / MS_PER_DAY);
  return Math.max(1, diff + 1);
}

function getMay20Count(today) {
  let count = 0;

  for (let year = ANNIVERSARY.year; year <= today.getFullYear(); year += 1) {
    const may20 = new Date(year, 4, 20);
    if (may20 >= getAnniversaryDate() && may20 <= today) {
      count += 1;
    }
  }

  return Math.max(1, count);
}

function setText(element, value, fallback) {
  if (!element) return;
  element.textContent = trim(value) || fallback;
}

function applyTarotResources() {
  const resources = state.tarotResources || {};
  const images = {
    lava: resources.lavaCardFront || resources.lava || "",
    caleb: resources.calebCardFront || resources.caleb || ""
  };

  document.querySelectorAll(".tarot-card").forEach((card) => {
    const image = trim(images[card.dataset.gallery]);
    let cardImage = card.querySelector(".tarot-card-image");

    card.classList.toggle("has-image", Boolean(image));

    if (image) {
      if (!cardImage) {
        cardImage = document.createElement("img");
        cardImage.className = "tarot-card-image";
        cardImage.alt = "";
        cardImage.decoding = "async";
        cardImage.loading = "eager";
        card.prepend(cardImage);
      }

      if (cardImage.getAttribute("src") !== image) {
        cardImage.src = image;
      }

      cardImage.hidden = false;
      card.style.setProperty("--tarot-image", toCssUrl(image));
    } else {
      if (cardImage) cardImage.remove();
      card.style.removeProperty("--tarot-image");
    }
  });
}

function attachEvents() {
  els.enterButton.addEventListener("click", enterContent);

  els.introScreen.addEventListener(
    "wheel",
    (event) => {
      if (event.deltaY > 8) enterContent();
    },
    { passive: true }
  );

  els.introScreen.addEventListener(
    "touchstart",
    (event) => {
      state.introTouchStartY = event.changedTouches[0].clientY;
    },
    { passive: true }
  );

  els.introScreen.addEventListener(
    "touchend",
    (event) => {
      const deltaY = state.introTouchStartY - event.changedTouches[0].clientY;
      if (deltaY > 28) enterContent();
    },
    { passive: true }
  );

  window.addEventListener("keydown", (event) => {
    if (!state.hasEntered && ["ArrowDown", "PageDown", " ", "Enter"].includes(event.key)) {
      enterContent();
      return;
    }

    if (event.key === "Escape" && els.albumViewer && !els.albumViewer.hidden) {
      closeAlbumViewer();
      return;
    }

    if (els.lightbox.hidden) return;
    if (event.key === "Escape") closeGallery();
    if (event.key === "ArrowLeft") moveGallery(-1);
    if (event.key === "ArrowRight") moveGallery(1);
  });

  document.querySelectorAll(".tarot-card").forEach((card) => {
    card.addEventListener("click", () => {
      const gallery = card.dataset.gallery || "lava";
      openAlbumViewer(gallery, card);
    });
  });

  els.shuffleButton.addEventListener("click", () => {
    renderHeart();
    updateMeter();
  });

  els.downloadButton.addEventListener("click", downloadCollage);

  els.themeButton.addEventListener("click", () => {
    setTheme(!state.isNight);
  });

  document.querySelectorAll("[data-close-lightbox]").forEach((node) => {
    node.addEventListener("click", closeGallery);
  });

  document.querySelectorAll("[data-close-album]").forEach((node) => {
    node.addEventListener("click", closeAlbumViewer);
  });

  els.prevButton.addEventListener("click", () => moveGallery(-1));
  els.nextButton.addEventListener("click", () => moveGallery(1));

  let touchStartX = 0;
  els.lightbox.addEventListener(
    "touchstart",
    (event) => {
      touchStartX = event.changedTouches[0].clientX;
    },
    { passive: true }
  );

  els.lightbox.addEventListener(
    "touchend",
    (event) => {
      const delta = event.changedTouches[0].clientX - touchStartX;
      if (Math.abs(delta) > 44) moveGallery(delta > 0 ? -1 : 1);
    },
    { passive: true }
  );

  window.addEventListener("resize", () => {
    window.clearTimeout(state.resizeTimer);
    state.resizeTimer = window.setTimeout(renderHeart, 180);
  });
}

function enterContent() {
  if (state.hasEntered) return;
  state.hasEntered = true;
  document.body.classList.add("is-content-entered");
}

function setTheme(isNight, animate = true) {
  const nextIsNight = Boolean(isNight);
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (state.themeWipe) {
    state.themeWipe.remove();
    state.themeWipe = null;
    document.body.classList.remove("theme-transitioning");
  }

  if (animate && !reduceMotion && els.themeButton && document.body.animate) {
    runThemeWipe(nextIsNight);
    return;
  }

  applyThemeState(nextIsNight);
}

function applyThemeState(isNight) {
  state.isNight = Boolean(isNight);
  document.body.classList.toggle("is-night-mode", state.isNight);
  updateThemeControl(state.isNight);

  const themeMeta = document.querySelector("meta[name='theme-color']");
  if (themeMeta) {
    themeMeta.setAttribute("content", state.isNight ? "#151118" : "#fffaf7");
  }
}

function updateThemeControl(isNight) {
  els.themeButton.setAttribute("aria-label", isNight ? "切换到白天" : "切换到夜晚");
  els.themeButton.setAttribute("title", isNight ? "切换到白天" : "切换到夜晚");

  if (els.themeIcon) {
    els.themeIcon.innerHTML = isNight
      ? `<circle cx="12" cy="12" r="4.2"></circle><path d="M12 2.5v2.2M12 19.3v2.2M4.7 4.7l1.6 1.6M17.7 17.7l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.7 19.3l1.6-1.6M17.7 6.3l1.6-1.6"></path>`
      : `<path d="M20.4 14.8A7.5 7.5 0 0 1 9.2 3.6 8.7 8.7 0 1 0 20.4 14.8Z"></path>`;
  }
}

function runThemeWipe(isNight) {
  const oldIsNight = state.isNight;
  const rect = els.themeButton.getBoundingClientRect();
  const originX = rect.left + rect.width / 2;
  const originY = rect.top + rect.height / 2;
  const radius = Math.ceil(
    Math.hypot(
      Math.max(originX, window.innerWidth - originX),
      Math.max(originY, window.innerHeight - originY)
    )
  );
  const wipe = document.createElement("div");

  wipe.className = `theme-wipe ${oldIsNight ? "theme-wipe-night" : "theme-wipe-day"}`;
  wipe.style.setProperty("--theme-origin-x", `${originX}px`);
  wipe.style.setProperty("--theme-origin-y", `${originY}px`);
  document.body.appendChild(wipe);
  state.themeWipe = wipe;
  els.themeButton.disabled = true;
  document.body.classList.add("theme-transitioning");
  applyThemeState(isNight);

  const animation = wipe.animate(
    [
      { "--theme-wipe-radius": "8px", opacity: 1 },
      { "--theme-wipe-radius": `${radius + 180}px`, opacity: 1 }
    ],
    {
      duration: 920,
      easing: "cubic-bezier(0.2, 0.78, 0.22, 1)",
      fill: "forwards"
    }
  );

  animation.addEventListener(
    "finish",
    () => {
      wipe.remove();
      if (state.themeWipe === wipe) state.themeWipe = null;
      document.body.classList.remove("theme-transitioning");
      els.themeButton.disabled = false;
    },
    { once: true }
  );

  animation.addEventListener(
    "cancel",
    () => {
      wipe.remove();
      if (state.themeWipe === wipe) state.themeWipe = null;
      document.body.classList.remove("theme-transitioning");
      els.themeButton.disabled = false;
    },
    { once: true }
  );
}

async function loadRemoteAlbum() {
  const queryManifestUrl = new URLSearchParams(window.location.search).get("manifest");
  const manifestUrl = trim(queryManifestUrl) || trim(config.manifestUrl);

  if (manifestUrl) {
    const payload = await fetchAlbumEndpoint(manifestUrl);

    // 如果 payload 包含 folders 配置，自动扫描文件夹
    if (payload && payload.folders) {
      return scanFolders(payload);
    }

    return payload;
  }

  return {};
}

async function scanFolders(payload) {
  const baseUrl = payload.baseUrl || config.albumBaseUrl || "";
  const folders = payload.folders || {};
  const galleries = {};

  console.log("📁 开始扫描文件夹...", folders);

  for (const [galleryKey, folderConfig] of Object.entries(folders)) {
    const folderPath = typeof folderConfig === "string" ? folderConfig : folderConfig.path || galleryKey;
    const maxCount = typeof folderConfig === "object" ? (folderConfig.max || 100) : 100;
    const namePattern = typeof folderConfig === "object" ? (folderConfig.pattern || "photo-{:02d}.jpg") : "photo-{:02d}.jpg";

    galleries[galleryKey] = await scanFolderImages(baseUrl, folderPath, maxCount, namePattern, galleryKey);
    console.log(`✅ ${galleryKey}: 找到 ${galleries[galleryKey].length} 张图片`);
  }

  return {
    ...payload,
    baseUrl,
    galleries
  };
}

async function scanFolderImages(baseUrl, folderPath, maxCount, pattern, galleryKey) {
  const images = [];
  const promises = [];

  // 生成可能的文件名并并行测试
  for (let i = 1; i <= maxCount; i++) {
    const filename = formatFilename(pattern, i);
    const url = `${baseUrl}/${folderPath}/${filename}`.replace(/\/+/g, "/");

    promises.push(
      testImageExists(url).then(exists => {
        if (exists) {
          images.push({
            src: url,
            alt: `${galleryKey} ${i}`
          });
        }
      })
    );
  }

  await Promise.all(promises);

  // 按序号排序
  return images.sort((a, b) => {
    const numA = extractImageNumber(a.src);
    const numB = extractImageNumber(b.src);
    return numA - numB;
  });
}

function formatFilename(pattern, index) {
  // 支持多种格式：
  // {:02d} → 01, 02, 03... (Python 风格)
  // {02d} → 01, 02, 03... (简化版)
  // {index} → 1, 2, 3... (无补零)
  return pattern
    .replace(/\{:0(\d+)d\}/g, (match, width) => {
      return String(index).padStart(parseInt(width), "0");
    })
    .replace(/\{0(\d+)d\}/g, (match, width) => {
      return String(index).padStart(parseInt(width), "0");
    })
    .replace(/\{index\}/g, index);
}

function testImageExists(url) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
  });
}

function extractImageNumber(url) {
  const match = url.match(/photo-(\d+)/i) || url.match(/(\d+)\./);
  return match ? parseInt(match[1]) : 0;
}

async function fetchAlbumEndpoint(url) {
  const controller = new AbortController();
  const timeout = Number(config.requestTimeoutMs) || 8000;
  const timer = window.setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      cache: "no-store",
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(`Photo manifest request failed: ${response.status}`);
    }

    const contentType = response.headers.get("content-type") || "";
    const text = await response.text();
    const payload = parseAlbumResponse(text, contentType, url);

    return normalizeAlbumPayload(payload, url);
  } finally {
    window.clearTimeout(timer);
  }
}

function parseAlbumResponse(text, contentType, sourceUrl) {
  const raw = trim(text);

  if (!raw) return {};

  if (contentType.includes("json") || raw.startsWith("{") || raw.startsWith("[")) {
    return JSON.parse(raw);
  }

  if (contentType.includes("xml") || raw.startsWith("<")) {
    return parseAlbumXml(raw, sourceUrl);
  }

  throw new Error("Unsupported photo album response format.");
}

function parseAlbumXml(text, sourceUrl) {
  const xml = new DOMParser().parseFromString(text, "application/xml");

  if (xml.querySelector("parsererror")) {
    throw new Error("Photo album XML parse failed.");
  }

  const nodes = Array.from(xml.querySelectorAll("Contents, contents, Item, item, File, file"));
  const items = nodes
    .map((node) => {
      const key = readXmlText(node, "Key") || readXmlText(node, "key") || readXmlText(node, "Name") || "";
      const url = readXmlText(node, "Url") || readXmlText(node, "URL") || readXmlText(node, "Location") || "";
      const mimeType = readXmlText(node, "MimeType") || readXmlText(node, "ContentType") || "";

      return { key, url, mimeType };
    })
    .filter((item) => item.key || item.url);

  return {
    baseUrl: getEndpointBaseUrl(sourceUrl),
    items
  };
}

function readXmlText(node, selector) {
  const target = node.querySelector(selector);
  return target ? trim(target.textContent) : "";
}

function getEndpointBaseUrl(url) {
  try {
    const parsed = new URL(url, window.location.href);
    parsed.search = "";
    parsed.hash = "";
    parsed.pathname = parsed.pathname.endsWith("/") ? parsed.pathname : parsed.pathname.replace(/[^/]*$/, "");
    return parsed.toString();
  } catch (error) {
    return "";
  }
}

function normalizeAlbumPayload(payload, sourceUrl = "") {
  if (!payload || typeof payload !== "object") return {};

  const baseUrl = getAlbumBaseUrl(payload);
  const galleries = {};

  galleryKeys.forEach((key) => {
    galleries[key] = [
      ...collectPhotos(payload.galleries || {}, key, baseUrl, sourceUrl),
      ...collectPhotos(payload, key, baseUrl, sourceUrl)
    ];
  });

  collectApiItems(payload).forEach((item, index) => {
    const photo = normalizePhoto(item, index, baseUrl, sourceUrl);
    if (!photo || !isImageCandidate(item, photo.src)) return;

    const gallery = inferGalleryKey(item, photo);
    if (gallery) {
      galleries[gallery].push(photo);
    }
  });

  return {
    ...payload,
    _albumBaseUrl: baseUrl,
    _albumSourceUrl: sourceUrl,
    galleries: {
      ...(payload.galleries || {}),
      ...Object.fromEntries(galleryKeys.map((key) => [key, dedupePhotos(galleries[key] || [])]))
    }
  };
}

function getAlbumBaseUrl(payload) {
  return (
    trim(config.albumBaseUrl) ||
    trim(payload.baseUrl) ||
    trim(payload.base_url) ||
    trim(payload.cdnBaseUrl) ||
    trim(payload.cdn_base_url) ||
    trim(payload.cdnDomain) ||
    trim(payload.domain)
  );
}

function collectApiItems(source, depth = 0) {
  if (depth > 5 || !source) return [];
  if (Array.isArray(source)) return source;
  if (typeof source !== "object") return [];

  return Object.entries(source).flatMap(([key, value]) => {
    if (["copy", "galleries", "tarotResources", "fallback", "collage"].includes(key)) return [];
    if (!apiCollectionKeys.has(key)) return [];

    return collectApiItems(value, depth + 1);
  });
}

function mergePhotos(remoteAlbum) {
  const configured = config.galleries || {};
  const normalizedRemote = normalizeAlbumPayload(remoteAlbum);
  const remoteBaseUrl = normalizedRemote._albumBaseUrl || "";
  const remoteSourceUrl = normalizedRemote._albumSourceUrl || "";
  const next = {};

  galleryKeys.forEach((key) => {
    const merged = [
      ...collectPhotos(configured, key),
      ...collectPhotos(normalizedRemote.galleries || {}, key, remoteBaseUrl, remoteSourceUrl),
      ...collectPhotos(normalizedRemote, key, remoteBaseUrl, remoteSourceUrl)
    ];

    next[key] = merged.length ? dedupePhotos(merged) : createFallbackPhotos(key);
  });

  if (!collectPhotos(normalizedRemote, "couple").length && Array.isArray(normalizedRemote.resources)) {
    next.couple = normalizePhotos(normalizedRemote.resources, remoteBaseUrl, remoteSourceUrl);
  }

  return next;
}

function collectPhotos(source, key, baseUrl = "", sourceUrl = "") {
  if (!source || typeof source !== "object") return [];

  return (galleryAliases[key] || [key]).flatMap((alias) => normalizePhotos(source[alias], baseUrl, sourceUrl));
}

function normalizePhotos(items, baseUrl = "", sourceUrl = "") {
  if (!Array.isArray(items)) return [];

  return items
    .map((item, index) => normalizePhoto(item, index, baseUrl, sourceUrl))
    .filter((item) => item && item.src);
}

function normalizePhoto(item, index, baseUrl = "", sourceUrl = "") {
  if (typeof item === "string") {
    return {
      src: resolvePhotoUrl(item, baseUrl, sourceUrl),
      alt: `cava photo ${index + 1}`
    };
  }

  if (!item || typeof item !== "object") return null;

  const rawSrc = getPhotoSourceValue(item);
  const src = resolvePhotoUrl(rawSrc, baseUrl, sourceUrl);

  if (!src) return null;

  return {
    src,
    alt: item.alt || item.title || item.filename || item.name || item.key || `cava photo ${index + 1}`
  };
}

function getPhotoSourceValue(item) {
  for (const field of imageUrlFields) {
    const value = item[field];
    if (typeof value === "string" && trim(value)) return value;

    if (value && typeof value === "object") {
      const nested = getPhotoSourceValue(value);
      if (nested) return nested;
    }
  }

  return "";
}

function resolvePhotoUrl(value, baseUrl = "", sourceUrl = "") {
  const raw = trim(value);
  if (!raw) return "";
  if (/^(?:https?:|data:|blob:)/i.test(raw)) return raw;
  if (raw.startsWith("//")) return `${window.location.protocol}${raw}`;

  try {
    if (baseUrl) {
      return new URL(raw.replace(/^\/+/, ""), ensureTrailingSlash(baseUrl)).toString();
    }

    return new URL(raw, sourceUrl || window.location.href).toString();
  } catch (error) {
    return raw;
  }
}

function ensureTrailingSlash(value) {
  return value.endsWith("/") ? value : `${value}/`;
}

function isImageCandidate(item, src) {
  const mimeType = trim(item.mimeType || item.mime || item.contentType || item.content_type || item.type);
  const path = [src, item.key, item.path, item.name, item.filename].filter(Boolean).join(" ");

  return (
    /^image\//i.test(mimeType) ||
    imageExtensionPattern.test(path) ||
    /^(?:https?:|data:|blob:)/i.test(src)
  );
}

function inferGalleryKey(item, photo) {
  const hints = [
    item.gallery,
    item.album,
    item.albumName,
    item.category,
    item.group,
    item.type,
    item.folder,
    item.dir,
    item.prefix,
    item.key,
    item.path,
    item.name,
    item.filename,
    photo.alt,
    photo.src
  ];

  for (const hint of hints) {
    const matched = matchGalleryAlias(hint);
    if (matched) return matched;
  }

  return null;
}

function matchGalleryAlias(value) {
  const hint = normalizeGalleryHint(value);
  if (!hint) return "";

  for (const key of galleryKeys) {
    const aliases = [config.albumFolders && config.albumFolders[key], ...(galleryAliases[key] || [])]
      .map(normalizeGalleryHint)
      .filter(Boolean);

    if (aliases.some((alias) => hint.includes(alias))) {
      return key;
    }
  }

  return "";
}

function normalizeGalleryHint(value) {
  return trim(value).toLowerCase().replace(/[\s_%]+/g, "-");
}

function dedupePhotos(items) {
  const seen = new Set();

  return items.filter((item) => {
    if (seen.has(item.src)) return false;
    seen.add(item.src);
    return true;
  });
}

function createFallbackPhotos(type) {
  const fallback = config.fallback || {};
  const count = type === "couple" ? fallback.coupleCount || 24 : fallback.singleCount || 8;
  const width = type === "couple" ? 720 : 860;
  const height = type === "couple" ? 920 : 1120;
  const words = fallbackWords[type] || fallbackWords.couple;
  const provider = fallback.provider || "inline";

  return Array.from({ length: count }, (_, index) => {
    const word = words[index % words.length];
    const seed = `cava-520-${type}-${word}-${index + 1}`;
    const src =
      provider === "picsum"
        ? `https://picsum.photos/seed/${encodeURIComponent(seed)}/${width}/${height}`
        : createInlinePhoto(type, index, width, height);

    return {
      src,
      alt: `${type} placeholder ${index + 1}`
    };
  });
}

function createInlinePhoto(type, index, width, height) {
  const palettes = [
    ["#f4aaa9", "#fffaf7", "#f3c66b", "#3a2932"],
    ["#f3c98b", "#fffaf7", "#f2a894", "#342c3a"],
    ["#f7d9a4", "#fffaf7", "#efbdcf", "#342933"],
    ["#f0a5b7", "#fffaf7", "#f4d28a", "#302a36"],
    ["#e9c1aa", "#fffaf7", "#f6dea3", "#342933"]
  ];
  const palette = palettes[index % palettes.length];
  const label = type === "couple" ? "CAVA" : type === "lava" ? "FLUORESCENTLAVA" : "CALEB";
  const mark = String(index + 1).padStart(2, "0");
  const tilt = (index % 7) - 3;
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="${palette[0]}"/>
          <stop offset="0.5" stop-color="${palette[1]}"/>
          <stop offset="1" stop-color="${palette[2]}"/>
        </linearGradient>
        <pattern id="paper" width="42" height="42" patternUnits="userSpaceOnUse">
          <path d="M0 42L42 0" stroke="${palette[3]}" stroke-width="1" opacity="0.045"/>
        </pattern>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#g)"/>
      <rect width="${width}" height="${height}" fill="url(#paper)"/>
      <g transform="rotate(${tilt} ${width / 2} ${height / 2})">
        <rect x="${width * 0.1}" y="${height * 0.1}" width="${width * 0.8}" height="${height * 0.78}" rx="${width * 0.032}" fill="none" stroke="${palette[3]}" stroke-width="${width * 0.006}" opacity="0.2"/>
        <path d="M${width * 0.18} ${height * 0.72} C${width * 0.34} ${height * 0.5}, ${width * 0.64} ${height * 0.63}, ${width * 0.82} ${height * 0.36}" fill="none" stroke="${palette[3]}" stroke-width="${width * 0.008}" opacity="0.12"/>
      </g>
      <text x="50%" y="48%" text-anchor="middle" fill="${palette[3]}" font-family="Inter, Arial, sans-serif" font-size="${width * 0.082}" font-weight="800" opacity="0.72">${label}</text>
      <text x="50%" y="56%" text-anchor="middle" fill="${palette[3]}" font-family="Inter, Arial, sans-serif" font-size="${width * 0.03}" letter-spacing="4" opacity="0.42">MEMORY ${mark}</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function renderHeart() {
  const settings = getCollageSettings();
  const count = getCollageCount(settings);
  const panels = createComicPanels(count);
  const photos = pickPhotos(state.photos.couple, count);

  state.currentCollage = { panels, photos };
  els.heartGrid.innerHTML = "";

  panels.forEach((panel, index) => {
    const photo = photos[index];
    const tile = document.createElement("button");
    const img = document.createElement("img");

    tile.className = "heart-panel";
    tile.type = "button";
    tile.style.left = `${panel.x}%`;
    tile.style.top = `${panel.y}%`;
    tile.style.width = `${panel.w}%`;
    tile.style.height = `${panel.h}%`;
    tile.style.setProperty("--delay", `${Math.min(index * 42, 640)}ms`);
    tile.style.setProperty("--focus-x", `${panel.focusX}%`);
    tile.style.setProperty("--focus-y", `${panel.focusY}%`);
    tile.setAttribute("aria-label", photo.alt || `拼图照片 ${index + 1}`);

    img.src = photo.src;
    img.alt = photo.alt;
    img.loading = index < 8 ? "eager" : "lazy";
    img.decoding = "async";
    img.addEventListener("load", () => tile.classList.add("is-loaded"), { once: true });
    img.addEventListener(
      "error",
      () => {
        img.src = createInlinePhoto("couple", index, 720, 920);
        tile.classList.add("is-loaded");
      },
      { once: true }
    );

    tile.addEventListener("click", () => {
      state.currentGallery = "couple";
      state.currentIndex = Math.max(
        0,
        state.photos.couple.findIndex((item) => item.src === photo.src)
      );
      els.lightbox.hidden = false;
      document.body.classList.add("is-lightbox-open");
      updateLightbox();
    });

    tile.appendChild(img);
    els.heartGrid.appendChild(tile);
  });
}

function getCollageSettings() {
  const collage = config.collage || {};

  return {
    minPanels: clampInteger(collage.minPanels, 8, 16, 8),
    maxPanels: clampInteger(collage.maxPanels, 8, 16, 16),
    panelCount: Number.isFinite(Number(collage.panelCount)) ? Number(collage.panelCount) : null,
    downloadSize: clampInteger(collage.downloadSize, 1000, 2600, 1600)
  };
}

function getCollageCount(settings) {
  const minPanels = Math.min(settings.minPanels, settings.maxPanels);
  const maxPanels = Math.max(settings.minPanels, settings.maxPanels);

  if (settings.panelCount) {
    return clampInteger(settings.panelCount, minPanels, maxPanels, 12);
  }

  return Math.floor(randomBetween(minPanels, maxPanels + 1));
}

function createComicPanels(count) {
  const gap = 0.68;
  const panels = [{ x: 4.8, y: 5.8, w: 90.4, h: 87.2 }];

  while (panels.length < count) {
    panels.sort((a, b) => b.w * b.h - a.w * a.h);
    const panel = panels.shift();
    const splitVertically = panel.w / panel.h > 1.2 || (panel.w / panel.h > 0.82 && Math.random() > 0.52);
    const canSplitVertically = panel.w > 18;
    const canSplitHorizontally = panel.h > 18;
    const vertical = canSplitVertically && (!canSplitHorizontally || splitVertically);
    const ratio = randomBetween(0.36, 0.64);

    if (vertical) {
      const firstW = panel.w * ratio - gap / 2;
      const secondW = panel.w - firstW - gap;
      panels.push(
        { x: panel.x, y: panel.y, w: firstW, h: panel.h },
        { x: panel.x + firstW + gap, y: panel.y, w: secondW, h: panel.h }
      );
    } else if (canSplitHorizontally) {
      const firstH = panel.h * ratio - gap / 2;
      const secondH = panel.h - firstH - gap;
      panels.push(
        { x: panel.x, y: panel.y, w: panel.w, h: firstH },
        { x: panel.x, y: panel.y + firstH + gap, w: panel.w, h: secondH }
      );
    } else {
      panels.push(panel);
      break;
    }
  }

  return shuffle(panels)
    .slice(0, count)
    .map((panel) => ({
      ...panel,
      focusX: randomBetween(38, 62),
      focusY: randomBetween(36, 64)
    }));
}

function pickPhotos(photos, count) {
  const pool = shuffle(photos.length ? photos : createFallbackPhotos("couple"));
  return Array.from({ length: count }, (_, index) => pool[index % pool.length]);
}

async function downloadCollage() {
  if (!state.currentCollage.panels.length) return;

  const originalText = els.downloadButton.textContent;
  els.downloadButton.disabled = true;
  els.downloadButton.textContent = "生成中";

  try {
    const blob = await renderCollageBlob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `cava-520-${new Date().toISOString().slice(0, 10)}.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setMeter("拼图已生成，可以把这一版留下来");
  } catch (error) {
    console.warn("cava 520 collage download failed.", error);
    setMeter("当前图片源不允许合成下载，请换支持 CORS 的图床");
  } finally {
    els.downloadButton.disabled = false;
    els.downloadButton.textContent = originalText;
  }
}

async function renderCollageBlob() {
  const settings = getCollageSettings();
  const size = settings.downloadSize;
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  canvas.width = size;
  canvas.height = size;

  const layout = getDownloadLayout(size);
  drawDownloadBackground(ctx, size);
  drawHeartPath(ctx, layout);
  ctx.save();
  ctx.clip();
  ctx.fillStyle = state.isNight ? "#221722" : "#fffdf9";
  ctx.fillRect(layout.x, layout.y, layout.size, layout.size);

  const images = await Promise.all(state.currentCollage.photos.map((photo) => loadCanvasImage(photo.src)));

  state.currentCollage.panels.forEach((panel, index) => {
    const x = layout.x + (panel.x / 100) * layout.size;
    const y = layout.y + (panel.y / 100) * layout.size;
    const w = (panel.w / 100) * layout.size;
    const h = (panel.h / 100) * layout.size;
    const radius = layout.size * 0.012;

    ctx.save();
    roundedRect(ctx, x, y, w, h, radius);
    ctx.clip();
    drawImageCover(ctx, images[index], x, y, w, h, panel.focusX, panel.focusY);
    ctx.restore();

    ctx.strokeStyle = state.isNight ? "rgba(255, 248, 241, 0.52)" : "rgba(255, 255, 255, 0.68)";
    ctx.lineWidth = layout.size * 0.0036;
    roundedRect(ctx, x, y, w, h, radius);
    ctx.stroke();
  });

  ctx.restore();
  drawDownloadCaption(ctx, size, layout);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Canvas export failed"));
    }, "image/png");
  });
}

function drawDownloadBackground(ctx, size) {
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  if (state.isNight) {
    gradient.addColorStop(0, "#151118");
    gradient.addColorStop(0.54, "#271623");
    gradient.addColorStop(1, "#1b1d24");
  } else {
    gradient.addColorStop(0, "#fff9f8");
    gradient.addColorStop(0.58, "#fff4f3");
    gradient.addColorStop(1, "#fff8ee");
  }
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  const warm = ctx.createRadialGradient(size * 0.78, size * 0.18, 0, size * 0.78, size * 0.18, size * 0.42);
  if (state.isNight) {
    warm.addColorStop(0, "rgba(234, 214, 170, 0.1)");
    warm.addColorStop(1, "rgba(234, 214, 170, 0)");
  } else {
    warm.addColorStop(0, "rgba(243, 198, 107, 0.14)");
    warm.addColorStop(1, "rgba(243, 198, 107, 0)");
  }
  ctx.fillStyle = warm;
  ctx.fillRect(0, 0, size, size);

  const blush = ctx.createLinearGradient(0, 0, size, size * 0.7);
  if (state.isNight) {
    blush.addColorStop(0, "rgba(255, 143, 168, 0.07)");
    blush.addColorStop(1, "rgba(255, 143, 168, 0)");
  } else {
    blush.addColorStop(0, "rgba(240, 127, 147, 0.12)");
    blush.addColorStop(1, "rgba(240, 127, 147, 0)");
  }
  ctx.fillStyle = blush;
  ctx.fillRect(0, 0, size, size);
}

function getDownloadLayout(size) {
  const heartSize = size * 0.82;

  return {
    x: (size - heartSize) / 2,
    y: size * 0.045,
    size: heartSize,
    captionY: size * 0.918
  };
}

function drawHeartPath(ctx, layout) {
  const p = (value, axis = "x") => layout[axis] + (value / 100) * layout.size;
  ctx.beginPath();
  ctx.moveTo(p(50), p(94, "y"));
  ctx.bezierCurveTo(p(24), p(76, "y"), p(7), p(58, "y"), p(8), p(36, "y"));
  ctx.bezierCurveTo(p(9), p(16, "y"), p(29), p(8, "y"), p(50), p(28, "y"));
  ctx.bezierCurveTo(p(71), p(8, "y"), p(91), p(16, "y"), p(92), p(36, "y"));
  ctx.bezierCurveTo(p(93), p(58, "y"), p(76), p(76, "y"), p(50), p(94, "y"));
  ctx.closePath();
}

function drawDownloadCaption(ctx, size, layout) {
  const copy = state.copy || {};
  const label = copy.brandName || "cava";
  const lineGradient = ctx.createLinearGradient(size * 0.34, 0, size * 0.66, 0);

  ctx.save();
  lineGradient.addColorStop(0, "rgba(243, 198, 107, 0)");
  lineGradient.addColorStop(0.5, state.isNight ? "rgba(234, 214, 170, 0.48)" : "rgba(189, 139, 61, 0.42)");
  lineGradient.addColorStop(1, "rgba(243, 198, 107, 0)");
  ctx.fillStyle = lineGradient;
  ctx.fillRect(size * 0.34, layout.captionY - size * 0.048, size * 0.32, Math.max(2, size * 0.002));

  ctx.fillStyle = state.isNight ? "rgba(255, 248, 241, 0.72)" : "rgba(53, 33, 44, 0.58)";
  ctx.font = `700 ${Math.round(size * 0.028)}px Inter, "Microsoft YaHei", Arial, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, size / 2, layout.captionY, size * 0.68);
  ctx.restore();
}

function loadCanvasImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = "async";
    image.referrerPolicy = "no-referrer";
    if (!src.startsWith("data:")) {
      image.crossOrigin = "anonymous";
    }
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Image failed: ${src}`));
    image.src = src;
  });
}

function drawImageCover(ctx, image, x, y, width, height, focusX = 50, focusY = 50) {
  const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
  const drawWidth = image.naturalWidth * scale;
  const drawHeight = image.naturalHeight * scale;
  const offsetX = x + (width - drawWidth) * (focusX / 100);
  const offsetY = y + (height - drawHeight) * (focusY / 100);

  ctx.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
}

function roundedRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function openGallery(gallery) {
  state.currentGallery = gallery;
  state.currentIndex = Math.floor(Math.random() * state.photos[gallery].length);
  els.lightbox.hidden = false;
  document.body.classList.add("is-lightbox-open");
  updateLightbox();
}

function closeGallery() {
  els.lightbox.hidden = true;
  document.body.classList.remove("is-lightbox-open");
}

function moveGallery(direction) {
  const photos = state.photos[state.currentGallery];
  state.currentIndex = (state.currentIndex + direction + photos.length) % photos.length;
  updateLightbox();
}

function updateLightbox() {
  const photos = state.photos[state.currentGallery];
  const photo = photos[state.currentIndex];
  const copy = state.copy || {};

  els.lightboxImage.classList.remove("is-visible");
  window.setTimeout(() => {
    els.lightboxImage.src = photo.src;
    els.lightboxImage.alt = photo.alt;
    els.lightboxTitle.textContent = getLightboxTitle(state.currentGallery, copy);
    els.lightboxIndex.textContent = `${state.currentIndex + 1} / ${photos.length}`;
  }, 80);
}

function getLightboxTitle(gallery, copy) {
  if (gallery === "couple") return copy.lightboxCoupleTitle || "这一格，刚好有你们";
  if (gallery === "lava") return copy.lightboxLavaTitle || "FluorescentLava 的独照";
  return copy.lightboxCalebTitle || "Caleb 的独照";
}

els.lightboxImage.addEventListener("load", () => {
  els.lightboxImage.classList.add("is-visible");
});

function openAlbumViewer(gallery, sourceCard = null) {
  if (!els.albumViewer || !els.albumGalleryGrid) return;

  const nextGallery = galleryKeys.includes(gallery) && gallery !== "couple" ? gallery : "lava";
  const sourceRect = sourceCard ? sourceCard.getBoundingClientRect() : null;

  state.activeAlbumGallery = nextGallery;
  closeGallery();
  renderAlbumViewer(nextGallery);
  els.albumViewer.classList.remove("is-visible", "is-ready");
  els.albumViewer.classList.add("is-transitioning");
  if (els.albumCardStage) {
    els.albumCardStage.classList.add("is-pending");
    els.albumCardStage.classList.remove("is-flipped-in");
  }
  els.albumViewer.hidden = false;
  document.body.classList.add("is-album-open");
  void els.albumViewer.offsetWidth;

  window.requestAnimationFrame(() => {
    els.albumViewer.classList.add("is-visible");
    animateAlbumCardOpen(sourceCard, sourceRect, nextGallery);
  });
}

function closeAlbumViewer() {
  if (!els.albumViewer) return;
  els.albumViewer.hidden = true;
  document.body.classList.remove("is-album-open");
  els.albumViewer.classList.remove("is-visible", "is-ready", "is-transitioning");
  if (els.albumCardStage) {
    els.albumCardStage.classList.remove("is-pending", "is-flipped-in");
  }
  document.querySelectorAll(".album-card-transport").forEach((node) => node.remove());
  document.querySelectorAll(".tarot-card.is-transporting").forEach((node) => node.classList.remove("is-transporting"));
  state.activeAlbumGallery = "";
}

function animateAlbumCardOpen(sourceCard, sourceRect, gallery) {
  if (!els.albumCardStage) {
    finishAlbumCardOpen(sourceCard);
    return;
  }

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const targetRect = els.albumCardStage.getBoundingClientRect();

  if (!sourceCard || !sourceRect || reduceMotion || !document.body.animate) {
    finishAlbumCardOpen(sourceCard);
    return;
  }

  const transport = createAlbumCardTransport(sourceCard, gallery, sourceRect);
  const inner = transport.querySelector(".album-card-transport-inner");
  document.body.appendChild(transport);
  sourceCard.classList.add("is-transporting");

  const duration = 860;
  const easing = "cubic-bezier(0.2, 0.78, 0.22, 1)";
  const frameAnimation = transport.animate(
    [
      {
        left: `${sourceRect.left}px`,
        top: `${sourceRect.top}px`,
        width: `${sourceRect.width}px`,
        height: `${sourceRect.height}px`
      },
      {
        left: `${targetRect.left}px`,
        top: `${targetRect.top}px`,
        width: `${targetRect.width}px`,
        height: `${targetRect.height}px`
      }
    ],
    { duration, easing, fill: "forwards" }
  );

  const flipAnimation = inner.animate(
    [
      { transform: "rotateY(0deg)" },
      { transform: "rotateY(180deg)" }
    ],
    { duration, easing, fill: "forwards" }
  );

  Promise.allSettled([frameAnimation.finished, flipAnimation.finished]).then(() => {
    finishAlbumCardOpen(sourceCard);
    transport.classList.add("is-settling");
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => transport.remove());
    });
  });
}

function finishAlbumCardOpen(sourceCard) {
  if (sourceCard) sourceCard.classList.remove("is-transporting");
  if (els.albumViewer) {
    els.albumViewer.classList.remove("is-transitioning");
    els.albumViewer.classList.add("is-ready");
  }
  if (els.albumCardStage) {
    els.albumCardStage.classList.remove("is-pending");
  }
}

function createAlbumCardTransport(sourceCard, gallery, sourceRect) {
  const transport = document.createElement("div");
  const inner = document.createElement("div");
  const front = document.createElement("div");
  const back = document.createElement("div");
  const frontCard = sourceCard.cloneNode(true);
  const backImage = document.createElement("img");

  transport.className = `album-card-transport is-${gallery}`;
  transport.style.left = `${sourceRect.left}px`;
  transport.style.top = `${sourceRect.top}px`;
  transport.style.width = `${sourceRect.width}px`;
  transport.style.height = `${sourceRect.height}px`;
  inner.className = "album-card-transport-inner";
  front.className = "album-card-transport-face album-card-transport-front";
  back.className = "album-card-transport-face album-card-transport-back";
  frontCard.classList.remove("is-transporting", "is-flipping", "is-opening");
  frontCard.tabIndex = -1;
  frontCard.setAttribute("aria-hidden", "true");
  backImage.src = getTarotImage(gallery);
  backImage.alt = "";

  front.appendChild(frontCard);
  back.appendChild(backImage);
  inner.append(front, back);
  transport.appendChild(inner);

  return transport;
}

function renderAlbumViewer(gallery) {
  const photos = state.photos[gallery] && state.photos[gallery].length ? state.photos[gallery] : createFallbackPhotos(gallery);
  const copy = state.copy || {};
  const tarotImage = getTarotImage(gallery);
  const title = getPersonalAlbumTitle(gallery, copy);

  els.albumViewer.classList.toggle("is-lava", gallery === "lava");
  els.albumViewer.classList.toggle("is-caleb", gallery === "caleb");
  setText(els.albumGalleryTitle, title, gallery);
  setText(els.albumGalleryKicker, `${photos.length} 张照片`, "Cava Oracle");

  if (els.albumCardImage) {
    els.albumCardImage.src = tarotImage || "";
    els.albumCardImage.alt = `${title} tarot card`;
    els.albumCardImage.hidden = !tarotImage;
  }

  els.albumGalleryGrid.innerHTML = "";
  const fragment = document.createDocumentFragment();

  photos.forEach((photo, index) => {
    const figure = document.createElement("figure");
    const img = document.createElement("img");

    figure.className = `album-photo ${getAlbumPhotoShape(index)}`;
    figure.style.setProperty("--photo-delay", `${Math.min(240 + index * 36, 640)}ms`);
    img.src = photo.src;
    img.alt = photo.alt || `${title} photo ${index + 1}`;
    img.loading = index < 8 ? "eager" : "lazy";
    img.decoding = "async";
    img.addEventListener("load", () => figure.classList.add("is-loaded"), { once: true });
    img.addEventListener(
      "error",
      () => {
        img.src = createInlinePhoto(gallery, index, 860, 1120);
        figure.classList.add("is-loaded");
      },
      { once: true }
    );

    figure.appendChild(img);
    fragment.appendChild(figure);
  });

  els.albumGalleryGrid.appendChild(fragment);
}

function getAlbumPhotoShape(index) {
  const pattern = ["album-photo-tall", "", "album-photo-wide", "", "", "album-photo-tall", "", "album-photo-wide"];
  return pattern[index % pattern.length];
}

function getTarotImage(gallery) {
  const resources = state.tarotResources || {};
  if (gallery === "lava") return trim(resources.lavaCardFront || resources.lava || "");
  if (gallery === "caleb") return trim(resources.calebCardFront || resources.caleb || "");
  return "";
}

function getPersonalAlbumTitle(gallery, copy) {
  if (gallery === "lava") return copy.lavaCardTitle || "FluorescentLava";
  if (gallery === "caleb") return copy.calebCardTitle || "Caleb";
  return copy.brandName || "cava";
}

function updateMeter() {
  const count = state.currentCollage.photos.length || getCollageCount(getCollageSettings());
  setMeter(`${count} 张入画 · ${state.photos.couple.length} 张合照候选 · ${state.photos.lava.length + state.photos.caleb.length} 张专属预览`);
}

function setMeter(value) {
  if (els.photoMeter) {
    els.photoMeter.textContent = value;
  }
}

function shuffle(items) {
  const next = [...items];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }
  return next;
}

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

function clampInteger(value, min, max, fallback) {
  const parsed = Math.round(Number(value));
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

function trim(value) {
  return typeof value === "string" ? value.trim() : "";
}

function toCssUrl(value) {
  return `url("${String(value).replace(/"/g, "%22")}")`;
}
