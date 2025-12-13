from app.repo.note_repo import NoteRepo
from app.models.entity.note import Note
from typing import Optional, List
from sqlalchemy.orm import Session
import uuid
from setting import settings
from app.core.llm import LLMModel, LLMConf
from app.core.prompt import BASE_PROMPT_TEMPLATE
import asyncio


def UUIDGenerator() -> str:
    return str(uuid.uuid4().hex)

class NoteService:
    def __init__(self):
        self.note_repo = NoteRepo()
    
    def get_note(self, id: str, db: Optional[Session] = None) -> Optional[Note]:
        return self.note_repo.get_by_id(id, db=db)
    def get_note_list(self, db: Optional[Session] = None) -> List[Note]:
        return self.note_repo.list_all(db=db)

    def create_note(self,note: Note,db:Session)-> str:
        """
        创建笔记方法
        """
        note.id = UUIDGenerator()
        created_note = self.note_repo.create(note, db=db)
        return created_note.id
    
    def update_note(self, id: str, updates: dict, db: Session) -> Optional[Note]:
        """更新笔记标题、内容或标签"""
        return self.note_repo.update(id, updates, db=db)
    
    def delete_note(self, id: str, db: Session) -> bool:
        """软删除笔记"""
        return self.note_repo.delete(id, db=db)


class NoteStreamService(LLMModel):
    """
    流式生成文字方法
    """

    def __init__(self, conf: Optional[LLMConf] = None):
        if conf is None:
            conf = LLMConf(
                url=settings.LLM_URL,
                api_key=settings.LLM_API_KEY
            )
        if not conf.url:
            raise ValueError("LLM_URL 未配置，无法初始化 LLM 客户端")
        super().__init__(conf)

    async def stream_generate(self, userPrompt: str, test_mode: bool = False):
        """
        异步流式生成文字
        """
        if test_mode:
            # 测试模式下直接返回模拟数据
            yield "测试模式下生成的文字内容..."
            return
        prompt = BASE_PROMPT_TEMPLATE.replace("{{text}}", userPrompt)
        
        stream = await self.chat(
            [{"role": "user", "content": prompt}],
            "qwen-plus",
            stream=True,
        )
        async for chunk in stream:
            yield chunk

if __name__ == "__main__":
    # 测试流式生成
    async def test_stream():
        service = NoteStreamService()
        async for chunk in service.stream_generate("你好，生成一些文字"):
            print(chunk, end="", flush=True)
    
    asyncio.run(test_stream())
