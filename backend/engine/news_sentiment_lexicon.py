"""
RISKOS Institutional Financial Sentiment Lexicon & Catalyst Taxonomy (news_sentiment_lexicon.py)
Calibrated on Loughran-McDonald (2011) financial domain dictionary & market catalyst taxonomies.
"""

from typing import Dict, List

POSITIVE_FINANCIAL_WORDS: Dict[str, float] = {
    "beat": 0.85, "surge": 0.75, "outperform": 0.80, "record": 0.65, "profit": 0.60,
    "growth": 0.55, "dividend": 0.70, "upgrade": 0.85, "expansion": 0.60, "approval": 0.80,
    "contract": 0.50, "gain": 0.45, "rally": 0.70, "breakout": 0.75, "buyback": 0.80,
    "revenue": 0.40, "bullish": 0.75, "soar": 0.85, "robust": 0.65, "solid": 0.50,
    "tailwind": 0.60, "exceed": 0.80, "highest": 0.70, "inflows": 0.65, "turnaround": 0.85,
    "deal": 0.50, "partnership": 0.65, "acquisition": 0.55, "all-time high": 0.90, "guidance raised": 0.95,
    "order win": 0.85, "credit upgrade": 0.90, "synergy": 0.60, "recovery": 0.70, "margin expansion": 0.85
}

NEGATIVE_FINANCIAL_WORDS: Dict[str, float] = {
    "miss": -0.80, "drop": -0.50, "plunge": -0.85, "loss": -0.65, "deficit": -0.70,
    "downgrade": -0.85, "probe": -0.90, "investigation": -0.85, "subpoena": -0.95, "fraud": -1.0,
    "default": -1.0, "lawsuit": -0.75, "restructuring": -0.60, "bankruptcy": -1.0, "insolvency": -1.0,
    "penalty": -0.80, "fine": -0.70, "decline": -0.45, "fall": -0.40, "slump": -0.70,
    "bearish": -0.70, "crash": -0.95, "selloff": -0.80, "headwind": -0.55, "debt": -0.40,
    "weak": -0.50, "guidance cut": -0.95, "layoffs": -0.65, "margin contraction": -0.80, "scam": -1.0,
    "writedown": -0.85, "impairment": -0.80, "delay": -0.50, "canceled": -0.75, "breach": -0.90
}

CATALYST_TAXONOMY: Dict[str, List[str]] = {
    "EARNINGS": ["earnings", "quarterly", "results", "q1", "q2", "q3", "q4", "net profit", "revenue", "ebitda", "guidance"],
    "CENTRAL_BANK": ["rbi", "fomc", "fed", "repo rate", "rate hike", "rate cut", "inflation", "cpi", "monetary policy"],
    "CORPORATE_ACTION": ["dividend", "buyback", "stock split", "bonus issue", "rights issue", "demerger"],
    "M_AND_A": ["acquisition", "merger", "buyout", "takeover", "divestment", "stake sale", "consortium"],
    "REGULATORY": ["sebi", "sec", "probe", "antitrust", "penalty", "subpoena", "ruling", "compliance", "inspection"],
    "ORDER_WIN": ["order win", "contract", "tender", "procurement", "mou", "agreement", "commissioning"],
    "CREDIT_RATING": ["credit rating", "crisil", "icra", "care", "fitch", "moody", "s&p", "upgrade", "downgrade"]
}

TICKER_ENTITY_MAP: Dict[str, List[str]] = {
    "RELIANCE.NS": ["reliance", "ril", "mukesh ambani", "jio", "reliance retail"],
    "TCS.NS": ["tcs", "tata consultancy", "tata consultancy services"],
    "HDFCBANK.NS": ["hdfc bank", "hdfc", "housing development finance"],
    "INFY.NS": ["infosys", "infy", "salil parekh"],
    "ICICIBANK.NS": ["icici", "icici bank", "sandeep bakhshi"],
    "SBIN.NS": ["sbi", "state bank of india", "state bank"],
    "BHARTIARTL.NS": ["airtel", "bharti airtel", "sunil mittal"],
    "ITC.NS": ["itc", "itc limited"],
    "LT.NS": ["l&t", "larsen", "larsen & toubro"],
    "TATAMOTORS.NS": ["tata motors", "jlr", "jaguar land rover"],
    "SUZLON.NS": ["suzlon", "suzlon energy", "wind turbine"],
    "IDEA.NS": ["vodafone idea", "vi", "idea cellular"],
    "YESBANK.NS": ["yes bank", "prashant kumar"],
    "JPPOWER.NS": ["jaiprakash power", "jp power"],
    "GTLINFRA.NS": ["gtl infra", "gtl infrastructure"],
    "VISAGAR.BO": ["visagar", "visagar financial"],
    "VIKASECO.NS": ["vikas eco", "vikas ecotech"],
    "DISHTV.NS": ["dish tv", "dish tv india"],
    "RTNPOWER.NS": ["rattanpower", "rattanindia power"],
    "URJA.NS": ["urja global", "urja"],
    "SEPC.NS": ["sepc", "sepc limited", "shriram epc"],
    "RPOWER.NS": ["reliance power", "rpower", "anil ambani power"],
    "AAPL": ["apple", "iphone", "tim cook", "ipad", "macbook"],
    "MSFT": ["microsoft", "satya nadella", "azure", "windows", "copilot"],
    "GOOGL": ["google", "alphabet", "sundar pichai", "youtube", "gemini"],
    "AMZN": ["amazon", "andy jassy", "aws", "prime"],
    "NVDA": ["nvidia", "jensen huang", "gpu", "blackwell", "geforce"],
    "TSLA": ["tesla", "elon musk", "cybertruck", "gigafactory"],
    "PLUG": ["plug power", "plug", "hydrogen fuel"],
    "BBAI": ["bigbear.ai", "bbai", "bigbear"],
    "SOUN": ["soundhound", "soundhound ai", "soun"],
    "BITF": ["bitfarms", "bitf", "bitcoin miner"],
    "OPEN": ["opendoor", "opendoor technologies"],
    "CLOV": ["clover health", "clov"],
    "LCID": ["lucid", "lucid motors", "lucid group"],
    "NIO": ["nio", "nio inc", "electric vehicle nio"]
}