"""
RISKOS FIX 4.4 Institutional Engine: Tag 59 (TimeInForce)
Codec and Invariant Validator #009
"""

class FIXTag_59:
    TAG_NUMBER = 59
    TAG_NAME = "TimeInForce"
    DESCRIPTION = "0 = Day, 1 = Good Till Cancel (GTC), 3 = Immediate or Cancel (IOC), 4 = Fill or Kill (FOK)"

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
