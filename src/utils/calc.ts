import type { ICoorPos } from '../sobek/index';

/**
 * 
 * @param coors - 位置的坐标信息集
 */
export function calc_view_rect(coors: ICoorPos[]) {
    const n = coors.length;
    let min_x = coors[n - 1]['x'];
    let min_y = coors[n - 1]['y'];
    let max_x = min_x;
    let max_y = min_y;

    for (let i = n - 2; i >= 0; i--) {
        const { x, y } = coors[i];
        min_x = Math.min(min_x, x);
        min_y = Math.min(min_y, y);
        max_x = Math.max(max_x, x);
        max_y = Math.max(max_y, y);
    }

    return {
        min_x,
        min_y,
        max_x,
        max_y,
    };
}