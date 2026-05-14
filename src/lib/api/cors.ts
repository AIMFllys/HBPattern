import { NextResponse } from 'next/server'

const ALLOWED_ORIGINS = process.env.CORS_ALLOWED_ORIGINS?.split(',') ?? ['*']

export function corsHeaders(origin?: string | null): Record<string, string> {
  const allowedOrigin =
    ALLOWED_ORIGINS.includes('*') ? '*' :
    (origin && ALLOWED_ORIGINS.includes(origin)) ? origin : ALLOWED_ORIGINS[0]

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-API-Key, X-Request-Id',
    'Access-Control-Max-Age': '86400',
  }
}

export function handleOptions(request: Request): NextResponse {
  const origin = request.headers.get('origin')
  return new NextResponse(null, { status: 204, headers: corsHeaders(origin) })
}
