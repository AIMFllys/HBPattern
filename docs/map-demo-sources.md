# 3D 文化地图 Demo 数据来源说明

本 Demo 阶段不调用高德地图 API，也不请求在线地图瓦片。地图页使用本地化后的简化湖北省矢量轮廓、城市点位和关键文化地点数据。

## 湖北省轮廓

- 来源：geoBoundaries CHN ADM1 simplified boundary
- API：https://www.geoboundaries.org/api/current/gbOpen/CHN/ADM1/
- 几何文件：https://github.com/wmgeolab/geoBoundaries/raw/9469f09/releaseData/gbOpen/CHN/ADM1/geoBoundaries-CHN-ADM1_simplified.geojson
- 使用对象：`shapeName = Hubei Province`
- 许可：Public Domain
- 本地化方式：提取湖北省 Polygon 后按经纬度 bbox 投影到 `0..100` 的 SVG viewBox，并写入 `src/data/map/hubei.ts`。

## 区域与地点

- Demo 覆盖湖北 17 个地级/省直管区域：武汉、黄石、十堰、宜昌、襄阳、鄂州、荆门、孝感、荆州、黄冈、咸宁、随州、恩施州、仙桃、潜江、天门、神农架林区。
- 每个区域保留 2-3 个关键地点，用于地图缩放阈值、纹样绑定和本地 Demo 上传分析。
- 点位经纬度用于 Demo 交互展示，不作为正式测绘数据发布。

## DataV 参考边界

DataV GeoAtlas 可作为 UI 原型参考，但官方文档说明其地理边界数据来自高德开放平台。本 Demo 运行时不请求 DataV 或高德资源。
