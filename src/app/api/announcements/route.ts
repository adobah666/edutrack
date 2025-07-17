import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ message: 'Announcements endpoint' });
}

export async function POST() {
  return NextResponse.json({ message: 'POST not implemented' });
}
