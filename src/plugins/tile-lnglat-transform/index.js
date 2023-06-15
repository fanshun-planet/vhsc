import TransformClassBaidu from './transformer-for-baidu-map.min';
import BMapUtil from './sdk.min';


const BaiduMapLevelRange = {
    min: 3,
    max: 18,
};
const TileLnglatTransformBaidu = new TransformClassBaidu(BaiduMapLevelRange.max, BaiduMapLevelRange.min);

export {
    TileLnglatTransformBaidu as BaiduTileMapLnglatTransformer,
    BMapUtil,
};