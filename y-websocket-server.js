#!/usr/bin/env node

/**
 * Yjs WebSocket 服务器
 * 用于实时协作编辑的 WebSocket 中继服务
 */

const WebSocket = require('ws')
const http = require('http')
const { setupWSConnection } = require('y-websocket/bin/utils')

const host = process.env.HOST || 'localhost'
const port = process.env.PORT || 8124

const server = http.createServer((request, response) => {
  response.writeHead(200, { 'Content-Type': 'text/plain' })
  response.end('Yjs WebSocket Server is running\n')
})

const wss = new WebSocket.Server({ server })

wss.on('connection', (ws, req) => {
  setupWSConnection(ws, req)
})

server.listen(port, host, () => {
  console.log(`Yjs WebSocket Server running at ws://${host}:${port}`)
})
