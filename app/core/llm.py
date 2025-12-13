from collections.abc import AsyncGenerator
import json
from typing import Union
import time
import logging
import os
from typing import Optional, List
from openai import OpenAI, AsyncOpenAI
from pydantic import BaseModel
from setting import settings
from .exceptions import (
    ErrorCode, 
    LLMException, 
    NetworkException, 
    TimeoutException, 
    AuthException,
    ParamException
) 


logger = logging.getLogger(__name__)

class LLMConf(BaseModel):
    """
    大模型配置 调用LLM 服务
    """
    url: Optional[str] = None
    api_key: Optional[str] = None
    scene_id: Optional[str] = None
    stream_timeout: Optional[int] = None
    post_timeout: Optional[int] = None

class LLMModel:
    """
    LLM 模型调用类，基于 OpenAI 实现
    """

    def __init__(self, conf: LLMConf):
        """
        初始化 LLM 模型

        Args:
            conf: LLM 配置

        Raises:
            ValueError: 当 api_key 无效且环境变量也未设置时抛出
        """
        self.conf = conf
        # 构建默认 headers
        headers = {"Content-Type": "application/json"}
        # 如果有 scene_id，添加到 headers 中
        if conf.scene_id:
            headers["sceneId"] = conf.scene_id

        # 确保 api_key 有效：优先使用配置中的 api_key，如果为 None 或空字符串则尝试从环境变量获取
        api_key = (conf.api_key or "").strip() or os.getenv("OPENAI_API_KEY", "").strip()


        self.client = AsyncOpenAI(base_url=conf.url, api_key=api_key, timeout=30.0, default_headers=headers)

    async def generate(
        self, prompt: str, model_name: str, stream: bool = False, **kwargs
    ) -> Union[str, AsyncGenerator[str, None]]:
        """
        生成文本

        Args:
            prompt: 提示词
            model_name: 大模型名称
            stream: 是否使用流式输出
            **kwargs: 其他参数

        Returns:
            str 或 AsyncGenerator[str, None]: 生成的文本或文本流

        Raises:
            Exception: 调用失败时抛出
        """
        start_time = time.time()
        logger.info(f"开始调用 LLM 生成接口, 模型: {model_name}, 流式: {stream}, Prompt长度: {len(prompt)}")
        try:
            messages = [{"role": "user", "content": prompt}]

            response = await self.client.chat.completions.create(
                model=model_name, messages=messages, stream=stream, **kwargs
            )

            if stream:

                async def stream_generator():
                    async for chunk in response:
                        if chunk.choices[0].delta.content is not None:
                            yield chunk.choices[0].delta.content

                logger.info(f"LLM 生成接口返回流式响应")
                return stream_generator()
            else:
                elapsed_time = time.time() - start_time
                usage = response.usage
                logger.info(
                    f"LLM 生成成功, 模型: {model_name}, "
                    f"耗时: {elapsed_time:.2f}s, "
                    f"Tokens: 提示词={usage.prompt_tokens}, "
                    f"生成={usage.completion_tokens}, "
                    f"总计={usage.total_tokens}"
                )
                return response.choices[0].message.content
        except Exception as e:
            elapsed_time = time.time() - start_time
            error_msg = f"LLM 生成失败, 模型: {model_name}, 耗时: {elapsed_time:.2f}s, 错误: {str(e)}"
            logger.error(error_msg)
            logger.error(e, error_msg)
            raise

    async def chat(
        self, messages: list[dict[str, str]], model_name: str, stream: bool = False, **kwargs
    ) -> Union[str, AsyncGenerator[str, None]]:
        """
        对话生成

        Args:
            messages: 消息列表，格式为 [{"role": "user", "content": "..."}]
            model_name: 大模型名称
            stream: 是否使用流式输出
            **kwargs: 其他参数

        Returns:
            str 或 AsyncGenerator[str, None]: 生成的回复或回复流

        Raises:
            Exception: 调用失败时抛出
        """
        start_time = time.time()
        logger.info(f"开始调用 LLM 对话接口, 模型: {model_name}, 流式: {stream}, 消息数: {len(messages)}")
        try:
            response = await self.client.chat.completions.create(
                model=model_name, messages=messages, stream=stream, **kwargs
            )

            if stream:

                async def stream_generator():
                    async for chunk in response:
                        if chunk.choices[0].delta.content is not None:
                            yield chunk.choices[0].delta.content

                logger.info(f"LLM 对话接口返回流式响应")
                return stream_generator()
            else:
                elapsed_time = time.time() - start_time
                usage = response.usage
                logger.info(
                    f"LLM 对话成功, 模型: {model_name}, "
                    f"耗时: {elapsed_time:.2f}s, "
                    f"Tokens: 提示词={usage.prompt_tokens}, "
                    f"生成={usage.completion_tokens}, "
                    f"总计={usage.total_tokens}"
                )
                return response.choices[0].message.content

        except Exception as e:
            elapsed_time = time.time() - start_time
            error_msg = f"LLM 对话失败, 模型: {model_name}, 耗时: {elapsed_time:.2f}s, 错误: {str(e)}"
            logger.error(error_msg)
            logger.error(e, error_msg)
            raise

    

    async def close(self):
        """
        关闭客户端连接
        """
        await self.client.close()
