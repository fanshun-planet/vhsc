import node_resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import del from 'rollup-plugin-delete';
import terser from '@rollup/plugin-terser';

const common_plugins = [
    node_resolve(),
    commonjs(),
    typescript({
        tsconfig: './tsconfig.json',
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
        },
        {
            file: 'lib/main.esm.min.js',
            format: 'esm',
            entryFileNames: '[name].esm.min.js',
        },
    ],
    plugins: [
        ...common_plugins,
    ],
}