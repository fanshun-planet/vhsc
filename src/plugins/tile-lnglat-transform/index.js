import TransformClassBaidu from './transformer-for-baidu-map.min';
import BmapUtil from './sdk.min';


const BaiduMapLevelRange = {
    min: 3,
    max: 18,
};
const TileLnglatTransformBaidu = new TransformClassBaidu(BaiduMapLevelRange.max, BaiduMapLevelRange.min);

export {
    TileLnglatTransformBaidu as BaiduTileMapLnglatTransformer,
    BmapUtil,
};