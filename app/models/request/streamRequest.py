from pydantic import BaseModel


class StreamRequest(BaseModel):
    """
    流式问答入参
    """
    # 当前客户端标识 uuid 16位
    content_id: str
    # 用户输入的提示词
    prompt: str