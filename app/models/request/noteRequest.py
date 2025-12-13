from pydantic import BaseModel
from typing import Optional


class CreateNoteRequest(BaseModel):
    """
    创建笔记请求
    """
    title: Optional[str] = None
    content: Optional[str] = None


class UpdateNoteRequest(BaseModel):
    """
    更新笔记请求
    """
    title: Optional[str] = None
    content: Optional[str] = None
