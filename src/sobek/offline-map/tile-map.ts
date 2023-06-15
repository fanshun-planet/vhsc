import Konva from 'konva';
import { BMapUtil } from '@tile_lnglat_transform';
import { LazyMapLoader } from './lazy-map-loader';
import { MAP_LEVEL_RANGE, MAP_SCALE, TILE, MOUSE_BTN_SIGN, KEYBOARD_KEY } from 'src/utils/constants';
import { calc_view_rect } from 'src/utils/calc';
import { PipeTypes } from 'src/utils/enum';
import type { ITopoData, IPosRange, ICoorPos, IPipe, IPipeNode } from '../index';

export interface ITopoSketchMapConfig {
    // DOM容器元素的id
    // container_id: string;
    // 热力管网拓扑数据
    topo_data: ITopoData;
    // 瓦片地图资源的访问路径
    tile_map_resource_url: string;
    // 初始化的地图层级
    init_map_level?: number;
    // 初始化时的绘图区缩放值
    init_map_scale?: number;
    // konva中Stage类的配置对象
    map_stage_options: Konva.StageConfig;
    // 瓦片地图图层
    tile_layer_options?: Konva.LayerConfig;
    // 标注信息图层
    mark_layer_options?: Konva.LayerConfig;
}

/**
 * 瓦片地图绘图类
 * @class
 */
class TileMap {
    private config: ITopoSketchMapConfig;
    // 热力管网拓扑数据
    // private topo_data: ITopoData;
    // Konva Stage对象（layer的容器）
    private canvas_stage: Konva.Stage | null;
    // 瓦片地图专属图层
    private tile_map_layer: Konva.Layer | null;
    // 各类标注、标记的图层
    private mark_layer: Konva.Layer | null;
    // 懒加载模式下的瓦片地图
    private lazy_tile_map: LazyMapLoader | null;
    // 视图的方位坐标
    private rect: IPosRange;
    // 墨克托投影对象
    private mc_projection: BMapGL.MercatorProjection;
    // 地图层级
    private map_level: number;
    // 当前绘制出的整个视图的缩放值
    private map_scale: number;
    //
    private level_view_zoom: number;
    // 划线的宽度值
    // private stroke_line_width: number;
    // 瓦片地图视图可视区域的起始位置
    private view_starting_pos: ICoorPos;
    // 是否按下了鼠标左键
    private is_press_mouse_left_button: boolean;
    // 是否按下了鼠标滚轮
    private is_press_mouse_mid_button: boolean;
    // 是否按下了空格键
    private is_press_space_key: boolean;
    // 拖拽动作的相关信息
    private drag_action: { startX: number; startY: number; };
    // node_id: node的映射集合
    private node_id_2_node: Record<string, IPipeNode> | null;
    // node_id: pipes的映射集合
    private node_id_2_pipes: Record<string, IPipe[]> | null;
    // pipe_id: pipe的映射集合
    private pipe_id_2_pipe: Record<string, IPipe> | null;

    /**
     * 构造器
     * @constructor
     * @param config 
     */
    public constructor(config: ITopoSketchMapConfig) {
        this.config = config;
        // this.topo_data = config.topo_data;
        this.canvas_stage = null;
        this.tile_map_layer = null;        
        this.mark_layer = null;
        this.lazy_tile_map = null;
        this.rect = {
            min_x: Number.MAX_SAFE_INTEGER,
            min_y: Number.MAX_SAFE_INTEGER,
            max_x: 0,
            max_y: 0,
        };
        // @ts-ignore
        this.mc_projection = new BMapUtil.MercatorProjection();
        this.map_level = config.init_map_level ?? MAP_LEVEL_RANGE.default;
        this.map_scale = config.init_map_scale ?? MAP_SCALE.base;
        this.level_view_zoom = 2 ** (MAP_LEVEL_RANGE.default - MAP_LEVEL_RANGE.max - 1);
        this.view_starting_pos = { x: 0, y: 0 };
        this.is_press_mouse_left_button = false;
        this.is_press_mouse_mid_button = false;
        this.is_press_space_key = false;
        this.drag_action = { startX: 0, startY: 0 };
        this.node_id_2_node = {};
        this.node_id_2_pipes = {};
        this.pipe_id_2_pipe = {};
        this.init_canvas_stage_and_layers(config);
        this.init_topo_view(config.topo_data);
        this.init_stage_evts_pool();
    }

