from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from typing import Any, Generic, Optional, Sequence, Type, TypeVar

from sqlalchemy import select
from sqlalchemy.orm import Session
from app.config import settings


class Base(DeclarativeBase):
    pass

# 避免连接泄漏，重复创建
engine = create_engine(
    settings.DB_URL,
    echo=settings.DB_ECHO,
    pool_pre_ping=True,
    pool_recycle=1800,
    pool_size=20,
    max_overflow=30,
    pool_timeout=30,
    isolation_level="READ COMMITTED",
)

SessionLocal = sessionmaker(
    bind=engine,
    autocommit=False,
    autoflush=False,
)


ModelType = TypeVar("ModelType")

class DB(Generic[ModelType]):
    def __init__(self, model: Type[ModelType]):
        self.model = model

    def _ensure_session(self, db: Optional[Session]) -> tuple[Session, bool]:
        if db is None:
            return SessionLocal(), True
        return db, False

    def get(self, id: Any, db: Optional[Session] = None) -> Optional[ModelType]:
        session, should_close = self._ensure_session(db)
        try:
            return session.get(self.model, id)
        finally:
            if should_close:
                session.close()

    def list(
        self,
        db: Optional[Session] = None,
        *,
        offset: int = 0,
        limit: int = 100,
        order_by: Any = None,
    ) -> Sequence[ModelType]:
        session, should_close = self._ensure_session(db)
        try:
            stmt = select(self.model)
            if order_by is not None:
                stmt = stmt.order_by(order_by)
            stmt = stmt.offset(offset).limit(limit)
            return list(session.scalars(stmt).all())
        finally:
            if should_close:
                session.close()

    def create(self, obj: ModelType, db: Optional[Session] = None, *, commit: bool = True) -> ModelType:
        session, should_close = self._ensure_session(db)
        try:
            session.add(obj)
            if commit:
                session.commit()
                session.refresh(obj)
            return obj
        finally:
            if should_close:
                session.close()

    def update(self, obj: ModelType, db: Optional[Session] = None, *, commit: bool = True) -> ModelType:
        session, should_close = self._ensure_session(db)
        try:
            session.add(obj)
            if commit:
                session.commit()
                session.refresh(obj)
            return obj
        finally:
            if should_close:
                session.close()

    def delete(self, obj: ModelType, db: Optional[Session] = None, *, commit: bool = True) -> None:
        session, should_close = self._ensure_session(db)
        try:
            session.delete(obj)
            if commit:
                session.commit()
        finally:
            if should_close:
                session.close()

    def delete_by_id(self, id: Any, db: Optional[Session] = None, *, commit: bool = True) -> bool:
        session, should_close = self._ensure_session(db)
        try:
            obj = session.get(self.model, id)
            if obj is None:
                return False
            session.delete(obj)
            if commit:
                session.commit()
            return True
        finally:
            if should_close:
                session.close()

