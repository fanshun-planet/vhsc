import Konva from 'konva';
import * as TileLnglatTransform from '@tile_lnglat_transform';
import { TILE, MAP_LEVEL_RANGE } from 'src/utils/constants';

// 百度地图位置信息的转换对象
const BaiduMapTransformer = TileLnglatTransform.BaiduTileMapLnglatTransformer;

/**
 * 瓦片地图懒加载工具类
 * @class
 */
class LazyMapLoader {
    // 离线地图资源的基础路由前缀
    public readonly map_resource_base_url: string;
    // 各层级瓦片地图所对应的图片映射
    private level_tile_imgs_dict: Record<number, Record<number, Record<number, Konva.Image>>>;
    // 各层级瓦片地图图片的地理空间位置信息
    private level_tiles_lng_lat_starting_info: Record<number, { tileX: number; tileY: number; }>;
    // 各层级瓦片地图图片的页面位置信息
    private level_tiles_pixel_starting_info: Record<number, { pixelX: number; pixelY: number; }>;
    // 瓦片图的默认占位图片
    private def_tile_holder_image: HTMLImageElement;

    /**
     * 构造器
     * @constructor
     * @param {string} url
     * @param {number} lng
     * @param {number} lat
     */
    public constructor(url: string, lng: number, lat: number) {
        this.map_resource_base_url = url;
        this.level_tile_imgs_dict = {};
        this.level_tiles_lng_lat_starting_info = {};
        this.level_tiles_pixel_starting_info = {};
        this.def_tile_holder_image = this.init_tile_def_holder_image();
        this.init_level_tiles_starting_pos(lng, lat);
    }

    /**
     * 为瓦片地图图片初始化默认的占位图
     */
    private init_tile_def_holder_image(): HTMLImageElement {
        const canvas = document.createElement('canvas');
        const def_size = TILE.def_size;
        canvas.width = def_size;
        canvas.height = def_size;
        const ctx = canvas.getContext('2d')!;
        ctx.fillStyle = TILE.bg_color;
        ctx.fillRect(0, 0, def_size, def_size);
        const def_image = new Image();
        def_image.setAttribute('src', canvas.toDataURL());
        return def_image;
    }

    /**
     * 初始化各层级瓦片地图的起始坐标位置
     * @param {number} lng - 经度 
     * @param {number} lat - 纬度
     */
    private init_level_tiles_starting_pos(lng: number, lat: number) {
        const start = MAP_LEVEL_RANGE.min;
        const end = MAP_LEVEL_RANGE.max;
        for (let level = start; level <= end; level++) {
            this.level_tiles_lng_lat_starting_info[level] = BaiduMapTransformer.lnglatToTile(lng, lat, level);
            this.level_tiles_pixel_starting_info[level] = BaiduMapTransformer.lnglatToPixel(lng, lat, level);
        }
    }

    /**
     * 获取当前层级特定位置的瓦片地图切片
     * @param {number} cur_level 
     * @param {number} x 
     * @param {number} y 
     */
    public get_tile_map_img(cur_level: number, x: number, y: number): Konva.Image | null {
        if (!this.map_resource_base_url) {
            return null;
        }
        if (cur_level > MAP_LEVEL_RANGE.max || cur_level < MAP_LEVEL_RANGE.min) {
            return null;
        }
        if (!this.level_tile_imgs_dict[cur_level]) {
            this.level_tile_imgs_dict[cur_level] = {};
        }
        const level_tile_imgs = this.level_tile_imgs_dict[cur_level];
        const tx = this.level_tiles_lng_lat_starting_info[cur_level].tileX + x;
        const ty = this.level_tiles_lng_lat_starting_info[cur_level].tileY - y;
        if (!level_tile_imgs[tx]) {
            level_tile_imgs[tx] = {};
        }
        const cur_x_pos_tile_collection = level_tile_imgs[tx];
        let cur_x_y_pos_tile = cur_x_pos_tile_collection[ty];
        // 如果当前(x, y)坐标下对象的tile图片对象尚不存在，则进行创建
        // 创建出的图片被添加进canvas中绘制后就会被展示
        if (!cur_x_y_pos_tile) {
            const img_src = this.map_resource_base_url + `/${cur_level}/${tx}/${ty}.jpg`;
            const def_size = TILE.def_size;
            const cur_tile_pixel_pos = this.level_tiles_pixel_starting_info[cur_level];
            const kn_img = new Konva.Image({
                image: this.def_tile_holder_image,
                width: def_size,
                height: def_size,
                x: def_size * x - cur_tile_pixel_pos.pixelX,
                y: def_size * (y - 1) + cur_tile_pixel_pos.pixelY,
            });
            const native_img = new Image();
            native_img.onload = function() {
                kn_img.image(native_img);
            };
            native_img.onerror = function() {
                console.warn(`图片${tx}/${ty}.jpg 加载失败！`);
            };
            native_img.setAttribute('src', img_src);
            cur_x_pos_tile_collection[ty] = kn_img;
            cur_x_y_pos_tile = cur_x_pos_tile_collection[ty];
        }
        // 如果当前位置坐标下的tile图片存在但不可见（被隐藏）
        // 则需将其设为可见
        if (!cur_x_y_pos_tile.isVisible()) {
            cur_x_y_pos_tile.show();
        }
        return cur_x_y_pos_tile;
    }

    /**
     * 隐藏当前层级的所有的地图瓦片
     * @param {number} cur_level 
     */
    public hide_level_tiles(cur_level: number) {
        if (this.level_tile_imgs_dict[cur_level]) {
            const level_tile_imgs = this.level_tile_imgs_dict[cur_level];
            const x_vals = Object.keys(level_tile_imgs);
            const n = x_vals.length;
            for (let i = 0; i < n; i++) {
                const tiles = Object.values(level_tile_imgs[+x_vals[i]]);
                for (const tile of tiles) {
                    tile.hide();
                }
            }
        }
    }
}

export { LazyMapLoader };