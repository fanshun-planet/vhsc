import node_resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser';
import alias from '@rollup/plugin-alias';
import del from 'rollup-plugin-delete';

const common_plugins = [
    node_resolve(),
    commonjs(),
    typescript({
        tsconfig: './tsconfig.json',
    }),
    alias({
        entries: [
            {
                find: '@tile_lnglat_transform',
                replacement: 'src/plugins/tile-lnglat-transform/index.js',
            },
        ],
    }),
    del({
        targets: ['lib/**/*'],
    }),
    terser(),
];

export default {
    input: 'src/main.ts',
    output: [
        {
            file: 'lib/main.umd.min.js',
            format: 'umd',
            name: 'SobekVHSC',
            entryFileNames: '[name].umd.min.js',
            globals: {
                konva: 'Konva',
            },
        },
        {
            file: 'lib/main.esm.min.js',
            format: 'esm',
            entryFileNames: '[name].esm.min.js',
            globals: {
                konva: 'Konva',
            },
        },
    ],
    plugins: [
        ...common_plugins,
    ],
    external: ['konva'],
}