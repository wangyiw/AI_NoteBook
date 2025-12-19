import { useEffect, useRef, useState } from 'react'
import { WebsocketProvider } from 'y-websocket'
import * as Y from 'yjs'

interface UseYjsCollaborationOptions {
    noteId: string
    initialContent: string
    onContentChange: (content: string) => void
    onSynced?: () => void
}

export function useYjsCollaboration({
    noteId,
    initialContent,
    onContentChange,
    onSynced,
}: UseYjsCollaborationOptions) {
    const ydocRef = useRef<Y.Doc | null>(null)
    const ytextRef = useRef<Y.Text | null>(null)
    const providerRef = useRef<WebsocketProvider | null>(null)
    const [isConnected, setIsConnected] = useState(false)
    const [isSynced, setIsSynced] = useState(false)
    const isInitializedRef = useRef(false)

    useEffect(() => {
        const ydoc = new Y.Doc()
        const ytext = ydoc.getText('content')

        const wsUrl = import.meta.env.VITE_YJS_WS_URL || 'ws://localhost:8124'
        const provider = new WebsocketProvider(wsUrl, `note-${noteId}`, ydoc)

        ydocRef.current = ydoc
        ytextRef.current = ytext
        providerRef.current = provider

        provider.on('status', (event: { status: string }) => {
            setIsConnected(event.status === 'connected')
        })

        provider.on('sync', (isSynced: boolean) => {
            setIsSynced(isSynced)
            if (isSynced) {
                if (!isInitializedRef.current && ytext.length === 0 && initialContent) {
                    ydoc.transact(() => {
                        ytext.insert(0, initialContent)
                    })
                    isInitializedRef.current = true
                }
                onSynced?.()
            }
        })

        const observer = () => {
            const content = ytext.toString()
            onContentChange(content)
        }

        ytext.observe(observer)

        return () => {
            ytext.unobserve(observer)
            provider.destroy()
            ydoc.destroy()
        }
    }, [noteId])

    const updateContent = (newContent: string) => {
        if (!ydocRef.current || !ytextRef.current) return

        ydocRef.current.transact(() => {
            const ytext = ytextRef.current!
            ytext.delete(0, ytext.length)
            ytext.insert(0, newContent)
        })
    }

    const insertText = (index: number, text: string) => {
        if (!ydocRef.current || !ytextRef.current) return

        ydocRef.current.transact(() => {
            ytextRef.current!.insert(index, text)
        })
    }

    const deleteText = (index: number, length: number) => {
        if (!ydocRef.current || !ytextRef.current) return

        ydocRef.current.transact(() => {
            ytextRef.current!.delete(index, length)
        })
    }

    const replaceText = (start: number, end: number, newText: string) => {
        if (!ydocRef.current || !ytextRef.current) return

        ydocRef.current.transact(() => {
            const ytext = ytextRef.current!
            ytext.delete(start, end - start)
            ytext.insert(start, newText)
        })
    }

    return {
        isConnected,
        isSynced,
        updateContent,
        insertText,
        deleteText,
        replaceText,
        ydoc: ydocRef.current,
        ytext: ytextRef.current,
    }
}
