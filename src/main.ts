import type { IBaiduLiveMapConfig } from './sobek/live-map/baidu-live-map';
import type { IMapMode } from './sobek';
import { MapModeEnum } from './utils/enum';
import { BaiduLiveMap, TileMap } from './sobek';

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

    public use_offline_map() {
        this._map_mode = MapModeEnum.Offline;
        return new TileMap();
    }
}

export default SobekVHSC; 