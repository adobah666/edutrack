import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ message: 'Recent announcements endpoint' });
}

export async function POST() {
  return NextResponse.json({ message: 'POST not implemented' });
}
