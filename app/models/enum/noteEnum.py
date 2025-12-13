from enum import Enum


class IsDeletedEnum(int, Enum):
    """软删除状态枚举"""
    NOT_DELETED = 0
    DELETED = 1

    @classmethod
    def get_value(cls, name: str) -> int:
        """根据名称获取枚举值"""
        return cls[name].value

    @classmethod
    def get_name(cls, value: int) -> str:
        """根据值获取枚举名称"""
        for member in cls:
            if member.value == value:
                return member.name
        raise ValueError(f"Invalid value: {value}")
