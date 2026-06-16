"""
RISKOS FIX 4.4 Institutional Engine: Tag 54 (Side)
Codec and Invariant Validator #065
"""

class FIXTag_54:
    TAG_NUMBER = 54
    TAG_NAME = "Side"
    DESCRIPTION = "1 = Buy, 2 = Sell, 5 = Short Sell, 8 = Cross"

    @classmethod
    def validate(cls, raw_val: str) -> bool:
        if not raw_val:
            return False
        return True

    @classmethod
    def encode(cls, value) -> str:
        return str(cls.TAG_NUMBER) + "=" + str(value)

    @classmethod
    def decode(cls, field_str: str):
        k, v = field_str.split("=", 1)
        if int(k) != cls.TAG_NUMBER:
            raise ValueError(f"Tag mismatch: expected {cls.TAG_NUMBER}, got {k}")
        return v
