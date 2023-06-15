import { BaiduLiveMap } from './live-map/baidu-live-map';
import { TileMap } from './offline-map/tile-map';

export type IPipeTypes = 'supply' | 'return' | 'device';

export interface ICoorPos {
    x: number;
    y: number;
}

export interface IThreeDPos extends ICoorPos {
    z: number;
}

export interface IPosRange {
    min_x: number;
    min_y: number;
    max_x: number;
    max_y: number;
}


export interface IPipe {
    guid: string;
    head: string;
    tail: string;
    type: IPipeTypes;
    'nav-points': IThreeDPos[];
    attrs: Record<string, any>;
}

export interface IPipeNode {
    guid: string;
    'pos-3d': IThreeDPos;
    'pos-offset': ICoorPos;
    attrs: Record<string, any>;
}

interface ISubstation {
    guid: string;
    'display-name': string;
    'device-type': string;
    binds: string[];
    attrs: Record<string, any>;
    pipe: IPipe[];
}

interface IHeatSource extends ISubstation {}

interface IDevice {
    'heat-source': IHeatSource[];
    substation: ISubstation[];
}

interface IExtraInfo {
    'static-pressure': {
        location: string;
        value: number;
    };
}

export interface ITopoData {
    pipe: IPipe[];
    node: IPipeNode[];
    device: IDevice;
    'extra-info': IExtraInfo;
    'data-id': string;
    'file-name': string;
}

export type IMapMode = 'online' | 'offline';


export {
    BaiduLiveMap,
    TileMap,
}