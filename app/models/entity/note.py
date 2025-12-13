from datetime import datetime
from typing import Optional
from sqlalchemy import String, Text, DateTime, Index, Integer
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Note(Base):
    """
    笔记实体
    对应表: note

    CREATE TABLE note (
    id          VARCHAR(50) PRIMARY KEY,
    title       VARCHAR(255),
    content     MEDIUMTEXT,              -- MySQL建议用 MEDIUMTEXT 以防万行超长
    tags        TEXT,                    -- 先用 JSON/string 存，后续再拆表
    created_at  DATETIME NOT NULL,
    updated_at  DATETIME NOT NULL,
    deleted_at  DATETIME NULL
    );

    当前数据库字段已调整为 is_delete（int，0 未删除 / 1 已删除），因此 ORM 模型使用 is_delete 字段。

    CREATE INDEX idx_note_updated_at ON note(updated_at);
    CREATE INDEX idx_note_deleted_at ON note(deleted_at);

    """
    __tablename__ = "note"

    id: Mapped[str] = mapped_column(String(50), primary_key=True)
    title: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    content: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    tags: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    is_delete: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    __table_args__ = (
        Index("idx_note_updated_at", "updated_at"),
        Index("idx_note_deleted_at", "is_delete"),
    )
