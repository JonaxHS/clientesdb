import { createHash } from 'crypto';

export function getExpectedToken(): string {
    const pass = process.env.ADMIN_PASSWORD || 'Admin1234';
    return createHash('sha256').update(pass + '-clientesdb-2024').digest('hex');
}
