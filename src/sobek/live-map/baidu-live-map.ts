export interface IBaiduLiveMapConfig {
    // baidu GL 地图脚本标签的id属性值（可选）
    sdk_script_id?: string;
}

/**
 * 百度线上地图辅助类
 * @class
 */
class BaiduLiveMap {
    // 实例的配置参数
    private config?: IBaiduLiveMapConfig;

    /**
     * 构造器
     * @constructor
     * @param config 
     */
    public constructor(config: IBaiduLiveMapConfig = {}) {
        this.config = config;
    }
 
    /**
     * 异步注入并加载百度地图sdk脚本
     * @param access_key 
     */
    public inject_baidu_gl_map_defer_script(access_key: string): Promise<Event> {
        if (typeof access_key !== 'string' || access_key.length === 0) {
            throw new TypeError('ak密钥不正确！');
        }
        if (!document.head || !document.head.appendChild) {
            throw new ReferenceError('无法完成关键脚本的挂载操作！');
        }
        const script = document.createElement('script');
        const src = `http://api.map.baidu.com/api?type=webgl&v=1.0&ak=${access_key}&callback=init`;
        if (this.config?.sdk_script_id) {
            script.setAttribute('id', this.config.sdk_script_id);
        }
        script.defer = true;
        script.src = src;
        document.head.appendChild(script);

        const MAX_TRY_CNT = 10;
        let try_cnt = 0;
        const check_bmap_available = (resolve: (value: Event | PromiseLike<Event>) => void, ev: Event) => {
            if (BMapGL && BMapGL.Map) {
                resolve(ev);
            }
            else {
                if (try_cnt++ < MAX_TRY_CNT) {
                    setTimeout(() => {
                        check_bmap_available(resolve, ev);
                    });
                }
            }
        };

        return new Promise((resolve, reject) => {
            script.onload = (e) => {
                check_bmap_available(resolve, e);
            };
            script.onerror = () => {
                reject();
            };
        });
    }
}

export { BaiduLiveMap };