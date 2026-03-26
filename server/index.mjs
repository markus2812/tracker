import { createServer } from 'node:http'
import { existsSync, readFileSync, statSync } from 'node:fs'
import { networkInterfaces } from 'node:os'
import { extname, join, normalize, resolve } from 'node:path'
import { URL } from 'node:url'
import * as dbModule from './db.mjs'
import { DailyEntrySchema, SettingsSchema, isoDateSchema } from './schema.mjs'

const { getDbPath, getEntry, getSettings, listEntries, saveEntry, saveSettings } = dbModule

const host = process.env.TRACKER_HOST ?? '0.0.0.0'
const port = Number(process.env.TRACKER_PORT ?? 3210)
const distDir = resolve(process.cwd(), 'dist')

const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
}

function setCorsHeaders(response) {
  response.setHeader('Access-Control-Allow-Origin', '*')
  response.setHeader('Access-Control-Allow-Methods', 'GET,PUT,OPTIONS')
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type')
}

function sendJson(response, statusCode, payload) {
  setCorsHeaders(response)
  response.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  })
  response.end(JSON.stringify(payload))
}

function sendError(response, statusCode, message, details) {
  sendJson(response, statusCode, {
    error: message,
    details,
  })
}

async function readJsonBody(request) {
  const chunks = []

  for await (const chunk of request) {
    chunks.push(chunk)
  }

  if (!chunks.length) {
    return {}
  }

  return JSON.parse(Buffer.concat(chunks).toString('utf8'))
}

function serveStaticFile(response, filePath) {
  const extension = extname(filePath)
  const contentType = mimeTypes[extension] ?? 'application/octet-stream'
  const buffer = readFileSync(filePath)

  response.writeHead(200, {
    'Content-Type': contentType,
  })
  response.end(buffer)
}

function resolveStaticPath(pathname) {
  const requestedPath = pathname === '/' ? 'index.html' : pathname.slice(1)
  const normalizedPath = normalize(requestedPath).replace(/^(\.\.(\/|\\|$))+/, '')
  return join(distDir, normalizedPath)
}

function isAllInterfacesHost(value) {
  return value === '0.0.0.0' || value === '::'
}

function isTailscaleIpv4(address) {
  const parts = address.split('.').map(Number)
  return parts.length === 4 && parts[0] === 100 && parts[1] >= 64 && parts[1] <= 127
}

function isLanIpv4(address) {
  const parts = address.split('.').map(Number)

  if (parts.length !== 4) {
    return false
  }

  if (parts[0] === 10 || (parts[0] === 192 && parts[1] === 168)) {
    return true
  }

  return parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31
}

function getReachableUrls(port) {
  const interfaces = networkInterfaces()
  const tailscaleUrls = new Set()
  const lanUrls = new Set()

  for (const [name, addresses] of Object.entries(interfaces)) {
    for (const addressInfo of addresses ?? []) {
      if (addressInfo.family !== 'IPv4' || addressInfo.internal) {
        continue
      }

      const url = `http://${addressInfo.address}:${port}`
      if (name.toLowerCase().includes('tailscale') || isTailscaleIpv4(addressInfo.address)) {
        tailscaleUrls.add(url)
        continue
      }

      if (isLanIpv4(addressInfo.address)) {
        lanUrls.add(url)
      }
    }
  }

  return {
    tailscale: [...tailscaleUrls],
    lan: [...lanUrls],
  }
}

const server = createServer(async (request, response) => {
  if (!request.url) {
    sendError(response, 400, 'Missing URL')
    return
  }

  const url = new URL(request.url, `http://${request.headers.host ?? 'localhost'}`)
  const { pathname, searchParams } = url

  if (request.method === 'OPTIONS') {
    setCorsHeaders(response)
    response.writeHead(204)
    response.end()
    return
  }

  try {
    if (request.method === 'GET' && pathname === '/api/health') {
      sendJson(response, 200, {
        ok: true,
        dbPath: getDbPath(),
        now: new Date().toISOString(),
      })
      return
    }

    if (request.method === 'GET' && pathname === '/api/entries') {
      const from = searchParams.get('from') ?? undefined
      const to = searchParams.get('to') ?? undefined

      if (from) {
        isoDateSchema.parse(from)
      }

      if (to) {
        isoDateSchema.parse(to)
      }

      sendJson(response, 200, listEntries({ from, to }))
      return
    }

    if (request.method === 'GET' && pathname.startsWith('/api/entries/')) {
      const date = pathname.slice('/api/entries/'.length)
      isoDateSchema.parse(date)

      const entry = getEntry(date)
      if (!entry) {
        sendError(response, 404, 'Entry not found')
        return
      }

      sendJson(response, 200, entry)
      return
    }

    if (request.method === 'PUT' && pathname.startsWith('/api/entries/')) {
      const date = pathname.slice('/api/entries/'.length)
      isoDateSchema.parse(date)

      const body = await readJsonBody(request)
      const parsed = DailyEntrySchema.parse({
        ...body,
        date,
      })

      sendJson(response, 200, saveEntry(parsed))
      return
    }

    if (request.method === 'GET' && pathname === '/api/settings') {
      sendJson(response, 200, getSettings())
      return
    }

    if (request.method === 'PUT' && pathname === '/api/settings') {
      const body = await readJsonBody(request)
      const parsed = SettingsSchema.parse(body)
      sendJson(response, 200, saveSettings(parsed))
      return
    }

    if (pathname.startsWith('/api/')) {
      sendError(response, 404, 'Route not found')
      return
    }

    if (!existsSync(distDir)) {
      sendError(response, 503, 'Static build not found. Run npm run build first.')
      return
    }

    const requestedFile = resolveStaticPath(pathname)
    if (existsSync(requestedFile) && statSync(requestedFile).isFile()) {
      serveStaticFile(response, requestedFile)
      return
    }

    serveStaticFile(response, join(distDir, 'index.html'))
  } catch (error) {
    const details = error instanceof Error ? error.message : 'Unknown error'
    sendError(response, 400, 'Request failed', details)
  }
})

server.listen(port, host, () => {
  console.log(`Tracker server listening on http://${host}:${port}`)
  console.log(`SQLite database: ${getDbPath()}`)

  if (!isAllInterfacesHost(host)) {
    return
  }

  console.log(`Local URL: http://127.0.0.1:${port}`)

  const urls = getReachableUrls(port)
  for (const url of urls.tailscale) {
    console.log(`Tailnet URL: ${url}`)
  }

  for (const url of urls.lan) {
    console.log(`LAN URL: ${url}`)
  }
})
