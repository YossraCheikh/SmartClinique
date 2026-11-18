import { NextRequest, NextResponse } from 'next/server';

// Symfony backend URL (HTTP / no-tls)
const SYMFONY_URL = process.env.SYMFONY_URL || process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

// NODE_TLS_REJECT_UNAUTHORIZED=0 is set in .env.local to bypass self-signed cert

export async function GET(request: NextRequest, context: { params: Promise<{ proxy: string[] }> }) {
  return proxyRequest(request, await context.params);
}
export async function POST(request: NextRequest, context: { params: Promise<{ proxy: string[] }> }) {
  return proxyRequest(request, await context.params);
}
export async function PUT(request: NextRequest, context: { params: Promise<{ proxy: string[] }> }) {
  return proxyRequest(request, await context.params);
}
export async function PATCH(request: NextRequest, context: { params: Promise<{ proxy: string[] }> }) {
  return proxyRequest(request, await context.params);
}
export async function DELETE(request: NextRequest, context: { params: Promise<{ proxy: string[] }> }) {
  return proxyRequest(request, await context.params);
}
export async function OPTIONS(request: NextRequest, context: { params: Promise<{ proxy: string[] }> }) {
  return proxyRequest(request, await context.params);
}

async function proxyRequest(request: NextRequest, params: { proxy: string[] }) {
  const path = params.proxy ? params.proxy.join('/') : '';
  const targetUrl = `${SYMFONY_URL}/api/${path}${request.nextUrl.search}`;

  // Forward headers, strip hop-by-hop headers
  const headers: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    if (key !== 'host' && key !== 'connection' && key !== 'transfer-encoding') {
      headers[key] = value;
    }
  });

  let body: string | undefined;
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    try {
      body = await request.text();
    } catch {
      body = undefined;
    }
  }

  try {
    const response = await fetch(targetUrl, {
      method: request.method,
      headers,
      body: body && body.length > 0 ? body : undefined,
    });

    const responseBody = await response.arrayBuffer();

    const responseHeaders = new Headers();
    response.headers.forEach((value, key) => {
      if (key !== 'transfer-encoding' && key !== 'connection') {
        responseHeaders.set(key, value);
      }
    });

    return new NextResponse(responseBody, {
      status: response.status,
      headers: responseHeaders,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[Proxy] Error forwarding to Symfony:', msg);
    return NextResponse.json(
      { error: 'Proxy error', detail: msg },
      { status: 502 }
    );
  }
}
