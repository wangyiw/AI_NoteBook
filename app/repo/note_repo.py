# note相关的crud

from datetime import datetime
from typing import Optional, List
from sqlalchemy.orm import Session
from app.models.entity.note import Note
from app.db.base import DB, SessionLocal
from sqlalchemy import select, or_



class NoteRepo(DB[Note]):
    def __init__(self):
        super().__init__(Note)

    def get_by_id(self, id: str, db: Optional[Session] = None) -> Optional[Note]:
        """
        根据ID获取笔记，返回内容和标题（返回Note对象）
        自动过滤已软删除的笔记
        """
        note = self.get(id, db=db)
        if note and (getattr(note, "is_delete", 0) in (0, None)):
            return note
        return None

    def list_all(self, db: Optional[Session] = None) -> List[Note]:
        """
        获取所有未删除的笔记,按更新时间降序排列
        """
        session, should_close = self._ensure_session(db)
        try:
            stmt = select(Note).where(or_(Note.is_delete == 0, Note.is_delete.is_(None))).order_by(Note.updated_at.desc())
            return list(session.scalars(stmt).all())
        finally:
            if should_close:
                session.close()

    def update(self, id: str, updates: dict, db: Optional[Session] = None) -> Optional[Note]:
        session, should_close = self._ensure_session(db)
        try:
            note = session.get(Note, id)
            if note is None or getattr(note, "is_delete", 0) not in (0, None):
                return None
            for k, v in updates.items():
                if hasattr(note, k):
                    setattr(note, k, v)
            note.updated_at = datetime.now()
            session.add(note)
            session.commit()
            session.refresh(note)
            return note
        finally:
            if should_close:
                session.close()

    def delete(self, id: str, db: Optional[Session] = None) -> bool:
        return self.soft_delete(id, db=db)

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
        updates = {
            "title": note.title,
            "content": note.content,
            "tags": note.tags,
        }
        updated = self.update(note.id, updates, db=db)
        if updated is None:
            raise ValueError("笔记不存在")
        return updated

    def soft_delete(self, id: str, db: Optional[Session] = None) -> bool:
        """
        软删除笔记（设置 deleted_at 字段为当前时间）
        """
        note = self.get(id, db=db)
        if note is None or getattr(note, "is_delete", 0) not in (0, None):
            return False

        updates = {
            "is_delete": 1,
        }
        updated = self.update(id, updates, db=db)
        return updated is not None

    def hard_delete(self, id: str, db: Optional[Session] = None) -> bool:
        """
        硬删除笔记（物理删除）
        """
        return self.delete_by_id(id, db=db)