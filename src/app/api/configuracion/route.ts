import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { writeFileSync } from 'fs';
import { getExpectedToken } from '@/lib/auth';
import { generateNginxConf } from '@/lib/nginx';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

function isAuthenticated(): boolean {
    const cookieStore = cookies();
    const token = cookieStore.get('admin_session')?.value;
    return token === getExpectedToken();
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
