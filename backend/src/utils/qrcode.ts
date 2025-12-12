import QRCode from 'qrcode';
import { InternalServerError } from './errors';
import logger from './logger';

export const generateQRCode = async (text: string): Promise<string> => {
    try {
        return await QRCode.toDataURL(text);
    } catch (err) {
        logger.error('QR Code generation failed', {
            error: err instanceof Error ? err.message : 'Unknown error',
            text: text.substring(0, 50) + '...', // Log partial text for debugging
        });
        throw new InternalServerError('Failed to generate QR code', 'QR_GENERATION_FAILED', err as Error);
    }
};
