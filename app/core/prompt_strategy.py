from abc import ABC, abstractmethod
from typing import Dict, Any
from core.prompt import BASE_PROMPT_TEMPLATE, CITY_SCENES, CLOTHING_TEMPLATES
from core.enum import ModeEnum, StyleEnum, MaterialEnum, ColorEnum, TypeEnum, CityEnum
from model.createPictureReq import CreatePictureRequest


class PromptStrategy(ABC):
    """提示词生成策略基类"""
    
    @abstractmethod
    def generate_prompt(self, request_dto: CreatePictureRequest) -> str:
        """生成提示词"""
        pass


class APromptStrategy(PromptStrategy):
    """大师模式提示词策略"""
    
    

class PromptStrategyFactory:
    """提示词策略工厂"""
    
    @staticmethod
    def get_strategy(mode: ModeEnum) -> PromptStrategy:
        """
        根据模式获取对应的策略
        """



def generate_prompt_by_request(request_dto: CreatePictureRequest) -> str:
    """
    根据请求DTO生成提示词（对外统一接口）
    
    Args:
        request_dto: 请求DTO
        
    Returns:
        str: 生成的提示词
        
    Example:
        >>> from model.createPictureReq import CreatePictureRequest
        >>> from core.enum import CityEnum, ModeEnum, GenderEnum
        >>> 
        >>> request = CreatePictureRequest(
        ...     originPicUrl="https://example.com/image.jpg",
        ...     city=CityEnum.Tokyo,
        ...     sex=GenderEnum.Female,
        ...     mode=ModeEnum.Easy,
        ...     clothes={"items": [...]}
        ... )
        >>> prompt = generate_prompt_by_request(request)
        >>> print(prompt)
    """
    strategy = PromptStrategyFactory.get_strategy(request_dto.mode)
    return strategy.generate_prompt(request_dto)
