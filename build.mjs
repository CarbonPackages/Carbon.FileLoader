import esbuild from 'esbuild';

const options = {
    logLevel: 'info',
    sourcemap: false,
    entryPoints: ['Resources/Private/Assets/*.ts'],
    target: 'es2020',
    format: 'esm',
    bundle: true,
    outdir: 'Resources/Public/Modules',
    minify: false,
};

const minOptions = {
    ...options,
    minify: true,
    outExtension: { '.js': '.min.js' },
};

async function watch(options) {
    const context = await esbuild.context(options);
    await context.watch();
}

[options, minOptions].forEach((options) => {
    process.argv.includes('--watch') ? watch(options) : esbuild.build(options);
});
