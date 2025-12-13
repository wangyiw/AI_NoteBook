import logging
import os
from logging.handlers import RotatingFileHandler
from typing import Optional


def setup_logging(level: str = "INFO", log_path: Optional[str] = None, colorful: Optional[bool] = None) -> None:
    root = logging.getLogger()

    level_value = getattr(logging, (level or "INFO").upper(), logging.INFO)
    root.setLevel(level_value)

    for h in list(root.handlers):
        root.removeHandler(h)

    formatter = logging.Formatter(
        fmt="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )

    console_handler = logging.StreamHandler()
    console_handler.setLevel(level_value)
    console_handler.setFormatter(formatter)
    root.addHandler(console_handler)

    if log_path:
        os.makedirs(log_path, exist_ok=True)
        file_handler = RotatingFileHandler(
            filename=os.path.join(log_path, "app.log"),
            maxBytes=10 * 1024 * 1024,
            backupCount=5,
            encoding="utf-8",
        )
        file_handler.setLevel(level_value)
        file_handler.setFormatter(formatter)
        root.addHandler(file_handler)
