import { NextResponse } from 'next/server';
import { getExpectedToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// POST /api/auth => Login
export async function POST(req: Request) {
    try {
        const { password } = await req.json();
        const pass = process.env.ADMIN_PASSWORD || 'Admin1234';
        if (password !== pass) {
            return NextResponse.json({ error: 'Contraseña incorrecta' }, { status: 401 });
        }
        const token = getExpectedToken();
        const res = NextResponse.json({ ok: true });
        res.cookies.set('admin_session', token, {
            httpOnly: true,
            path: '/',
            maxAge: 60 * 60 * 24 * 7,
            sameSite: 'lax',
        });
        return res;
    } catch {
        return NextResponse.json({ error: 'Error' }, { status: 500 });
    }
}

// DELETE /api/auth => Logout
export async function DELETE() {
    const res = NextResponse.json({ ok: true });
    res.cookies.delete('admin_session');
    return res;
}
