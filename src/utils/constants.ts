/**
 * 常用的地图缩放数值
 */
export const MAP_SCALE = {
    // 缩放上限
    upper: 2,
    // 缩放下限
    lower: .5,
    // 缩放初始值
    base: 1,
    // 每次执行缩放的变化比率
    ratio: .9,
};

/**
 * 地图层级的范围
 */
export const MAP_LEVEL_RANGE = {
    max: 17,
    min: 12,
    // 默认使用的图层级别
    default: 15,
};

/**
 * 瓦片地图的基础信息
 */
export const TILE = {
    def_size: 256,
    bg_color: '#fefefe',
    line_width: 1,
};

/**
 * 鼠标按键的标记号（与event.button一致）
 */
export const MOUSE_BTN_SIGN = {
    left_btn: 0,
    mid_wheel: 1,
    right_btn: 2,
};

/**
 * 键盘按键的特定字符
 */
export const KEYBOARD_KEY = {
    escape: 'escape',
    space: ' ',
};