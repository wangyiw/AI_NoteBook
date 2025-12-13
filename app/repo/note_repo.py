# note相关的crud

from datetime import datetime
from typing import Optional, List
from sqlalchemy.orm import Session
from app.models.note import Note
from app.db.base import DB, SessionLocal
from sqlalchemy import select



class NoteRepo(DB[Note]):
    def __init__(self):
        super().__init__(Note)

    def get_by_id(self, id: str, db: Optional[Session] = None) -> Optional[Note]:
        """
        根据ID获取笔记，返回内容和标题（返回Note对象）
        自动过滤已软删除的笔记
        """
        note = self.get(id, db=db)
        if note and note.deleted_at is None:
            return note
        return None

    def list_all(self, db: Optional[Session] = None, offset: int = 0, limit: int = 100) -> List[Note]:
        """
        获取所有未删除的笔记
        """
        session, should_close = self._ensure_session(db)
        try:
            stmt = select(Note).where(Note.deleted_at.is_(None)).offset(offset).limit(limit)
            return list(session.scalars(stmt).all())
        finally:
            if should_close:
                session.close()

    def create_note(self, note: Note, db: Optional[Session] = None) -> Note:
        """
        创建笔记,返回笔记对象
        自动设置 created_at 和 updated_at
        """
        now = datetime.now()
        note.created_at = now
        note.updated_at = now
        return self.create(note, db=db)

    def update_note(self, note: Note, db: Optional[Session] = None) -> Note:
        """
        更新笔记
        自动更新 updated_at
        """
        note.updated_at = datetime.now()
        return self.update(note, db=db)

    def soft_delete(self, id: str, db: Optional[Session] = None) -> bool:
        """
        软删除笔记（设置 deleted_at 字段为当前时间）
        """
        note = self.get(id, db=db)
        if note and note.deleted_at is None:
            note.deleted_at = datetime.now()
            note.updated_at = datetime.now()
            self.update(note, db=db)
            return True
        return False

    def hard_delete(self, id: str, db: Optional[Session] = None) -> bool:
        """
        硬删除笔记（物理删除）
        """
        return self.delete_by_id(id, db=db)