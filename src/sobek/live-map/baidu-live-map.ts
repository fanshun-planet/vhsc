import type { ITopoData } from '../index';

export interface IBaiduLiveMapConfig {
    // DOM容器元素的id
    container_id: string;
    // baidu GL 地图脚本标签的id属性值（可选）
    sdk_script_id?: string;
    // 地图视图的中心点坐标
    center_point_coord: [number, number];
    // 热力管网拓扑数据
    topo_data: ITopoData;
}

class BaiduLiveMap {
    // 实例的配置参数
    private config: IBaiduLiveMapConfig;
    // 百度地图实例
    private b_map_instance: BMapGL.Map | null;

    constructor(config: IBaiduLiveMapConfig) {
        this.config = config;
        this.b_map_instance = null;
    }

    get bmap() {
        return this.b_map_instance;
    }
 
    /**
     * 异步注入并加载百度地图sdk脚本
     * @param access_key 
     */
    public inject_baidu_gl_map_defer_script(access_key: string) {
        if (typeof access_key !== 'string' || access_key.length === 0) {
            throw new TypeError('ak密钥不正确！');
        }
        if (!document.head || !document.head.appendChild) {
            throw new ReferenceError('无法完成关键脚本的挂载操作！');
        }
        const script = document.createElement('script');
        const src = `http://api.map.baidu.com/api?type=webgl&v=1.0&ak=${access_key}&callback=init`;
        if (this.config.sdk_script_id) {
            script.setAttribute('id', this.config.sdk_script_id);
        }
        script.defer = true;
        script.src = src;
        document.head.appendChild(script);

        return new Promise((resolve, reject) => {
            script.onload = (e) => {
                // @ts-ignore
                console.log('script loaded', e, window.Sobek);
                resolve(e)
            };
            script.onerror = () => {
                reject();
            };
        });
    }
}

export { BaiduLiveMap }