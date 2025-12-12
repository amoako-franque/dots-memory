import { StorageProvider } from './storage.provider';
import fs from 'fs-extra';
import path from 'path';

export class LocalStorageProvider implements StorageProvider {
    private uploadDir: string;
    private baseUrl: string;

    constructor() {
        this.uploadDir = path.join(process.cwd(), 'uploads');
        this.baseUrl = process.env.API_URL || 'http://localhost:30700';
        fs.ensureDirSync(this.uploadDir);
    }

    async getUploadUrl(key: string, contentType: string): Promise<string> {
        return `${this.baseUrl}/api/v1/media/upload/local?key=${encodeURIComponent(key)}`;
    }

    async getDownloadUrl(key: string): Promise<string> {
        return `${this.baseUrl}/uploads/${key}`;
    }

    async deleteFile(key: string): Promise<void> {
        const filePath = path.join(this.uploadDir, key);
        if (await fs.pathExists(filePath)) {
            await fs.remove(filePath);
        }
    }
}
