declare module '@tile_lnglat_transform' {
    // [Type]百度地图数据转换对象
    interface ITileLnglatTransformBaidu {
        /** 经纬度坐标转瓦片坐标 */
        lnglatToTile(longitude: number, latitude: number, level: number): { tileX: number; tileY: number; };
        /** 经纬度坐标转像素坐标 */
        lnglatToPixel(longitude: number, latitude: number, level: number): { pixelX: number; pixelY: number; };
        /** 瓦片上的某一像素点坐标转经纬度坐标 */
        pixelToLnglat(pixelX: number, pixelY: number, tileX: number, tileY: number, level: number): { lng: number; lat: number; };
        /** 经纬度坐标转平面坐标 */
        lnglatToPoint(longitude: number, latitude: number): { pointX: number; pointY: number };
        /** 平面坐标转经纬度坐标 */
        pointToLnglat(pointX: number, pointY: number): { lng: number; lat: number; };
    }

    interface IBMapUtil {
        MercatorProjection: BMapGL.MercatorProjection;
        Point: BMapGL.Point;
        Pixel: BMapGL.Pixel;
    }

    // 百度地图数据转换对象
    const BaiduTileMapLnglatTransformer: ITileLnglatTransformBaidu;
    // 百度地图位置转换工具
    const BMapUtil: IBMapUtil;
}