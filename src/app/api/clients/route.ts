import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const clients = await prisma.client.findMany({
            orderBy: { createdAt: 'desc' }
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
        const newClient = await prisma.client.create({
            data: {
                name: body.name,
                hikvision_user: body.hikvision_user,
                hikvision_pass: body.hikvision_pass,
                google_email: body.google_email,
                google_pass: body.google_pass,
                ewelink_user: body.ewelink_user,
                ewelink_pass: body.ewelink_pass,
                domotics_notes: body.domotics_notes,
                latitude: body.latitude ? parseFloat(body.latitude) : null,
                longitude: body.longitude ? parseFloat(body.longitude) : null,
            }
        });
        return NextResponse.json(newClient, { status: 201 });
    } catch (error) {
        console.error('Failed to create client', error);
        return NextResponse.json({ error: 'Failed to create client' }, { status: 500 });
    }
}
