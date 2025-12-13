from enum import Enum


class GenderEnum(str, Enum):
    """性别枚举 """
    Male = "Male"      # 男
    Female = "Female"  # 女


class CityEnum(str, Enum):
    """城市枚举 """
    Tokyo = "Tokyo"              # 东京
    Paris = "Paris"              # 巴黎
    London = "London"            # 伦敦
    NewYork = "NewYork"          # 纽约
    Bangkok = "Bangkok"          # 曼谷
    Rome = "Rome"                # 罗马
    Madrid = "Madrid"            # 马德里
    Istanbul = "Istanbul"        # 伊斯坦布尔
    Milan = "Milan"              # 米兰
    Singapore = "Singapore"      # 新加坡
    Dubai = "Dubai"              # 迪拜
    Beijing = "Beijing"          # 北京
    Shenzhen = "Shenzhen"        # 深圳
    Berlin = "Berlin"            # 柏林
    KualaLumpur = "KualaLumpur"  # 吉隆坡
    Seoul = "Seoul"              # 首尔
    Shanghai = "Shanghai"        # 上海
    HongKong = "HongKong"        # 香港
    Amsterdam = "Amsterdam"      # 阿姆斯特丹
    Sydney = "Sydney"            # 悉尼


