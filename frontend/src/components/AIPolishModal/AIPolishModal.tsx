import { useCallback, useEffect, useRef, useState } from 'react'
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
    const [generatedText, setGeneratedText] = useState('')
    const [isGenerating, setIsGenerating] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const requestIdRef = useRef<string>('')
    const abortControllerRef = useRef<AbortController | null>(null)

    const startGeneration = useCallback(() => {
        const newRequestId = generateRequestId()
        requestIdRef.current = newRequestId
        setGeneratedText('')
        setError(null)
        setIsGenerating(true)

        const prompt = `请帮我润色以下文字，使其更加通顺、优美，保持原意不变：\n\n${originalText}`

        abortControllerRef.current = createStreamConnection(
            { content_id: newRequestId, prompt },
            (data: StreamResponse) => {
                if (data.content_id === newRequestId && !data.done) {
                    setGeneratedText((prev) => prev + data.message)
                }
            },
            (err: Error) => {
                setError(err.message)
                setIsGenerating(false)
            },
            () => {
                setIsGenerating(false)
            }
        )
    }, [originalText])

    useEffect(() => {
        if (isOpen && originalText) {
            startGeneration()
        }
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort()
                abortControllerRef.current = null
            }
        }
    }, [isOpen, originalText, startGeneration])

    const handleStop = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort()
            abortControllerRef.current = null
        }
        setIsGenerating(false)
    }

    const handleRetry = () => {
        startGeneration()
    }

    const handleAccept = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort()
        }
        onAccept(generatedText)
    }

    const handleReject = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort()
        }
        setGeneratedText('')
        setError(null)
        onReject()
    }

    if (!isOpen) return null

    return (
        <div className={styles.overlay} onClick={handleReject}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.header}>
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
                            {generatedText || (isGenerating ? '正在生成...' : '')}
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
                        disabled={isGenerating || !generatedText}
                    >
                        接受
                    </button>
                </div>
            </div>
        </div>
    )
}
