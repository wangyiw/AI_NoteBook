import { baseApi } from '../../app/baseApi'
import type {
    ApiResponse,
    CreateNoteRequest,
    Note,
    NoteListResponse,
    NoteResponse,
    UpdateNoteRequest,
} from '../../types/note'

export const notesApi = baseApi.injectEndpoints({
    endpoints: (build) => ({
        getNoteList: build.query<Note[], void>({
            query: () => ({
                url: '/getNoteList',
                method: 'GET',
            }),
            transformResponse: (response: NoteListResponse) => {
                if (response.code !== 0) {
                    throw new Error(response.message || '获取笔记列表失败')
                }
                return response.data.list
            },
            providesTags: (result) =>
                result
                    ? [
                        { type: 'Note' as const, id: 'LIST' },
                        ...result.map((note) => ({ type: 'Note' as const, id: note.id })),
                    ]
                    : [{ type: 'Note' as const, id: 'LIST' }],
        }),

        getNote: build.query<Note | null, string>({
            query: (id) => ({
                url: `/getNote/${id}`,
                method: 'GET',
            }),
            transformResponse: (response: NoteResponse) => {
                if (response.code !== 0) {
                    throw new Error(response.message || '获取笔记详情失败')
                }
                return response.data
            },
            providesTags: (_result, _error, id) => [{ type: 'Note' as const, id }],
        }),

        createNote: build.mutation<string, CreateNoteRequest>({
            query: (noteData) => ({
                url: '/createNote',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: noteData,
            }),
            transformResponse: (response: ApiResponse<{ id: string }>) => {
                if (response.code !== 0) {
                    throw new Error(response.message || '创建笔记失败')
                }
                return response.data.id
            },
            invalidatesTags: [{ type: 'Note' as const, id: 'LIST' }],
        }),

        updateNote: build.mutation<Note, { id: string; updates: UpdateNoteRequest }>({
            query: ({ id, updates }) => ({
                url: `/updateNote/${id}`,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: updates,
            }),
            transformResponse: (response: NoteResponse) => {
                if (response.code !== 0 || !response.data) {
                    throw new Error(response.message || '更新笔记失败')
                }
                return response.data
            },
            invalidatesTags: (_result, _error, arg) => [
                { type: 'Note' as const, id: arg.id },
                { type: 'Note' as const, id: 'LIST' },
            ],
        }),

        deleteNote: build.mutation<boolean, string>({
            query: (id) => ({
                url: `/deleteNote/${id}`,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            }),
            transformResponse: (response: ApiResponse<null>) => response.code === 0,
            invalidatesTags: (_result, _error, id) => [
                { type: 'Note' as const, id },
                { type: 'Note' as const, id: 'LIST' },
            ],
        }),
    }),
    overrideExisting: false,
})

export const {
    useGetNoteListQuery,
    useGetNoteQuery,
    useCreateNoteMutation,
    useUpdateNoteMutation,
    useDeleteNoteMutation,
} = notesApi
