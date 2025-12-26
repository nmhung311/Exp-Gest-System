import { NextRequest, NextResponse } from 'next/server';

// Increase timeout for large file uploads
export const maxDuration = 60; // 60 seconds
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  // Try multiple backend URLs
  const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.replace('/api', '') || 
                     process.env.BACKEND_URL || 
                     'http://192.168.1.135:5008';
  
  try {
    console.log('[Next.js API] Starting backup restore...');
    console.log('[Next.js API] Backend URL:', backendUrl);
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      console.error('[Next.js API] No file in formData');
      return NextResponse.json({ message: 'No file uploaded' }, { status: 400 });
    }
    
    console.log('[Next.js API] File received:', file.name, 'Size:', file.size, 'Type:', file.type);
    
    if (!file.name.toLowerCase().endsWith('.zip')) {
      return NextResponse.json({ message: 'File must be a ZIP file' }, { status: 400 });
    }
    
    // Forward cookies for authentication
    const cookies = request.headers.get('cookie');
    const authHeader = request.headers.get('authorization');
    const headers: HeadersInit = {};
    
    // Forward cookies to backend (for refresh-token)
    if (cookies) {
      headers['cookie'] = cookies;
    }
    
    // Forward authorization header if present
    if (authHeader) {
      headers['authorization'] = authHeader;
    }
    
    console.log('[Next.js API] Cookies:', cookies ? 'Present' : 'Missing');
    console.log('[Next.js API] Auth header:', authHeader ? 'Present' : 'Missing');
    
    // Create FormData for backend - use the file directly
    const backendFormData = new FormData();
    backendFormData.append('file', file);
    
    console.log('[Next.js API] Proxying POST /api/backup/restore to:', `${backendUrl}/api/backup/restore`);
    console.log('[Next.js API] File size:', file.size, 'bytes');
    
    // Increase timeout for large files
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 seconds timeout
    
    try {
      const response = await fetch(`${backendUrl}/api/backup/restore`, {
        method: 'POST',
        headers,
        body: backendFormData,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      console.log('[Next.js API] Backend response status:', response.status);
      console.log('[Next.js API] Backend response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Next.js API] Backend error response:', errorText);
        return NextResponse.json({ 
          message: `Backend error: ${response.status}`,
          error: errorText,
          backendUrl: `${backendUrl}/api/backup/restore`
        }, { status: response.status });
      }
      
      const data = await response.json();
      console.log('[Next.js API] Restore response data:', data);
      
      return NextResponse.json(data, { status: response.status });
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        console.error('[Next.js API] Request timeout');
        return NextResponse.json({ 
          message: 'Request timeout - file may be too large',
          error: 'Timeout after 60 seconds'
        }, { status: 504 });
      }
      throw fetchError;
    }
  } catch (error: any) {
    console.error('[Next.js API] Restore error:', error.message);
    console.error('[Next.js API] Error stack:', error.stack);
    return NextResponse.json({ 
      message: `Proxy restore error: ${error.message}`,
      error: error.toString(),
      backendUrl: backendUrl
    }, { status: 500 });
  }
}

