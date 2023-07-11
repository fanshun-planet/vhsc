import type { IBaiduLiveMapConfig } from './sobek/live-map/baidu-live-map';
import type { ITopoSketchMapConfig } from './sobek/offline-map/tile-map';
import type { IMapMode } from './sobek/index';
import { MapModeEnum } from './utils/enum';
import { BaiduLiveMap, TileMap } from './sobek/index';

class SobekVHSC {
    // 地图模式（在线/离线）
    private _map_mode?: IMapMode;

    /**
     * 构造器
     */
    public constructor() {}

    get map_mode() {
        return this._map_mode;
    }

    public use_online_map(config: IBaiduLiveMapConfig) {
        this._map_mode = MapModeEnum.Online;
        return new BaiduLiveMap(config);
    }

    public use_offline_map(config: ITopoSketchMapConfig) {
        this._map_mode = MapModeEnum.Offline;
        return new TileMap(config);
    }
}

export default SobekVHSC; 