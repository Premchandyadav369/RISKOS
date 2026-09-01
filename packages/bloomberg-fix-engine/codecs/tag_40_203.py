"""
RISKOS FIX 4.4 Institutional Engine: Tag 40 (OrdType)
Codec and Invariant Validator #203
"""

class FIXTag_40:
    TAG_NUMBER = 40
    TAG_NAME = "OrdType"
    DESCRIPTION = "1 = Market, 2 = Limit, 3 = Stop, 4 = Stop Limit, P = Pegged"

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
