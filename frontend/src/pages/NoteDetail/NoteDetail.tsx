import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AIPolishModal } from '../../components/AIPolishModal/AIPolishModal'
import { ErrorMessage } from '../../components/ErrorMessage/ErrorMessage'
import { Loading } from '../../components/Loading/Loading'
import { useDeleteNoteMutation, useGetNoteQuery, useUpdateNoteMutation } from '../../features/notes/notesApi'
import { useDebounce } from '../../hooks/useDebounce'
import { useYjsCollaboration } from '../../hooks/useYjsCollaboration'
import type { Note } from '../../types/note'
import styles from './NoteDetail.module.css'

export function NoteDetail() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()

    const [note, setNote] = useState<Note | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [notFound, setNotFound] = useState(false)
    const [saving, setSaving] = useState(false)
    const [deleting, setDeleting] = useState(false)

    const [title, setTitle] = useState('')
    const [content, setContent] = useState('')

    const lineCount = Math.max(1, content.split(/\r\n|\r|\n/).length)

    const [showPolishModal, setShowPolishModal] = useState(false)
    const [polishMode, setPolishMode] = useState<'full' | 'selection'>('full')
    const [polishText, setPolishText] = useState('')
    const [selectionStart, setSelectionStart] = useState(0)
    const [selectionEnd, setSelectionEnd] = useState(0)

    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const isLocalChangeRef = useRef(false)

    const {
        data: noteData,
        isLoading: loading,
        isError,
        refetch,
    } = useGetNoteQuery(id || '', { skip: !id })

    const [updateNoteMutation] = useUpdateNoteMutation()
    const [deleteNoteMutation] = useDeleteNoteMutation()

    const {
        isConnected,
        isSynced,
        replaceText,
        updateContent,
    } = useYjsCollaboration({
        noteId: id || '',
        initialContent: note?.content || '',
        onContentChange: (newContent) => {
            if (!isLocalChangeRef.current) {
                setContent(newContent)
            }
            isLocalChangeRef.current = false
        },
    })

    useEffect(() => {
        if (!id) return

        if (isError) {
            setError('加载失败')
            return
        }

        setError(null)
        setNotFound(false)

        if (noteData === null) {
            setNotFound(true)
            setNote(null)
            return
        }

        if (noteData) {
            setNote(noteData)
            setTitle(noteData.title || '')
            setContent(noteData.content || '')
        }
    }, [id, isError, noteData])

    const saveNote = useCallback(
        async (newTitle: string, newContent: string) => {
            if (!id) return
            try {
                setSaving(true)
                const updated = await updateNoteMutation({
                    id,
                    updates: { title: newTitle, content: newContent },
                }).unwrap()
                setNote(updated)
            } catch (err) {
                console.error('保存失败:', err)
            } finally {
                setSaving(false)
            }
        },
        [id, updateNoteMutation]
    )

    const debouncedSave = useDebounce(saveNote, 300)

    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newTitle = e.target.value
        setTitle(newTitle)
        debouncedSave(newTitle, content)
    }

    const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newContent = e.target.value
        const textarea = e.target
        const cursorPos = textarea.selectionStart

        isLocalChangeRef.current = true
        setContent(newContent)

        if (isSynced) {
            updateContent(newContent)
        }

        debouncedSave(title, newContent)

        setTimeout(() => {
            if (textareaRef.current) {
                textareaRef.current.setSelectionRange(cursorPos, cursorPos)
            }
        }, 0)
    }

    const handleDelete = async () => {
        if (!id) return
        const confirmed = window.confirm('确定要删除这篇笔记吗？')
        if (!confirmed) return

        try {
            setDeleting(true)
            await deleteNoteMutation(id).unwrap()
            navigate('/notes')
        } catch (err) {
            setError(err instanceof Error ? err.message : '删除失败')
        } finally {
            setDeleting(false)
        }
    }

    const handleBack = () => {
        navigate('/notes')
    }

    const handleAIPolish = () => {
        const textarea = textareaRef.current
        if (textarea) {
            const start = textarea.selectionStart
            const end = textarea.selectionEnd
            if (start !== end) {
                const selectedText = content.substring(start, end)
                setPolishMode('selection')
                setPolishText(selectedText)
                setSelectionStart(start)
                setSelectionEnd(end)
            } else {
                setPolishMode('full')
                setPolishText(content)
                setSelectionStart(0)
                setSelectionEnd(content.length)
            }
        } else {
            setPolishMode('full')
            setPolishText(content)
            setSelectionStart(0)
            setSelectionEnd(content.length)
        }
        setShowPolishModal(true)
    }

    const handlePolishAccept = async (newText: string) => {
        let newContent: string
        if (polishMode === 'selection') {
            newContent = content.substring(0, selectionStart) + newText + content.substring(selectionEnd)
            if (isSynced) {
                replaceText(selectionStart, selectionEnd, newText)
            }
        } else {
            newContent = newText
            if (isSynced) {
                replaceText(0, content.length, newText)
            }
        }

        isLocalChangeRef.current = true
        setContent(newContent)
        setShowPolishModal(false)

        if (id) {
            try {
                setSaving(true)
                const updated = await updateNoteMutation({
                    id,
                    updates: { title, content: newContent },
                }).unwrap()
                setNote(updated)
            } catch (err) {
                console.error('保存失败:', err)
            } finally {
                setSaving(false)
            }
        }
    }

    const handlePolishReject = () => {
        setShowPolishModal(false)
        setPolishText('')
    }

    if (loading) {
        return (
            <div className={styles.container}>
                <Loading text="加载笔记..." />
            </div>
        )
    }

    if (notFound) {
        return (
            <div className={styles.container}>
                <div className={styles.notFound}>
                    <h2>笔记不存在</h2>
                    <p>该笔记可能已被删除</p>
                    <button className={styles.backButton} onClick={handleBack}>
                        返回列表
                    </button>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className={styles.container}>
                <ErrorMessage message={error} onRetry={refetch} />
            </div>
        )
    }

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <button className={styles.backButton} onClick={handleBack}>
                    ← 返回
                </button>
                <div className={styles.headerRight}>
                    {!isConnected && <span className={styles.statusIndicator} style={{ color: '#ff6b6b' }}>● 未连接</span>}
                    {isConnected && !isSynced && <span className={styles.statusIndicator} style={{ color: '#ffa500' }}>● 同步中...</span>}
                    {isConnected && isSynced && <span className={styles.statusIndicator} style={{ color: '#51cf66' }}>● 已连接</span>}
                    {saving && <span className={styles.savingIndicator}>保存中...</span>}
                    <button
                        className={styles.polishButton}
                        onClick={handleAIPolish}
                        disabled={!content.trim()}
                    >
                        AI 润色
                    </button>
                    <button
                        className={styles.deleteButton}
                        onClick={handleDelete}
                        disabled={deleting}
                    >
                        {deleting ? '删除中...' : '删除'}
                    </button>
                </div>
            </header>

            <main className={styles.main}>
                <input
                    type="text"
                    className={styles.titleInput}
                    placeholder="输入标题..."
                    value={title}
                    onChange={handleTitleChange}
                />
                <textarea
                    ref={textareaRef}
                    className={styles.contentTextarea}
                    placeholder="开始写作..."
                    value={content}
                    onChange={handleContentChange}
                />
                {note && (
                    <div className={styles.meta}>
                        更新于: {new Date(note.updated_at).toLocaleString('zh-CN')}
                    </div>
                )}
            </main>

            <AIPolishModal
                isOpen={showPolishModal}
                originalText={polishText}
                mode={polishMode}
                selectionStart={selectionStart}
                selectionEnd={selectionEnd}
                onAccept={handlePolishAccept}
                onReject={handlePolishReject}
            />

            <div className={styles.lineCounter}>行数: {lineCount}</div>
        </div>
    )
}
