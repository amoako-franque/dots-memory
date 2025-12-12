import sharp from 'sharp';
import fs from 'fs-extra';
import path from 'path';

export class ImageProcessor {
    async generateThumbnail(inputPath: string, outputPath: string, width: number = 300): Promise<void> {
        await fs.ensureDir(path.dirname(outputPath));
        await sharp(inputPath)
            .resize(width)
            .jpeg({ quality: 80 })
            .toFile(outputPath);
    }

    async getMetadata(inputPath: string) {
        return sharp(inputPath).metadata();
    }
}

export default new ImageProcessor();
