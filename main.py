# 提供 fastapi接口
from fastapi import FastAPI, HTTPException, Request, status as http_status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from typing import Optional, Dict, Any
from contextlib import asynccontextmanager
import logging
from datetime import datetime
import uvicorn
import asyncio
import json
from setting import settings, ENV
from app.core.llm import LLMModel
from app.core.llm import LLMConf
from app.core.exceptions import CommonException

# 初始化日志
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    FastAPI应用生命周期管理器
    替代旧的startup和shutdown事件处理器
    """
    # Startup逻辑
    logger.info("Journey Poster 服务正在启动...")
    
    try:
        logger.info(f"Journey Poster 服务启动 - 环境: {ENV}")
        
        # 验证关键配置
        logger.info(f"LLM_URL: {settings.LLM_URL}")
        logger.info(f"LLM_API_KEY: {'已配置' if settings.LLM_API_KEY else '未配置'}")
        logger.info(f"LLM_SCENE_ID: {settings.LLM_SCENE_ID}")
        
        # 初始化图片生成服务
        if settings.LLM_API_KEY and settings.LLM_URL:
            logger.info("火山豆包初始化成功")
        else:
            logger.warning("火山豆包配置不完整，请检查环境变量")
        
        logger.info("Journey Poster 服务启动完成")
        
        # 运行应用
        yield
        
    finally:
        # Shutdown逻辑
        logger.info("Journey Poster 服务正在关闭")
        
        try:
            # 清理资源
            logger.info("清理服务资源")
            
            # 这里可以添加需要清理的资源，比如关闭数据库连接、清理缓存等
            
            logger.info("Journey Poster 服务关闭完成")
        except Exception as e:
            logger.error(f"服务关闭时出错: {e}")

# 主应用程序
app = FastAPI(
    title="AI Notebook",
    description="AI Notebook 服务",
    version="1.0.0",
    lifespan=lifespan  
)

# 统一响应处理函数
async def process_response(data: Dict[str, Any], status: int = 200, success: bool = True, message: Optional[str] = None) -> JSONResponse:
    """
    统一处理API响应
    
    Args:
        data: 待处理的响应数据
        status: HTTP状态码
        success: 响应是否成功
        message: 响应消息
        
    Returns:
        JSONResponse对象
    """
    return JSONResponse(
        status_code=status,
        content={
            "success": success,
            "status": status,
            "message": message or ("成功" if success else "失败"),
            "data": data
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
    except RequestValidationError as e:
        error_details = []
        for error in e.errors():
            error_details.append({
                "loc": error["loc"],
                "msg": error["msg"],
                "type": error["type"]
            })
        logger.error(f"参数验证错误: {str(e)}")
        return JSONResponse(
            status_code=http_status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={
                "success": False,
                "status": http_status.HTTP_422_UNPROCESSABLE_ENTITY,
                "message": "参数验证失败",
                "data": {"detail": error_details}
            }
        )
    except HTTPException as e:
        logger.error(f"HTTP异常: {e.status_code} - {e.detail}")
        return JSONResponse(
            status_code=e.status_code,
            content={
                "success": False,
                "status": e.status_code,
                "message": e.detail,
                "data": None
            }
        )
    except CommonException as e:
        logger.error(f"自定义异常: {e.status} - {e.message}")
        return JSONResponse(
            status_code=e.status,
            content={
                "success": e.success,
                "status": e.status,
                "message": e.message,
                "data": e.data
            }
        )
    except Exception as e:
        logger.error(f"请求异常: {type(e).__name__}: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={"success": False, "status": 500, "message": "服务器内部错误", "data": None}
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
    noteList = NoteService.get_note_list()
    return noteList
@app.post("/textStream",tags = ["流式输出润色笔记"])
async def textStreamGenerator()
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