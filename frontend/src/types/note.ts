export interface Note {
    id: string
    title: string | null
    content: string | null
    tags: string | null
    created_at: string
    updated_at: string
    is_delete: number
}

export interface NoteListResponse {
    code: number
    message: string
    data: {
        list: Note[]
    }
}

export interface NoteResponse {
    code: number
    message: string
    data: Note | null
}

export interface CreateNoteRequest {
    title?: string
    content?: string
}

export interface UpdateNoteRequest {
    title?: string
    content?: string
}

export interface StreamRequest {
    content_id: string
    prompt: string
}

export interface StreamResponse {
    content_id: string
    message: string
    done: boolean
}

export interface ApiResponse<T> {
    code: number
    message: string
    data: T
}
