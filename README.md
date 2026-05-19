# cava 520

FluorescentLava 和 Caleb 专属的 520 H5 相册页。页面先展示一句“Hi，老公。”，滑动后进入相册内容页；默认白天模式，可切换入夜；合照会随机抽取 8-16 张生成漫画分镜式爱心拼图，并支持下载当前拼图。

纪念日固定写在页面逻辑中：`2026.3.6`。内容页会自动显示“今天是我们交往的第 n 天”；如果当天是 5 月 20 日，主页会额外显示“今天是我们一起度过的第 n 个520~”。

## 本地预览

直接用 HBuilderX 打开本目录，运行 `index.html` 即可。

也可以在目录内启动静态服务器后访问：

```bash
python -m http.server 5173
```

## 图片接入

推荐用七牛云 Kodo 做国内图床：创建公开读空间，把照片按 `couple/`、`lava/`、`caleb/` 三个目录上传，再上传一个 `album.json` 相册清单。页面端只读取公开图片和公开 JSON，不要把七牛 AccessKey / SecretKey 放到前端代码里。

编辑 [src/config.js](src/config.js)，优先把 `manifestUrl` 指向公开可访问的 `album.json`：

- `galleries.couple`：两个人的合照，用来生成爱心拼图。
- `galleries.lava`：FluorescentLava 的单人照。
- `galleries.caleb`：Caleb 的单人照。
- `albumApiUrl`：可选，填写公开 API 地址；支持 `data`、`items`、`list`、`files`、`resources` 等常见列表字段，也能读取 COS/S3 风格 XML 列表。
- `albumBaseUrl`：当 API 只返回 `couple/photo-01.jpg` 这类 key/path 时，填写图片 CDN 根地址。
- `albumFolders`：用文件夹名自动归类 API 图片，默认识别 `couple`、`lava`、`caleb`，也支持“合照”等常见中文命名。
- `collage.minPanels` / `collage.maxPanels`：每次拼图随机选取照片数量，建议 8-16。
- `collage.panelCount`：需要固定数量时填写 8-16；保持 `null` 就每次随机。
- `tarotResources.lavaCardFront` / `tarotResources.calebCardFront`：两张塔罗牌卡面图。

JSON 格式参考 [album-manifest.sample.json](album-manifest.sample.json)。

## 部署建议

源码放 GitHub 私有仓库，GitHub Pages 发布公开网页。照片不建议放仓库里，建议放七牛云、腾讯云 COS 或阿里云 OSS，再由页面运行时读取公开图片列表。

如果要使用“下载拼图”，图片源需要允许跨域读取，也就是图床需要返回可用的 CORS 响应头；否则浏览器会出于安全限制阻止 canvas 导出。
