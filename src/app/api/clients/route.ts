import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const clients = await prisma.client.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                accounts: {
                    include: {
                        provider: true
                    }
                }
            }
        });
        return NextResponse.json(clients);
    } catch (error) {
        console.error('Failed to fetch clients', error);
        return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();

        const validAccounts = body.accounts ? body.accounts.filter((a: any) => a.providerId) : [];
        const accountsPayload = validAccounts.map((acct: any) => ({
            providerId: acct.providerId,
            username: acct.username || null,
            password: acct.password || null,
            notes: acct.notes || null,
        }));

        let client;

        if (body.id) {
            // Eliminar cuentas previas
            await prisma.account.deleteMany({
                where: { clientId: body.id }
            });

            client = await prisma.client.update({
                where: { id: body.id },
                data: {
                    name: body.name,
                    domotics_notes: body.domotics_notes,
                    address: body.address,
                    latitude: body.latitude ? parseFloat(body.latitude) : null,
                    longitude: body.longitude ? parseFloat(body.longitude) : null,
                    accounts: {
                        create: accountsPayload
                    }
                }
            });
        } else {
            client = await prisma.client.create({
                data: {
                    name: body.name,
                    domotics_notes: body.domotics_notes,
                    address: body.address,
                    latitude: body.latitude ? parseFloat(body.latitude) : null,
                    longitude: body.longitude ? parseFloat(body.longitude) : null,
                    accounts: {
                        create: accountsPayload
                    }
                }
            });
        }

        return NextResponse.json(client, { status: 201 });
    } catch (error) {
        console.error('Failed to create client', error);
        return NextResponse.json({ error: 'Failed to create client' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const url = new URL(request.url);
        const id = url.searchParams.get('id');
        if (!id) {
            return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
        }
        await prisma.client.delete({ where: { id } });
        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error('Failed to delete client', error);
        return NextResponse.json({ error: 'Failed to delete client' }, { status: 500 });
    }
}
