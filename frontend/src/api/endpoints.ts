const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8123'

export const ENDPOINTS = {
    // 笔记列表 (GET)
    NOTE_LIST: `${API_BASE_URL}/getNoteList`,

    // 获取单个笔记 (GET)
    NOTE_DETAIL: (id: string) => `${API_BASE_URL}/getNote/${id}`,

    // 创建笔记 (POST)
    CREATE_NOTE: `${API_BASE_URL}/createNote`,

    // 更新笔记 (PATCH)
    UPDATE_NOTE: (id: string) => `${API_BASE_URL}/updateNote/${id}`,

    // 删除笔记 (DELETE)
    DELETE_NOTE: (id: string) => `${API_BASE_URL}/deleteNote/${id}`,

    // 流式润色 (POST, SSE)
    TEXT_STREAM: `${API_BASE_URL}/textStream`,
}

export default ENDPOINTS
