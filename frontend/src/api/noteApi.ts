import type {
    ApiResponse,
    CreateNoteRequest,
    Note,
    NoteListResponse,
    NoteResponse,
    StreamRequest,
    StreamResponse,
    UpdateNoteRequest
} from '../types/note'
import { ENDPOINTS } from './endpoints'

export async function fetchNoteList(): Promise<Note[]> {
    const response = await fetch(ENDPOINTS.NOTE_LIST)
    if (!response.ok) {
        throw new Error(`获取笔记列表失败: ${response.status}`)
    }
    const data: NoteListResponse = await response.json()
    if (data.code !== 0) {
        throw new Error(data.message || '获取笔记列表失败')
    }
    return data.data.list
}

export async function fetchNoteDetail(id: string): Promise<Note | null> {
    const response = await fetch(ENDPOINTS.NOTE_DETAIL(id))
    if (!response.ok) {
        if (response.status === 404) {
            return null
        }
        throw new Error(`获取笔记详情失败: ${response.status}`)
    }
    const data: NoteResponse = await response.json()
    if (data.code !== 0) {
        throw new Error(data.message || '获取笔记详情失败')
    }
    return data.data
}

export async function createNote(noteData: CreateNoteRequest): Promise<string> {
    const response = await fetch(ENDPOINTS.CREATE_NOTE, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(noteData),
    })
    if (!response.ok) {
        throw new Error(`创建笔记失败: ${response.status}`)
    }
    const data: ApiResponse<{ id: string }> = await response.json()
    if (data.code !== 0) {
        throw new Error(data.message || '创建笔记失败')
    }
    return data.data.id
}

export async function updateNote(id: string, updates: UpdateNoteRequest): Promise<Note> {
    const response = await fetch(ENDPOINTS.UPDATE_NOTE(id), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
    })
    if (!response.ok) {
        throw new Error(`更新笔记失败: ${response.status}`)
    }
    const data: NoteResponse = await response.json()
    if (data.code !== 0 || !data.data) {
        throw new Error(data.message || '更新笔记失败')
    }
    return data.data
}

export async function deleteNote(id: string): Promise<boolean> {
    const response = await fetch(ENDPOINTS.DELETE_NOTE(id), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
    })
    if (!response.ok) {
        throw new Error(`删除笔记失败: ${response.status}`)
    }
    const data: ApiResponse<null> = await response.json()
    return data.code === 0
}

export function createStreamConnection(
    request: StreamRequest,
    onMessage: (data: StreamResponse) => void,
    onError: (error: Error) => void,
    onComplete: () => void
): AbortController {
    const controller = new AbortController()

    fetch(ENDPOINTS.TEXT_STREAM, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
        signal: controller.signal,
    })
        .then(async (response) => {
            if (!response.ok) {
                throw new Error(`流式请求失败: ${response.status}`)
            }

            const reader = response.body?.getReader()
            if (!reader) {
                throw new Error('无法获取响应流')
            }

            const decoder = new TextDecoder()
            let buffer = ''

            while (true) {
                const { done, value } = await reader.read()
                if (done) break

                buffer += decoder.decode(value, { stream: true })
                const lines = buffer.split('\n')
                buffer = lines.pop() || ''

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const jsonStr = line.slice(6).trim()
                            if (jsonStr) {
                                const data: StreamResponse = JSON.parse(jsonStr)
                                if (data.content_id === request.content_id) {
                                    onMessage(data)
                                    if (data.done) {
                                        onComplete()
                                        return
                                    }
                                }
                            }
                        } catch (e) {
                            console.error('解析 SSE 数据失败:', e)
                        }
                    }
                }
            }
            onComplete()
        })
        .catch((error) => {
            if (error.name !== 'AbortError') {
                onError(error)
            }
        })

    return controller
}
