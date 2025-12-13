import os
import logging
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import model_validator
from typing import Optional, List
from utils.logger import setup_logging
from concurrent.futures import ThreadPoolExecutor

ENV = os.getenv("ENV", "dev")

class Settings(BaseSettings):

    model_config = SettingsConfigDict(
        env_file=(
            ".env"
            if ENV.lower() in ["test", "sit"]
            else ".env.prd"
            if ENV.lower() in ["prod", "prd"]
            else ".env.dev"
        ),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    ENV: str = ENV

    LOG_PATH: Optional[str] = None
    LOG_COLORFUL: Optional[bool] = None

    LLM_URL: Optional[str] = None
    LLM_API_KEY: Optional[str] = None


    MYSQL_HOST: Optional[str] = None
    MYSQL_PORT: Optional[int] = None
    MYSQL_DATABASE: Optional[str] = None
    MYSQL_USERNAME: Optional[str] = None
    MYSQL_PASSWORD: Optional[str] = None

    DB_ECHO: bool = False
    DB_URL: Optional[str] = None

    LOG_LEVEL: str = "INFO" # "DEBUG" | "INFO"


    @model_validator(mode="after")
    def _build_db_url(self):
        if self.DB_URL:
            return self

        if (
            self.MYSQL_HOST
            and self.MYSQL_PORT
            and self.MYSQL_DATABASE
            and self.MYSQL_USERNAME
            and self.MYSQL_PASSWORD
        ):
            self.DB_URL = (
                f"mysql+pymysql://{self.MYSQL_USERNAME}:{self.MYSQL_PASSWORD}"
                f"@{self.MYSQL_HOST}:{self.MYSQL_PORT}/{self.MYSQL_DATABASE}?charset=utf8mb4"
            )

        if not self.DB_URL:
            raise ValueError(
                "数据库配置不完整：你可以在 env 里不配置 DB_URL，但必须配置 MYSQL_HOST、MYSQL_PORT、MYSQL_DATABASE、MYSQL_USERNAME、MYSQL_PASSWORD（或直接配置 DB_URL）。"
            )

        return self


settings = Settings()

# 创建线程池执行器，全局只需要一个
executor = ThreadPoolExecutor(max_workers=5)

setup_logging(settings.LOG_LEVEL)
logger = logging.getLogger(__name__)
logger.info(f"当前环境ENV 变量->>>>>>>> {ENV} <<<<<<")
