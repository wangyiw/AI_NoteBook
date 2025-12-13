# 提供 fastapi接口
from fastapi import FastAPI, HTTPException, Request, status as http_status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from fastapi.exceptions import RequestValidationError
from fastapi.encoders import jsonable_encoder
from typing import Optional, Dict, Any
from contextlib import asynccontextmanager
from starlette.exceptions import HTTPException as StarletteHTTPException
import logging
from datetime import datetime
import uvicorn
import asyncio
import json
from setting import settings, ENV
from app.core.llm import LLMModel
from app.core.llm import LLMConf
from app.core.exceptions import CommonException
from app.services.noteService import NoteService, NoteStreamService
from app.models.request.streamRequest import StreamRequest
from app.models.request.noteRequest import CreateNoteRequest, UpdateNoteRequest
from app.models.response.streamResponse import StreamResponse
from app.models.entity.note import Note
from app.db.base import Base, engine

# 初始化日志
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    FastAPI应用生命周期管理器
    替代旧的startup和shutdown事件处理器
    """
    # Startup逻辑
    try:
        logger.info(f"AI Notebook 服务启动 - 环境: {ENV}")

        Base.metadata.create_all(bind=engine)# 启动自动建表

        # 验证关键配置
        if not settings.LLM_API_KEY or not settings.LLM_URL:
            logger.warning("LLM 配置不完整，请检查环境变量")
        
        # 运行应用
        yield
        
    finally:
        # Shutdown逻辑
        logger.info("AI Notebook 服务正在关闭")
        
        try:
            # 清理资源
            logger.info("清理服务资源")
            
            # 这里可以添加需要清理的资源，比如关闭数据库连接、清理缓存等
            
            logger.info("AI Notebook 服务关闭完成")
        except Exception as e:
            logger.error(f"服务关闭时出错: {e}")

# 主应用程序
app = FastAPI(
    title="AI Notebook",
    description="AI Notebook 服务",
    version="1.0.0",
    lifespan=lifespan  
)

@app.exception_handler(RequestValidationError)
async def request_validation_exception_handler(request: Request, exc: RequestValidationError):
    error_details = []
    for error in exc.errors():
        error_details.append({
            "loc": error.get("loc"),
            "msg": error.get("msg"),
            "type": error.get("type"),
            "ctx": error.get("ctx"),
        })
    logger.error(f"参数验证错误: {str(exc)}")
    return JSONResponse(
        status_code=http_status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "code": http_status.HTTP_422_UNPROCESSABLE_ENTITY,
            "message": "参数验证失败",
            "data": {"detail": error_details},
        },
    )


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    logger.error(f"HTTP异常: {exc.status_code} - {exc.detail}")
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "code": exc.status_code,
            "message": exc.detail,
            "data": None,
        },
    )

# 统一响应处理函数
async def process_response(data: Any, status: int = 200, code: int = 0, message: Optional[str] = None) -> JSONResponse:
    """
    统一处理API响应
    
    Args:
        data: 待处理的响应数据
        code: 0-响应成功,其他状态码
        message: 响应消息
        
    Returns:
        JSONResponse对象
    """
    encoded_data = jsonable_encoder(data)
    default_message = "成功" if code == 0 else "失败"
    return JSONResponse(
        status_code=status,
        content={
            "code": code,
            "message": message or default_message,
            "data": encoded_data
        }
    )

# CommonException 已移至 core.exceptions 模块，避免循环导入

# CORS 中间件配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Request-ID", "X-Process-Time"]
)

# 异常处理中间件
@app.middleware("http")
async def exception_middleware(request: Request, call_next):
    try:
        return await call_next(request)
    except CommonException as e:
        logger.error(f"自定义异常: {e.status} - {e.message}")
        error_code = e.error_code.code if getattr(e, "error_code", None) is not None else e.status
        return JSONResponse(
            status_code=e.status,
            content={
                "code": error_code,
                "message": e.message,
                "data": e.data
            }
        )
    except Exception as e:
        logger.error(f"请求异常: {type(e).__name__}: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={"code": 500, "message": "服务器内部错误", "data": None}
        )

@app.get("/")
async def root():
    data = {"service": "AI Notebook", "version": "1.0.0"}
    return await process_response(data, message="AI Notebook 服务运行正常")


@app.get("/health", tags=["Health"])
async def health_check():
    logger.debug("Health check requested")
    data = {"timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")}
    return await process_response(data, message="healthy")

@app.get("/getNoteList",tags = ["获取笔记列表"])
async def getNoteList():
    note_service = NoteService()
    noteList = note_service.get_note_list()
    return await process_response({"list": noteList}, message="获取笔记列表成功")

@app.post("/textStream",tags = ["流式输出润色笔记"])
async def textStreamGenerator(request: StreamRequest):
    """
    流式输出润色笔记
    返回 SSE 格式的流式响应，每个 chunk 都是 StreamResponse 格式
    
    content_id 的作用：
    - 区分“谁发的 update / 谁在编辑”（presence 显示）
    - 多人同一 note 同时操作时，做日志与限流维度
    - 断线重连时把会话关联回来
    """
    
    async def generate_stream():
        stream_service = NoteStreamService()
        content_id = request.content_id
        max_retries = 1
        
        for attempt in range(max_retries + 1):
            try:
                async for chunk in stream_service.stream_generate(request.prompt):
                    response = StreamResponse(
                        content_id=content_id,
                        message=chunk,
                        done=False
                    )
                    yield f"data: {response.model_dump_json()}\n\n"
                
                # 流结束，发送完成标记
                done_response = StreamResponse(
                    content_id=content_id,
                    message="",
                    done=True
                )
                yield f"data: {done_response.model_dump_json()}\n\n"
                return
                
            except Exception as e:
                logger.error(f"LLM 调用失败 (attempt {attempt + 1}/{max_retries + 1}): {str(e)}")
                if attempt < max_retries:
                    logger.info(f"重试中...")
                    await asyncio.sleep(0.5)
                    continue
                else:
                    # 重试失败，返回错误响应
                    error_response = StreamResponse(
                        content_id=content_id,
                        message=f"生成失败: {str(e)}",
                        done=True
                    )
                    yield f"data: {error_response.model_dump_json()}\n\n"
                    return
    
    return StreamingResponse(
        generate_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Content-Id": request.content_id,
        }
    )


@app.get("/getNote/{note_id}", tags=["获取单个笔记"])
async def getNote(note_id: str):
    """
    根据ID获取单个笔记
    """
    note_service = NoteService()
    note = note_service.get_note(note_id)
    if note is None:
        raise HTTPException(status_code=404, detail="笔记不存在")
    return await process_response(note, message="获取笔记成功")


@app.post("/createNote", tags=["创建笔记"])
async def createNote(request: CreateNoteRequest):
    """
    创建新笔记
    """
    note_service = NoteService()

    title = request.title
    content = request.content
    if (title is None or not title.strip()) and (content is None or not content.strip()):
        title = f"新笔记 {datetime.now().strftime('%Y-%m-%d %H:%M')}"
    note = Note(
        id="",
        title=title,
        content=content,
        tags=None,
        created_at=datetime.now(),
        updated_at=datetime.now(),
        is_delete=0
    )
    note_id = note_service.create_note(note, db=None)
    return await process_response({"id": note_id}, message="创建笔记成功")


@app.patch("/updateNote/{note_id}", tags=["更新笔记"])
async def updateNote(note_id: str, request: UpdateNoteRequest):
    """
    更新笔记（标题和内容）
    """
    note_service = NoteService()
    updates = {}
    if request.title is not None:
        updates["title"] = request.title
    if request.content is not None:
        updates["content"] = request.content
    
    if not updates:
        raise HTTPException(status_code=400, detail="没有需要更新的字段")
    
    updated_note = note_service.update_note(note_id, updates, db=None)
    if updated_note is None:
        raise HTTPException(status_code=404, detail="笔记不存在")
    return await process_response(updated_note, message="更新笔记成功")


@app.delete("/deleteNote/{note_id}", tags=["删除笔记"])
async def deleteNote(note_id: str):
    """
    删除笔记（软删除）
    """
    note_service = NoteService()
    success = note_service.delete_note(note_id, db=None)
    if not success:
        raise HTTPException(status_code=404, detail="笔记不存在")
    return await process_response(None, message="删除笔记成功")


# ==================== 主程序入口 ====================

if __name__ == "__main__":
    
    uvicorn.run(
        "main:app",
        host="localhost",
        port=8123,
        reload=False,  # 开发模式下启用热重载
        log_level="info"
    )
# uv run python main.py