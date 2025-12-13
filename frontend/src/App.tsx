import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { NoteDetail } from './pages/NoteDetail/NoteDetail'
import { NoteList } from './pages/NoteList/NoteList'
import './styles/global.css'

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Navigate to="/notes" replace />} />
                <Route path="/notes" element={<NoteList />} />
                <Route path="/notes/:id" element={<NoteDetail />} />
                <Route path="*" element={<Navigate to="/notes" replace />} />
            </Routes>
        </BrowserRouter>
    )
}

export default App
