export interface IBaiduLiveMapConfig {
    // baidu GL 地图脚本标签的id属性值（可选）
    sdk_script_id?: string;
    // 百度地图开发者账号的KEY
    access_key: string;
}

/**
 * 百度线上地图辅助类
 * @class
 */
class BaiduLiveMap {
    // 实例的配置参数
    private config: IBaiduLiveMapConfig;

    /**
     * 构造器
     * @constructor
     * @param config 
     */
    public constructor(config: IBaiduLiveMapConfig) {
        this.config = config;
    }
 
    /**
     * 异步注入并加载百度地图sdk脚本
     * @param access_key 
     */
    private inject_baidu_gl_map_defer_script(access_key: string, script_id?: string): Promise<Event> {
        if (typeof access_key !== 'string' || access_key.length === 0) {
            throw new TypeError('ak密钥参数不正确！');
        }
        if (!document.head || !document.head.appendChild) {
            throw new ReferenceError('无法完成关键脚本的挂载操作！');
        }
        const script = document.createElement('script');
        const src = `http://api.map.baidu.com/api?type=webgl&v=1.0&ak=${access_key}`;
        if (script_id) {
            script.setAttribute('id', script_id);
        }
        script.src = src;
        document.body.appendChild(script);

        return new Promise((resolve, reject) => {
            script.onload = (e) => {
                resolve(e);
            };
            script.onerror = () => {
                reject();
            };
        });
    }

    /**
     * 启动函数
     * @returns 
     */
    public init() {
        const { access_key, sdk_script_id } = this.config;
        const skd_injected_result = this.inject_baidu_gl_map_defer_script(access_key, sdk_script_id);
        return skd_injected_result;
    }
}

export { BaiduLiveMap };