    /**
     * 初始化绘图区的stage和layer对象
     * @param config 
     */
    private init_canvas_stage_and_layers(config: ITopoSketchMapConfig) {
        const { map_stage_options, tile_layer_options, mark_layer_options } = config;
        if (!map_stage_options) {
            throw new TypeError('参数对象 map_stage_options 是必须的');
        }
        this.canvas_stage = new Konva.Stage(config.map_stage_options);
        this.tile_map_layer = new Konva.Layer(tile_layer_options ?? {});
        this.mark_layer = new Konva.Layer(mark_layer_options ?? {});
        this.canvas_stage.add(this.tile_map_layer);
        this.canvas_stage.add(this.mark_layer);
    }

    /**
     * 对图层进行绘制
     */
    private batch_draw_layer() {
        this.tile_map_layer?.batchDraw();
        this.mark_layer?.batchDraw();
    }

    /**
     * 经纬度信息转视图的通用位置
     * @param pos 
     */
    private lnglat_2_universal_pos(pos: ICoorPos) {
        // @ts-ignore
        const lnglat = new BMapUtil.Point(pos.x, pos.y);
        const res = this.mc_projection.lngLatToPoint(lnglat);
        return res;
    }

    /**
     * 
     * @param pos 
     */
    private lnglat_2_offset_pos(pos: ICoorPos) {
        const universal_pos = this.lnglat_2_universal_pos(pos);
        return {
            x: universal_pos.x - this.view_starting_pos.x,
            y: this.view_starting_pos.y - universal_pos.y,
        };
    }

    // private layer_pos_2_universal_pos(pos: ICoorPos) {
    //     return {
    //         x: pos.x / this.level_view_zoom,
    //         y: pos.y / this.level_view_zoom,
    //     };
    // }

    private offset_pos_2_layer_pos(pos: ICoorPos) {
        return {
            x: pos.x * this.level_view_zoom,
            y: pos.y * this.level_view_zoom,
        };
    }

    private lnglat_2_layer_pos(pos: ICoorPos) {
        const offset_pos = this.lnglat_2_offset_pos(pos);
        return this.offset_pos_2_layer_pos(offset_pos);
    }

    /**
     * 
     * @param level 
     * @todo 待调整
     */
    // private update_stroke_line_width(level: number) {
    //     if (level < 16) {
    //         this.stroke_line_width = 2;
    //     } else if (level > 14) {
    //         this.stroke_line_width = Math.pow(2, level - 16 + 1);
    //     } else {
    //         this.stroke_line_width = 1;
    //     }
    // }

    private update_view_level(cur_level: number) {
        if (this.lazy_tile_map) {
            this.lazy_tile_map.hide_level_tiles(cur_level);
        }
        this.map_level = cur_level;
        this.level_view_zoom = 2 ** (cur_level - MAP_LEVEL_RANGE.max - 1);
    }

