"""
RISKOS FIX 4.4 Institutional Engine: Tag 11 (ClOrdID)
Codec and Invariant Validator #250
"""

class FIXTag_11:
    TAG_NUMBER = 11
    TAG_NAME = "ClOrdID"
    DESCRIPTION = "Unique institutional client order identifier"

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
