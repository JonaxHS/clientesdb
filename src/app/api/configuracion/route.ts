import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { cookies } from 'next/headers';
import { writeFileSync } from 'fs';
import { getExpectedToken } from '../auth/route';

const prisma = new PrismaClient();
export const dynamic = 'force-dynamic';

function isAuthenticated(): boolean {
    const cookieStore = cookies();
    const token = cookieStore.get('admin_session')?.value;
    return token === getExpectedToken();
}

export function generateNginxConf(domain: string, ssl: boolean): string {
    const serverName = domain ? `    server_name ${domain};` : '    # server_name tudominio.com;';

    if (!ssl || !domain) {
        return `server {
    listen 80;
${serverName}

    location / {
        proxy_pass http://web:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}`;
    }

    return `server {
    listen 80;
    server_name ${domain};
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name ${domain};

    ssl_certificate /etc/letsencrypt/live/${domain}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${domain}/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;

    location / {
        proxy_pass http://web:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}`;
}

export async function GET() {
    if (!isAuthenticated()) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    const rows = await prisma.setting.findMany();
    const obj: Record<string, string> = {};
    rows.forEach(r => { obj[r.key] = r.value; });
    return NextResponse.json(obj);
}

export async function POST(req: Request) {
    if (!isAuthenticated()) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    const body = await req.json();

    const updates: Record<string, string> = {};
    if (body.domain !== undefined) updates.domain = body.domain;
    if (body.ssl_enabled !== undefined) updates.ssl_enabled = String(body.ssl_enabled);

    for (const [key, value] of Object.entries(updates)) {
        await prisma.setting.upsert({
            where: { key },
            create: { key, value },
            update: { value },
        });
    }

    // Fetch final values
    const allSettings = await prisma.setting.findMany();
    const cfg: Record<string, string> = {};
    allSettings.forEach(r => { cfg[r.key] = r.value; });

    const domain = cfg.domain || '';
    const ssl = cfg.ssl_enabled === 'true';
    const nginxConf = generateNginxConf(domain, ssl);

    // Write to shared nginx volume
    try {
        writeFileSync('/app/nginx-config/default.conf', nginxConf, 'utf8');
    } catch (e) {
        console.error('No se pudo escribir el config de Nginx:', e);
    }

    return NextResponse.json({ ok: true, nginx: nginxConf, settings: cfg });
}