    /**
     * 初始化拓扑视图
     * @param data 
     */
    private init_topo_view(data: ITopoData) {
        this.update_view_level(MAP_LEVEL_RANGE.default);
        const pipes = data.pipe;
        const nodes = data.node;
        const node_pos_list: ICoorPos[] = nodes.map(node => node['pos-3d']);
        this.rect = calc_view_rect(node_pos_list);
        const { min_x, max_y } = this.rect;
        this.view_starting_pos = this.lnglat_2_universal_pos({ x: min_x, y: max_y });
        // 初始化一些必要的辅助数据
        for (const node of nodes) {
            node['pos-offset'] = this.lnglat_2_offset_pos(node['pos-3d']);            
            this.node_id_2_node![node.guid] = node;
            this.node_id_2_pipes![node.guid] = [];
        }
        for (const pipe of pipes) {
            this.node_id_2_pipes![pipe.head].push(pipe);
            this.node_id_2_pipes![pipe.tail].push(pipe);
            this.pipe_id_2_pipe![pipe.guid] = pipe;
        }
        const map_resource_url = this.config.tile_map_resource_url;
        this.lazy_tile_map = new LazyMapLoader(map_resource_url, min_x, max_y);
        this.refresh_topo_view();
        this.batch_draw_layer();
    }

    /**
     * 刷新视图
     */
    private  refresh_topo_view() {
        this.tile_map_layer!.removeChildren();
        this.mark_layer!.removeChildren();
        this.render_tile_map();
        this.build_region_heating_network(this.config.topo_data);
    }

    /**
     * 渲染地图
     */
    private render_tile_map() {
        const cur_level = this.map_level;
        const { max, min } = MAP_LEVEL_RANGE;
        if (cur_level < min || cur_level > max) {
            console.warn('当前的地图层级设置已超出范围限制，当前层级：', cur_level);
            return;
        }
        // 每次渲染瓦片地图时都检查并更新下画布宽高
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        vw !== this.canvas_stage!.width() && this.canvas_stage!.width(vw);
        vh !== this.canvas_stage!.height() && this.canvas_stage!.height(vh);

        const per_tile_size = TILE.def_size * this.map_scale;
        const tile_map_layer = this.tile_map_layer!;
        const layer_pos = tile_map_layer.position();
        const start_tile_x = -Math.ceil(layer_pos.x / per_tile_size);
        const start_tile_y = -Math.ceil(layer_pos.y / per_tile_size);
        const row_cnt = vw / per_tile_size;
        const col_cnt = vh / per_tile_size;
        const end_tile_x = Math.ceil(start_tile_x + row_cnt * 2);
        const end_tile_y = Math.ceil(start_tile_y + col_cnt * 2);
        const lazy_tile_map = this.lazy_tile_map!;

        for (let y = start_tile_y - 1; y <= end_tile_y; y++) {
            for (let x = start_tile_x - 1; x <= end_tile_x; x++) {
                const map_img_slice = lazy_tile_map.get_tile_map_img(cur_level, x, y);
                if (map_img_slice) {
                    tile_map_layer.add(map_img_slice);
                    map_img_slice.setZIndex(0);
                }
            }
        }
    }

    /**
     * 构建当前地图的热力管网视图
     */
    public build_region_heating_network(data: ITopoData) {
        const pipes = data.pipe;
        const supply_pipes: IPipe[] = [];
        const return_pipes: IPipe[] = [];
        for (const pipe of pipes) {
            if (pipe.type === PipeTypes.supply) {
                supply_pipes.push(pipe);
            }
            else if (pipe.type === PipeTypes.return) {
                return_pipes.push(pipe);
            }
        }
        // const supply_pipe_group = new Konva.Group({ id: 'supply_pipe_group' });
        // const return_pipe_group = new Konva.Group({ id: 'return_pipe_group' });
        // this.build_supply_pipes_view(supply_pipes);
        this.build_return_pipes_view(return_pipes);
    }

    // private build_supply_pipes_view(pipes: IPipe[]) {
    //     const supply_pipe_group = new Konva.Group({ id: 'supply_pipe_group' });
    //     for (const p of pipes) {
    //         supply_pipe_group.add(this.create_pipe_line(p));
    //     }
    //     this.tile_map_layer?.add(supply_pipe_group);
    // } 

