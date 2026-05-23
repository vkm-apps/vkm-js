let { runFromPackage, writeToPackageDotJson, ask, run } = require('./utils');
let chalk = require('chalk');
let { execSync } = require('child_process');
let fs = require('fs');
let path = require('path');
let axios = require('axios').create({
    headers: { Authorization: `Bearer ${require('./.env.json').GITHUB_TOKEN}` }
});

let version = process.argv[2];
if (!version) return exitWith('❌ You must pass a version number: npm run release 1.0.0');
// if (!/^\d+\.\d+\.\d+$/.test(version)) return exitWith(`❌ Invalid version: ${version}`);

let packages = [
    'animate',
    'closeable',
    'dropdown',
    'editor',
    'modal',
    'money',
    'popover',
    'tooltip',
    'validation',
];

let repo = {
    owner: 'vmphobos',
    name: 'vkm-js',
    branch: 'main'
};

(async () => {
    const versionChanged = checkVersionChanged();

    if (versionChanged) {
        await askStep('Bump versions?', bumpVersions);
    } else {
        console.log(chalk.yellow('⚠️ Version unchanged, skipping version bump.'));
    }

    await askStep('Build assets?', buildAssets);

    // Commit any changes (version bump or build output) if any
    if (hasGitChanges()) {
        commitChanges(versionChanged);
        await askStep('Push to GitHub?', pushToGitHub);
    } else {
        console.log(chalk.yellow('No changes detected, skipping commit and push.'));
    }

    if (!versionChanged) {
        console.log(chalk.yellow('Version did not change, skipping tag, release, and publish steps.'));
        return;
    }

    await askStep('Commit and tag version?', commitAndTagVersion);

    const ready = await ask('Ready to publish this version? (y/n) ');

    if (ready.toLowerCase() === 'y' || ready.toLowerCase() === 'yes') {
        const createRelease = await ask('Create GitHub release? (y/n) ');
        if (createRelease.toLowerCase() === 'y' || createRelease.toLowerCase() === 'yes') {
            await createGitHubRelease(version);
            await publishToNpm();
        } else {
            const publishNpm = await ask('Publish to npm? (y/n) ');
            if (publishNpm.toLowerCase() === 'y' || publishNpm.toLowerCase() === 'yes') {
                await publishToNpm();
            } else {
                console.log(chalk.yellow('🚫 Skipped publishing to npm.'));
            }
        }
    } else {
        console.log(chalk.yellow('🚫 Publishing skipped.'));
    }
})();

function checkVersionChanged() {
    return packages.some(pkg => {
        const pkgJsonPath = path.join(__dirname, '..', 'packages', pkg, 'package.json');
        if (!fs.existsSync(pkgJsonPath)) {
            console.warn(chalk.red(`Package.json missing for ${pkg}, skipping version check.`));
            return false;
        }
        const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf-8'));
        return pkgJson.version !== version;
    });
}

function hasGitChanges() {
    const status = execSync('git status --porcelain').toString().trim();
    return status.length > 0;
}

function commitChanges(versionChanged) {
    console.log(chalk.cyan(`📦 Committing ${versionChanged ? 'version bump and build output' : 'build output or other changes'}...`));
    execSync('git add .', { stdio: 'inherit' });

    try {
        execSync(`git commit -m "${versionChanged ? `v${version}` : 'build or other changes'}"`, { stdio: 'inherit' });
    } catch (err) {
        console.log(chalk.yellow('⚠️ No changes to commit.'));
    }
}

async function askStep(question, fn) {
    const answer = await ask(question + ' (y/n) ');
    if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
        await fn();
    } else {
        console.log(chalk.yellow(`Skipped: ${question}`));
    }
}

function bumpVersions() {
    packages.forEach(pkg => {
        writeToPackageDotJson(pkg, 'version', version);
        console.log(chalk.green(`🔢 Bumped version in ${pkg} to ${version}`));
    });
}

async function buildAssets() {
    console.log(chalk.blue('🔨 Building assets...'));
    const buildAll = require('./build');
    await buildAll(); // Await buildAll to ensure build finishes before proceeding
}

function commitAndTagVersion() {
    console.log(chalk.cyan('🏷️ Tagging version...'));
    execSync(`git tag v${version}`, { stdio: 'inherit' });
    console.log(chalk.green(`✅ Tagged as v${version}`));
}

function pushToGitHub() {
    console.log(chalk.yellow('📤 Pushing to GitHub...'));
    execSync(`git push origin ${repo.branch} --tags`, { stdio: 'inherit' });
}

// Helper to run commands from a package directory
function runFromPackageAsync(pkg, cmd) {
    return runFromPackage(pkg, cmd).then(stdout => {
        if (stdout) console.log(stdout);
    }).catch(error => {
        console.error(chalk.red(`❌ Error publishing ${pkg}:`), error);
        throw error;
    });
}

async function publishToNpm() {
    for (const pkg of packages) {
        console.log(chalk.yellow(`🚀 Publishing @vkm-js/${pkg}...`));
        try {
            await runFromPackageAsync(pkg, 'npm publish --access public');
        } catch (e) {
            console.error(chalk.red(`Failed to publish ${pkg}. Continuing with next.`));
        }
    }
    console.log(chalk.green('🎉 All packages published to npm!'));
}

async function createGitHubRelease(tag) {
    const releaseBody = `🎉 Release v${tag}\n\n- Changes: Add meaningful changelog here if needed.`;

    try {
        await axios.post(`https://api.github.com/repos/${repo.owner}/${repo.name}/releases`, {
            tag_name: `v${tag}`,
            name: `v${tag}`,
            target_commitish: repo.branch,
            body: releaseBody,
            draft: false,
            prerelease: false,
        });
        console.log(chalk.green(`✅ GitHub release created: v${tag}`));
    } catch (err) {
        console.error(chalk.red('❌ Failed to create GitHub release:'), err.message);
    }
}

function exitWith(msg) {
    console.error(chalk.red(msg));
    process.exit(1);
}
