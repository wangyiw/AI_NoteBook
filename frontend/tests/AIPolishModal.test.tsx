import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// mock createStreamConnection
vi.mock('../src/api/noteApi', () => ({
    createStreamConnection: vi.fn(),
}))

import * as noteApi from '../src/api/noteApi'
import { AIPolishModal } from '../src/components/AIPolishModal/AIPolishModal'

describe('AIPolishModal', () => {
    beforeEach(() => {
        vi.useFakeTimers()
    })

    afterEach(() => {
        vi.useRealTimers()
        vi.clearAllMocks()
    })

    it('打开后会触发生成，并在完成后允许“接受”，点击后回调 onAccept', async () => {
        const onAccept = vi.fn()
        const onReject = vi.fn()

        const user = userEvent.setup({
            advanceTimers: vi.advanceTimersByTime,
        })

            ; (noteApi.createStreamConnection as any).mockImplementation((_req: any, onMessage: any, _onError: any, onComplete: any) => {
                onMessage({ content_id: _req.content_id, message: 'Hello', done: false })
                onMessage({ content_id: _req.content_id, message: ' World', done: false })
                onMessage({ content_id: _req.content_id, message: '', done: true })
                onComplete()
                return new AbortController()
            })

        render(
            <AIPolishModal
                isOpen={true}
                originalText="abc"
                mode="full"
                onAccept={onAccept}
                onReject={onReject}
            />
        )

        // 触发 raf flush
        await vi.runAllTimersAsync()

        const acceptButton = screen.getByRole('button', { name: '接受' })
        expect(acceptButton).toBeEnabled()

        await user.click(acceptButton)
        expect(onAccept).toHaveBeenCalledTimes(1)
        expect(onAccept.mock.calls[0][0]).toBe('Hello World')
    })

    it('点击遮罩层会触发 onReject', async () => {
        const onAccept = vi.fn()
        const onReject = vi.fn()

        const user = userEvent.setup({
            advanceTimers: vi.advanceTimersByTime,
        })

            ; (noteApi.createStreamConnection as any).mockImplementation(() => new AbortController())

        const { container } = render(
            <AIPolishModal
                isOpen={true}
                originalText="abc"
                mode="full"
                onAccept={onAccept}
                onReject={onReject}
            />
        )

        const overlay = container.querySelector('div')
        expect(overlay).toBeTruthy()

        if (overlay) {
            await user.click(overlay)
        }

        expect(onReject).toHaveBeenCalledTimes(1)
    })

    it('isOpen=false 不渲染任何内容', () => {
        const onAccept = vi.fn()
        const onReject = vi.fn()

        const { container } = render(
            <AIPolishModal
                isOpen={false}
                originalText="abc"
                mode="full"
                onAccept={onAccept}
                onReject={onReject}
            />
        )

        expect(container.firstChild).toBeNull()
    })
})