    private build_return_pipes_view(pipes: IPipe[]) {
        const return_pipe_group = new Konva.Group({ id: 'return_pipe_group' });
        for (const p of pipes) {
            return_pipe_group.add(this.create_pipe_line(p));
        }
        this.tile_map_layer?.add(return_pipe_group);
    }

    private create_pipe_line(pipe: IPipe) {
        const node_map = this.node_id_2_node!;
        const head_node = node_map[pipe['head']];
        const tail_node = node_map[pipe['tail']];
        const head_node_pos = this.offset_pos_2_layer_pos(head_node['pos-offset']);
        const tail_node_pos = this.offset_pos_2_layer_pos(tail_node['pos-offset']);
        const nav_pos_list = [];
        for (const p of pipe['nav-points']) {
            nav_pos_list.push(this.lnglat_2_layer_pos(p));
        }
        const pipe_node_pos_list = [head_node_pos, ...nav_pos_list, tail_node_pos  ];
        const line_path: number[] = [];
        for (const p of pipe_node_pos_list) {
            line_path.push(p.x, p.y);
        }
        const pipe_line = new Konva.Line({
            points: line_path,
            stroke: 'blue',
            strokeWidth: 2,
            lineCap: 'round',
            lineJoin: 'round',
        });
        return pipe_line;
    } 

    /**
     * 初始化各类事件的注册
     */
    private init_stage_evts_pool() {
        if (this.canvas_stage === null) {
            return;
        }
        const stage = this.canvas_stage;
        stage.on('wheel', this.on_scroll_mousewheel.bind(this));
        stage.on('mousemove', this.on_mouse_move.bind(this));
        stage.on('mousedown', this.on_mouse_down_container.bind(this));
        stage.on('mouseup', this.on_mouse_up_container.bind(this));
        stage.on('mouseleave', this.on_mouse_leave_container.bind(this));
        document.addEventListener('keydown', this.on_key_down_doc.bind(this));
        document.addEventListener('keyup', this.on_key_up_doc.bind(this));
        window.addEventListener('resize', this.on_view_resize.bind(this));
    }

    /**
     * 处理滚动鼠标滚轮的事件
     * @param event 
     */
    private on_scroll_mousewheel(event: Konva.KonvaEventObject<WheelEvent>) {
        const evt = event.evt;
        this.on_vertical_wheel(evt.deltaY);
    }

    /**
     * 当纵向滚动鼠标滚轮时
     * @param dy 
     */
    private on_vertical_wheel(dy: number) {
        const cur_level = this.map_level;
        const scale = this.map_scale;
        const new_scale = scale * (dy > 0 ? MAP_SCALE.ratio : 1 / MAP_SCALE.ratio);
        //
        if (new_scale > MAP_SCALE.upper && cur_level + 1 > MAP_LEVEL_RANGE.max) {
            return;
        }
        //
        if (new_scale < MAP_SCALE.lower && cur_level - 1 < MAP_LEVEL_RANGE.min) {
            return;
        }
        const stage = this.canvas_stage!;
        const layer = this.tile_map_layer!;
        const pointer_pos = stage.getPointerPosition()!;
        const ratio = new_scale / scale;
        // 
        const scale_ref_start_pos = {
            x: pointer_pos.x - (pointer_pos.x - layer.x()) * ratio,
            y: pointer_pos.y - (pointer_pos.y - layer.y()) * ratio,
        };
        this.tile_map_layer?.position(scale_ref_start_pos);

        if (new_scale > MAP_SCALE.upper) {
            const new_level = cur_level + 1 > MAP_LEVEL_RANGE.max ? cur_level : cur_level + 1;
            this.update_view_level(new_level);
            this.map_scale = new_scale / 2;
            this.refresh_topo_view();
        }
        else if (new_scale < MAP_SCALE.lower) {
            const new_level = cur_level - 1 < MAP_LEVEL_RANGE.min ? cur_level : cur_level - 1;
            this.update_view_level(new_level);
            this.map_scale = new_scale * 2;
            this.refresh_topo_view();
        }
        else {
            this.map_scale = new_scale;
            this.render_tile_map();
        }
        this.tile_map_layer?.scale({ x: this.map_scale, y: this.map_scale });
        this.batch_draw_layer(); 
    }

