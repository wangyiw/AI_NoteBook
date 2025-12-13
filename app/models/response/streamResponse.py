from pydantic import BaseModel


class StreamResponse(BaseModel):
    """
    流式输出响应模型
    """
    content_id: str 
    """客户端标识"""
    message: str
    """响应内容"""
    done: bool
    """是否完成"""