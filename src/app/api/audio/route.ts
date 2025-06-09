import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'src/services/Fein.mp3');
    const fileBuffer = fs.readFileSync(filePath);
    
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': fileBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Error serving audio file:', error);
    return new NextResponse(JSON.stringify({ error: 'Failed to load audio file' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}