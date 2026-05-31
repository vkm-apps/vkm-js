const { writeToPackageDotJson } = require('./utils');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const esbuild = require('esbuild');

// Auto-detect all packages in ./packages with a builds folder
const packages = fs.readdirSync('./packages').filter(dir =>
    fs.existsSync(`./packages/${dir}/builds`)
);

async function buildAll() {
    for (const pkg of packages) {
        const distPath = `./packages/${pkg}/dist`;
        if (!fs.existsSync(distPath)) {
            fs.mkdirSync(distPath, { mode: 0o744, recursive: true });
        }

        const files = fs.readdirSync(`./packages/${pkg}/builds`);
        for (const file of files) {
            await bundleFile(pkg, file);
        }
    }
}

async function bundleFile(packageName, file) {
    const inputPath = `packages/${packageName}/builds/${file}`;
    const distPath = `packages/${packageName}/dist`;

    const buildTypes = {
        'cdn.js': async () => {
            // Non-minified
            await build({
                entryPoints: [inputPath],
                outfile: `${distPath}/${file}`,
                bundle: true,
                platform: 'browser',
                define: { CDN: 'true' },
            });

            // Minified
            await build({
                entryPoints: [inputPath],
                outfile: `${distPath}/${file.replace('.js', '.min.js')}`,
                bundle: true,
                minify: true,
                platform: 'browser',
                define: { CDN: 'true' },
            });

            outputSize(packageName, `${distPath}/${file.replace('.js', '.min.js')}`);
        },

        'module.js': async () => {
            // ESM
            await build({
                entryPoints: [inputPath],
                outfile: `${distPath}/${file.replace('.js', '.esm.js')}`,
                bundle: true,
                platform: 'neutral',
                mainFields: ['module', 'main'],
            });

            // CommonJS
            await build({
                entryPoints: [inputPath],
                outfile: `${distPath}/${file.replace('.js', '.cjs.js')}`,
                bundle: true,
                target: ['node10.4'],
                platform: 'node',
            });

            writeToPackageDotJson(packageName, 'main', `dist/${file.replace('.js', '.cjs.js')}`);
            writeToPackageDotJson(packageName, 'module', `dist/${file.replace('.js', '.esm.js')}`);
        },
    };

    if (buildTypes[file]) {
        await buildTypes[file]();
    } else {
        console.warn(`⚠️ Unknown build file type: ${file} (skipped)`);
    }
}

async function build(options) {
    options.define = options.define || {};
    options.define['process.env.NODE_ENV'] = process.argv.includes('--watch') ? `'development'` : `'production'`;

    const isWatch = process.argv.includes('--watch');

    try {
        const ctx = await esbuild.context({
            logLevel: isWatch ? 'info' : 'silent',
            ...options,
        });

        if (isWatch) {
            await ctx.watch();
        } else {
            await ctx.rebuild();
            await ctx.dispose();
        }
    } catch (err) {
        console.error('Build failed:', err);
        process.exit(1);
    }
}

function outputSize(packageName, file) {
    try {
        const fileBuffer = fs.readFileSync(file);
        const compressed = zlib.brotliCompressSync(fileBuffer);
        const size = bytesToSize(compressed.length);
        console.log(`\x1b[32m✔ ${packageName}: ${path.basename(file)} = ${size}`);
    } catch (err) {
        console.error(`Failed to read or compress file ${file}:`, err);
    }
}

function bytesToSize(bytes) {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return 'n/a';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    if (i === 0) return `${bytes} ${sizes[i]}`;
    return `${(bytes / (1024 ** i)).toFixed(1)} ${sizes[i]}`;
}

module.exports = buildAll;

if (require.main === module) {
    buildAll();
}
