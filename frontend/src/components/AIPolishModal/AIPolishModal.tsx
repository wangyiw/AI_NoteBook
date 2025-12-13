import type { PointerEvent as ReactPointerEvent } from 'react'
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createStreamConnection } from '../../api/noteApi'
import type { StreamResponse } from '../../types/note'
import styles from './AIPolishModal.module.css'

interface AIPolishModalProps {
    isOpen: boolean
    originalText: string
    mode: 'full' | 'selection'
    selectionStart?: number
    selectionEnd?: number
    onAccept: (newText: string) => void
    onReject: () => void
}

function generateRequestId(): string {
    return Math.random().toString(36).substring(2, 18)
}

export function AIPolishModal({
    isOpen,
    originalText,
    mode,
    onAccept,
    onReject,
}: AIPolishModalProps) {
    const [hasGeneratedText, setHasGeneratedText] = useState(false)
    const [isGenerating, setIsGenerating] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const requestIdRef = useRef<string>('')
    const abortControllerRef = useRef<AbortController | null>(null)
    const bufferedRef = useRef<string>('')
    const totalLenRef = useRef<number>(0)
    const rafScheduledRef = useRef<boolean>(false)
    const timeoutIdRef = useRef<number | null>(null)

    const generatedTextRef = useRef<string>('')
    const generatedContainerRef = useRef<HTMLDivElement | null>(null)
    const generatedTextNodeRef = useRef<Text | null>(null)
    const hasGeneratedTextRef = useRef<boolean>(false)

    const modalRef = useRef<HTMLDivElement | null>(null)
    const [position, setPosition] = useState<{ x: number; y: number } | null>(null)
    const dragRef = useRef<{
        dragging: boolean
        pointerId: number | null
        offsetX: number
        offsetY: number
    }>({ dragging: false, pointerId: null, offsetX: 0, offsetY: 0 })

    const LONG_TEXT_THRESHOLD = 10000
    const LONG_TEXT_FLUSH_MS = 120

    const cancelFlushSchedule = useCallback(() => {
        if (timeoutIdRef.current !== null) {
            window.clearTimeout(timeoutIdRef.current)
            timeoutIdRef.current = null
        }
        rafScheduledRef.current = false
    }, [])

    const flushToUI = useCallback(() => {
        rafScheduledRef.current = false
        if (!bufferedRef.current) return

        const chunk = bufferedRef.current
        bufferedRef.current = ''

        generatedTextRef.current += chunk
        if (generatedTextNodeRef.current) {
            generatedTextNodeRef.current.appendData(chunk)
        } else if (generatedContainerRef.current) {
            generatedContainerRef.current.textContent = generatedTextRef.current
        }

        if (!hasGeneratedTextRef.current) {
            hasGeneratedTextRef.current = true
            setHasGeneratedText(true)
        }
    }, [])

    const scheduleFlush = useCallback(() => {
        const isLongText = totalLenRef.current >= LONG_TEXT_THRESHOLD

        if (isLongText) {
            if (timeoutIdRef.current !== null) return
            timeoutIdRef.current = window.setTimeout(() => {
                timeoutIdRef.current = null
                flushToUI()
            }, LONG_TEXT_FLUSH_MS)
            return
        }

        if (rafScheduledRef.current) return
        rafScheduledRef.current = true
        window.requestAnimationFrame(() => {
            flushToUI()
        })
    }, [flushToUI])

    const startGeneration = useCallback(() => {
        const newRequestId = generateRequestId()
        requestIdRef.current = newRequestId
        setHasGeneratedText(false)
        setError(null)
        setIsGenerating(true)

        cancelFlushSchedule()
        bufferedRef.current = ''
        totalLenRef.current = 0

        hasGeneratedTextRef.current = false
        generatedTextRef.current = ''
        if (generatedContainerRef.current) {
            generatedContainerRef.current.textContent = ''
            const textNode = document.createTextNode('')
            generatedTextNodeRef.current = textNode
            generatedContainerRef.current.appendChild(textNode)
        } else {
            generatedTextNodeRef.current = null
        }

        const prompt = originalText

        abortControllerRef.current = createStreamConnection(
            { content_id: newRequestId, prompt },
            (data: StreamResponse) => {
                if (data.content_id === newRequestId && !data.done) {
                    bufferedRef.current += data.message
                    totalLenRef.current += data.message.length
                    scheduleFlush()
                }
            },
            (err: Error) => {
                cancelFlushSchedule()
                setError(err.message)
                setIsGenerating(false)
            },
            () => {
                cancelFlushSchedule()
                flushToUI()
                setIsGenerating(false)
            }
        )
    }, [cancelFlushSchedule, flushToUI, originalText, scheduleFlush])

    useEffect(() => {
        if (isOpen && originalText) {
            startGeneration()
        }
        return () => {
            cancelFlushSchedule()
            if (abortControllerRef.current) {
                abortControllerRef.current.abort()
                abortControllerRef.current = null
            }
        }
    }, [isOpen, originalText, startGeneration])

    useLayoutEffect(() => {
        if (!isOpen) return
        const el = modalRef.current
        if (!el) return

        const rect = el.getBoundingClientRect()
        const vw = window.innerWidth
        const vh = window.innerHeight
        const x = Math.max(8, Math.round((vw - rect.width) / 2))
        const y = Math.max(8, Math.round((vh - rect.height) / 2))
        setPosition({ x, y })
    }, [isOpen])

    const clampPosition = useCallback((x: number, y: number) => {
        const el = modalRef.current
        const rect = el?.getBoundingClientRect()
        const width = rect?.width ?? 0
        const height = rect?.height ?? 0
        const vw = window.innerWidth
        const vh = window.innerHeight
        const minX = 8
        const minY = 8
        const maxX = Math.max(minX, vw - width - 8)
        const maxY = Math.max(minY, vh - height - 8)

        return {
            x: Math.min(Math.max(x, minX), maxX),
            y: Math.min(Math.max(y, minY), maxY),
        }
    }, [])

    const handleHeaderPointerDown = useCallback(
        (e: ReactPointerEvent<HTMLDivElement>) => {
            if (e.button !== 0) return
            const el = modalRef.current
            if (!el) return
            const rect = el.getBoundingClientRect()

            dragRef.current.dragging = true
            dragRef.current.pointerId = e.pointerId
            dragRef.current.offsetX = e.clientX - rect.left
            dragRef.current.offsetY = e.clientY - rect.top

            e.preventDefault()
            e.stopPropagation()
        },
        []
    )

    const handleStop = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort()
            abortControllerRef.current = null
        }
        cancelFlushSchedule()
        flushToUI()
        setIsGenerating(false)
    }

    const handleRetry = () => {
        startGeneration()
    }

    const handleAccept = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort()
        }
        onAccept(generatedTextRef.current)
    }

    const handleReject = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort()
        }
        setHasGeneratedText(false)
        setError(null)

        hasGeneratedTextRef.current = false
        generatedTextRef.current = ''
        generatedTextNodeRef.current = null
        if (generatedContainerRef.current) {
            generatedContainerRef.current.textContent = ''
        }
        onReject()
    }

    useEffect(() => {
        if (!isOpen) return

        const onPointerMove = (e: PointerEvent) => {
            if (!dragRef.current.dragging) return
            if (dragRef.current.pointerId !== null && e.pointerId !== dragRef.current.pointerId) return

            const nextX = e.clientX - dragRef.current.offsetX
            const nextY = e.clientY - dragRef.current.offsetY
            const clamped = clampPosition(nextX, nextY)
            setPosition(clamped)
        }

        const endDrag = (e: PointerEvent) => {
            if (!dragRef.current.dragging) return
            if (dragRef.current.pointerId !== null && e.pointerId !== dragRef.current.pointerId) return
            dragRef.current.dragging = false
            dragRef.current.pointerId = null
        }

        window.addEventListener('pointermove', onPointerMove)
        window.addEventListener('pointerup', endDrag)
        window.addEventListener('pointercancel', endDrag)

        return () => {
            window.removeEventListener('pointermove', onPointerMove)
            window.removeEventListener('pointerup', endDrag)
            window.removeEventListener('pointercancel', endDrag)
        }
    }, [clampPosition, isOpen])

    if (!isOpen) return null

    return (
        <div className={styles.overlay} onClick={handleReject}>
            <div
                ref={modalRef}
                className={styles.modal}
                style={position ? { position: 'fixed', left: position.x, top: position.y } : undefined}
                onClick={(e) => e.stopPropagation()}
            >
                <div className={styles.header} onPointerDown={handleHeaderPointerDown}>
                    <h2 className={styles.title}>AI 润色</h2>
                    <span className={styles.modeTag}>
                        {mode === 'selection' ? '选中文本' : '全文'}
                    </span>
                </div>

                <div className={styles.content}>
                    <div className={styles.panel}>
                        <div className={styles.panelHeader}>
                            <span className={styles.panelTitle}>原文</span>
                        </div>
                        <div className={styles.originalText}>{originalText}</div>
                    </div>

                    <div className={styles.panel}>
                        <div className={styles.panelHeader}>
                            <span className={styles.panelTitle}>AI 生成</span>
                            {isGenerating && <span className={styles.generating}>生成中...</span>}
                        </div>
                        <div className={styles.generatedText}>
                            {!hasGeneratedText && isGenerating ? '正在生成...' : null}
                            <div className={styles.generatedContent} ref={generatedContainerRef} />
                            {error && <div className={styles.error}>{error}</div>}
                        </div>
                    </div>
                </div>

                <div className={styles.footer}>
                    {isGenerating ? (
                        <button className={styles.stopButton} onClick={handleStop}>
                            停止生成
                        </button>
                    ) : error ? (
                        <button className={styles.retryButton} onClick={handleRetry}>
                            重试
                        </button>
                    ) : null}
                    <button
                        className={styles.rejectButton}
                        onClick={handleReject}
                    >
                        拒绝
                    </button>
                    <button
                        className={styles.acceptButton}
                        onClick={handleAccept}
                        disabled={isGenerating || !hasGeneratedText}
                    >
                        接受
                    </button>
                </div>
            </div>
        </div>
    )
}
