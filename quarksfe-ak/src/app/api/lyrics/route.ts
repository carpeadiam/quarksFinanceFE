import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'src/services/Lyrics.srt');
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    
    return new NextResponse(fileContent, {
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  } catch (error) {
    console.error('Error serving lyrics file:', error);
    return new NextResponse(JSON.stringify({ error: 'Failed to load lyrics file' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}