import { describe, expect, it, vi } from 'vitest'

import { createStreamConnection } from '../src/api/noteApi'

function makeSSEBody(chunks: string[]) {
    const encoder = new TextEncoder()
    let i = 0

    return {
        getReader() {
            return {
                read: async () => {
                    if (i >= chunks.length) {
                        return { done: true, value: undefined as unknown as Uint8Array }
                    }
                    const value = encoder.encode(chunks[i])
                    i += 1
                    return { done: false, value }
                },
            }
        },
    }
}

describe('createStreamConnection', () => {
    it('解析 SSE，并按 content_id 过滤 message，done=true 时触发 onComplete', async () => {
        const onMessage = vi.fn()
        const onError = vi.fn()
        let resolveComplete: (() => void) | null = null
        const onCompletePromise = new Promise<void>((resolve) => {
            resolveComplete = resolve
        })
        const onComplete = vi.fn(() => resolveComplete?.())

        const sse = [
            'data: {"content_id":"a","message":"Hello","done":false}\n\n',
            'data: {"content_id":"b","message":"IGNORE","done":false}\n\n',
            'data: {"content_id":"a","message":" World","done":false}\n\n',
            'data: {"content_id":"a","message":"","done":true}\n\n',
        ]

        const mockFetch = vi.fn().mockResolvedValue({
            ok: true,
            body: makeSSEBody(sse),
        })

            ; (globalThis as any).fetch = mockFetch

        const controller = createStreamConnection(
            { content_id: 'a', prompt: 'x' },
            onMessage,
            onError,
            onComplete
        )

        expect(controller).toBeInstanceOf(AbortController)
        expect(mockFetch).toHaveBeenCalledTimes(1)

        // 等待流读取与回调完成（避免仅 await Promise.resolve 导致断言过早）
        await onCompletePromise

        // 只接收 content_id=a 且 done=false 的 2 条
        expect(onMessage).toHaveBeenCalledTimes(3)
        expect(onMessage.mock.calls[0][0].message).toBe('Hello')
        expect(onMessage.mock.calls[1][0].message).toBe(' World')
        expect(onMessage.mock.calls[2][0].done).toBe(true)

        expect(onError).not.toHaveBeenCalled()
        expect(onComplete).toHaveBeenCalledTimes(1)
    })

    it('当 response 非 ok 时触发 onError', async () => {
        const onMessage = vi.fn()
        let resolveError: (() => void) | null = null
        const onErrorPromise = new Promise<void>((resolve) => {
            resolveError = resolve
        })
        const onError = vi.fn(() => resolveError?.())
        const onComplete = vi.fn()

        const mockFetch = vi.fn().mockResolvedValue({
            ok: false,
            status: 500,
        })
            ; (globalThis as any).fetch = mockFetch

        createStreamConnection({ content_id: 'a', prompt: 'x' }, onMessage, onError, onComplete)

        await onErrorPromise

        expect(onError).toHaveBeenCalledTimes(1)
        expect(onMessage).not.toHaveBeenCalled()
        expect(onComplete).not.toHaveBeenCalled()
    })

    it('abort 会把 signal 传给 fetch', async () => {
        const onMessage = vi.fn()
        const onError = vi.fn()
        const onComplete = vi.fn()

        const mockFetch = vi.fn().mockResolvedValue({
            ok: true,
            body: makeSSEBody([]),
        })
            ; (globalThis as any).fetch = mockFetch

        const controller = createStreamConnection({ content_id: 'a', prompt: 'x' }, onMessage, onError, onComplete)
        expect(mockFetch).toHaveBeenCalledTimes(1)
        const options = mockFetch.mock.calls[0][1]
        expect(options.signal).toBe(controller.signal)

        controller.abort()
        expect(controller.signal.aborted).toBe(true)
    })
})
