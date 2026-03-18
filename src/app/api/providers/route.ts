import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getExpectedToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET() {
    const authCookie = cookies().get('admin_session');
    const expectedToken = getExpectedToken();

    if (!authCookie || authCookie.value !== expectedToken) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    try {
        const providers = await prisma.provider.findMany({
            orderBy: { name: 'asc' },
        });
        return NextResponse.json(providers);
    } catch (error) {
        console.error('Error fetching providers:', error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const authCookie = cookies().get('admin_session');
    const expectedToken = getExpectedToken();

    if (!authCookie || authCookie.value !== expectedToken) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { name } = body;

        if (!name || name.trim() === '') {
            return NextResponse.json({ error: 'El nombre es obligatorio' }, { status: 400 });
        }

        const provider = await prisma.provider.create({
            data: { name: name.trim() },
        });

        return NextResponse.json(provider, { status: 201 });
    } catch (error: any) {
        console.error('Error creating provider:', error);
        if (error.code === 'P2002') {
            return NextResponse.json({ error: 'Ya existe un proveedor con ese nombre' }, { status: 400 });
        }
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    const authCookie = cookies().get('admin_session');
    const expectedToken = getExpectedToken();

    if (!authCookie || authCookie.value !== expectedToken) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    try {
        const url = new URL(request.url);
        const id = url.searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'ID de proveedor obligatorio' }, { status: 400 });
        }

        await prisma.provider.delete({
            where: { id },
        });

        return NextResponse.json({ message: 'Proveedor eliminado correctamente' });
    } catch (error) {
        console.error('Error deleting provider:', error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}
