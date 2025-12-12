export interface StorageProvider {
    getUploadUrl(key: string, contentType: string): Promise<string>;
    getDownloadUrl(key: string): Promise<string>;
    deleteFile(key: string): Promise<void>;
}
