const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '../src/templates');
const distDir = path.join(__dirname, '../dist/templates');

function copyRecursive(src, dest) {
    if (!fs.existsSync(src)) {
        console.log(`Source directory ${src} does not exist. Skipping template copy.`);
        return;
    }

    fs.mkdirSync(dest, { recursive: true });

    const entries = fs.readdirSync(src, { withFileTypes: true });

    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);

        if (entry.isDirectory()) {
            copyRecursive(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

copyRecursive(srcDir, distDir);
console.log('Email templates copied successfully');