    /**
     * 是否触发了拖拽浏览模式
     */
    private is_trigger_drag_browse_mode() {
        return this.is_press_mouse_mid_button || (this.is_press_space_key && this.is_press_mouse_left_button);
    }

    /**
     * 切换拖拽浏览时页面样式
     */
    private toggle_drag_browse_style() {
        if (this.is_trigger_drag_browse_mode()) {
            document.body.style.setProperty('cursor', 'grab');
        }
        else {
            document.body.style.removeProperty('cursor');
        }
    }

    /**
     * 当做出基础的鼠标按键操作时
     * @param button_sign 
     * @param flag 
     */
    private on_mouse_btn_action(button_sign: number, flag: boolean) {
        if (button_sign === MOUSE_BTN_SIGN.left_btn) {
            this.is_press_mouse_left_button = flag;
        }
        else if (button_sign === MOUSE_BTN_SIGN.mid_wheel) {
            this.is_press_mouse_mid_button = flag;
        }
        this.toggle_drag_browse_style();
    }

    /**
     * 处理canvas容器元素上的鼠标键按下事件
     * @param event 
     */
    private on_mouse_down_container(event: Konva.KonvaEventObject<MouseEvent>) {
        const evt = event.evt;
        this.drag_action.startX = evt.clientX;
        this.drag_action.startY = evt.clientY;
        this.on_mouse_btn_action(evt.button, true);
    }

    /**
     * 处理canvas容器元素上的鼠标键按下事件
     * @param event 
     */
    private on_mouse_up_container(event: Konva.KonvaEventObject<MouseEvent>) {
        const evt = event.evt;
        this.drag_action.startX = evt.clientX;
        this.drag_action.startY = evt.clientY;
        this.on_mouse_btn_action(evt.button, false);
    }

    /**
     * 当鼠标离开canvas容器元素区域
     */
    private on_mouse_leave_container() {
        this.is_press_mouse_left_button && (this.is_press_mouse_left_button = false);
        this.is_press_mouse_mid_button && (this.is_press_mouse_mid_button = false);
    }

    /**
     * 处理鼠标移动时的相关副作用
     * @param event 
     */
    private on_mouse_move(event: Konva.KonvaEventObject<MouseEvent>) {
        const evt = event.evt;
        if (this.is_trigger_drag_browse_mode()) {
            const dx = evt.clientX - this.drag_action.startX;
            const dy = evt.clientY - this.drag_action.startY;
            const map_layer = this.tile_map_layer!;
            map_layer.x(map_layer.x() + dx);
            map_layer.y(map_layer.y() + dy);
            this.render_tile_map();
            this.drag_action.startX = evt.clientX;
            this.drag_action.startY = evt.clientY;  
        }
    }

    /**
     * 处理document内的键盘按键的按下事件
     * @param event 
     */
    private on_key_down_doc(event: KeyboardEvent) {
        const key = event.key.toLowerCase();
        if (key === KEYBOARD_KEY.space) {
            this.is_press_space_key = true;
        }
        this.toggle_drag_browse_style();
    }

    /**
     * 处理document内的键盘按键的释放事件
     * @param event 
     */
    private on_key_up_doc(event: KeyboardEvent) {
        const key = event.key.toLowerCase();
        if (key === KEYBOARD_KEY.space) {            
            this.is_press_space_key = false;
        }
        this.toggle_drag_browse_style();
    }

    /**
     * 处理视图窗口尺寸变化的副作用
     */
    private on_view_resize() {
        this.refresh_topo_view();
        this.batch_draw_layer();
    }
}

export { TileMap };