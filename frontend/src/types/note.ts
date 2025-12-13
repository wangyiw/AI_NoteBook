export interface Note {
    id: string
    title: string | null
    content: string | null
    tags: string | null
    created_at: string
    updated_at: string
    deleted_at: string | null
}

export interface NoteListResponse {
    success: boolean
    status: number
    message: string
    data: {
        list: Note[]
    }
}

export interface NoteResponse {
    success: boolean
    status: number
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
    success: boolean
    status: number
    message: string
    data: T
}
