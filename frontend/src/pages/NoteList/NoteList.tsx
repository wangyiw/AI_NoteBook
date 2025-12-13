import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createNote, fetchNoteList } from '../../api/noteApi'
import { EmptyState } from '../../components/EmptyState/EmptyState'
import { ErrorMessage } from '../../components/ErrorMessage/ErrorMessage'
import { Loading } from '../../components/Loading/Loading'
import type { Note } from '../../types/note'
import styles from './NoteList.module.css'

function formatDate(dateStr: string): string {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days === 0) {
        return `今天 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
    } else if (days === 1) {
        return '昨天'
    } else if (days < 7) {
        return `${days}天前`
    } else {
        return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`
    }
}

function getDisplayTitle(note: Note): string {
    if (note.title && note.title.trim()) {
        return note.title
    }
    if (note.content && note.content.trim()) {
        return note.content.substring(0, 30) + (note.content.length > 30 ? '...' : '')
    }
    return '无标题笔记'
}

export function NoteList() {
    const navigate = useNavigate()
    const [notes, setNotes] = useState<Note[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [creating, setCreating] = useState(false)

    const loadNotes = useCallback(async () => {
        try {
            setLoading(true)
            setError(null)
            const list = await fetchNoteList()
            setNotes(list)
        } catch (err) {
            setError(err instanceof Error ? err.message : '加载失败')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        loadNotes()
    }, [loadNotes])

    const handleCreateNote = async () => {
        try {
            setCreating(true)
            const id = await createNote({ title: '', content: '' })
            navigate(`/notes/${id}`)
        } catch (err) {
            setError(err instanceof Error ? err.message : '创建笔记失败')
        } finally {
            setCreating(false)
        }
    }

    const handleNoteClick = (id: string) => {
        navigate(`/notes/${id}`)
    }

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>AI 笔记</h1>
                <button
                    className={styles.createButton}
                    onClick={handleCreateNote}
                    disabled={creating}
                >
                    {creating ? '创建中...' : '新建笔记'}
                </button>
            </header>

            <main className={styles.main}>
                {loading ? (
                    <Loading text="加载笔记列表..." />
                ) : error ? (
                    <ErrorMessage message={error} onRetry={loadNotes} />
                ) : notes.length === 0 ? (
                    <EmptyState
                        title="还没有笔记"
                        description="点击上方按钮创建你的第一篇笔记"
                        actionText="新建笔记"
                        onAction={handleCreateNote}
                    />
                ) : (
                    <ul className={styles.noteList}>
                        {notes.map((note) => (
                            <li
                                key={note.id}
                                className={styles.noteItem}
                                onClick={() => handleNoteClick(note.id)}
                            >
                                <div className={styles.noteTitle}>{getDisplayTitle(note)}</div>
                                <div className={styles.noteTime}>{formatDate(note.updated_at)}</div>
                            </li>
                        ))}
                    </ul>
                )}
            </main>
        </div>
    )
}
