//! RISKOS Direct Market Access (DMA) Financial Information eXchange (FIX) Protocol Engine
//! Supports FIX 4.4 and FIX 5.0 SP2 with zero-copy tag-value parsing and serialization.

use std::collections::HashMap;

pub const SOH: u8 = 0x01; // Start of Header / Tag Delimiter

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum FixMsgType {
    Heartbeat,          // 35=0
    TestRequest,        // 35=1
    ResendRequest,      // 35=2
    Reject,             // 35=3
    Logon,              // 35=A
    Logout,             // 35=5
    NewOrderSingle,     // 35=D
    ExecutionReport,    // 35=8
    OrderCancelRequest, // 35=F
    OrderCancelReject,  // 35=9
    Unknown(String),
}

impl FixMsgType {
    pub fn as_str(&self) -> &str {
        match self {
            FixMsgType::Heartbeat => "0",
            FixMsgType::TestRequest => "1",
            FixMsgType::ResendRequest => "2",
            FixMsgType::Reject => "3",
            FixMsgType::Logon => "A",
            FixMsgType::Logout => "5",
            FixMsgType::NewOrderSingle => "D",
            FixMsgType::ExecutionReport => "8",
            FixMsgType::OrderCancelRequest => "F",
            FixMsgType::OrderCancelReject => "9",
            FixMsgType::Unknown(s) => s.as_str(),
        }
    }

    pub fn from_str(s: &str) -> Self {
        match s {
            "0" => FixMsgType::Heartbeat,
            "1" => FixMsgType::TestRequest,
            "2" => FixMsgType::ResendRequest,
            "3" => FixMsgType::Reject,
            "A" => FixMsgType::Logon,
            "5" => FixMsgType::Logout,
            "D" => FixMsgType::NewOrderSingle,
            "8" => FixMsgType::ExecutionReport,
            "F" => FixMsgType::OrderCancelRequest,
            "9" => FixMsgType::OrderCancelReject,
            other => FixMsgType::Unknown(other.to_string()),
        }
    }
}

#[derive(Debug, Clone, Default)]
pub struct FixMessage {
    pub fields: HashMap<u32, String>,
}

impl FixMessage {
    pub fn new() -> Self {
        Self {
            fields: HashMap::with_capacity(32),
        }
    }

    pub fn set(&mut self, tag: u32, value: impl ToString) {
        self.fields.insert(tag, value.to_string());
    }

    pub fn get(&self, tag: u32) -> Option<&String> {
        self.fields.get(&tag)
    }

    pub fn msg_type(&self) -> FixMsgType {
        match self.get(35) {
            Some(t) => FixMsgType::from_str(t),
            None => FixMsgType::Unknown(String::new()),
        }
    }

    /// Compute standard 3-digit modulo 256 checksum for FIX payload
    pub fn compute_checksum(raw_bytes: &[u8]) -> u32 {
        let sum: u32 = raw_bytes.iter().map(|&b| b as u32).sum();
        sum % 256
    }

    /// Serialize message into wire format: 8=FIX.4.4\x019=...\x0135=...\x0110=...\x01
    pub fn serialize(&self, begin_string: &str) -> Vec<u8> {
        let mut body = Vec::with_capacity(256);

        // Always put tag 35 (MsgType) first in body
        if let Some(msg_type) = self.get(35) {
            body.extend_from_slice(format!("35={}\x01", msg_type).as_bytes());
        }

        for (&tag, val) in &self.fields {
            if tag != 8 && tag != 9 && tag != 35 && tag != 10 {
                body.extend_from_slice(format!("{}={}\x01", tag, val).as_bytes());
            }
        }

        let body_length = body.len();
        let mut wire = Vec::with_capacity(body_length + 64);
        wire.extend_from_slice(format!("8={}\x019={}\x01", begin_string, body_length).as_bytes());
        wire.extend_from_slice(&body);

        let checksum = Self::compute_checksum(&wire);
        wire.extend_from_slice(format!("10={:03}\x01", checksum).as_bytes());
        wire
    }

    /// Zero-copy fast parser from raw wire bytes
    pub fn parse(raw_bytes: &[u8]) -> Result<Self, &'static str> {
        let mut msg = FixMessage::new();
        let mut i = 0;
        let n = raw_bytes.len();

        while i < n {
            let mut tag_end = i;
            while tag_end < n && raw_bytes[tag_end] != b'=' {
                tag_end += 1;
            }
            if tag_end >= n {
                break;
            }

            let tag_str = std::str::from_utf8(&raw_bytes[i..tag_end]).map_err(|_| "Invalid tag utf-8")?;
            let tag: u32 = tag_str.parse().map_err(|_| "Tag parse error")?;

            let mut val_end = tag_end + 1;
            while val_end < n && raw_bytes[val_end] != SOH && raw_bytes[val_end] != b'|' {
                val_end += 1;
            }

            let val_str = std::str::from_utf8(&raw_bytes[tag_end + 1..val_end]).map_err(|_| "Invalid val utf-8")?;
            msg.set(tag, val_str);

            i = val_end + 1;
        }

        if !msg.fields.contains_key(&35) {
            return Err("Missing MsgType tag 35");
        }

        Ok(msg)
    }
}

/// FIX Session Manager maintaining sequence numbers and heartbeat timers
pub struct FixSession {
    pub sender_comp_id: String,
    pub target_comp_id: String,
    pub fix_version: String,
    pub outgoing_seq_num: u64,
    pub incoming_seq_num: u64,
    pub is_logged_on: bool,
}

impl FixSession {
    pub fn new(sender: &str, target: &str, version: &str) -> Self {
        Self {
            sender_comp_id: sender.to_string(),
            target_comp_id: target.to_string(),
            fix_version: version.to_string(),
            outgoing_seq_num: 1,
            incoming_seq_num: 1,
            is_logged_on: false,
        }
    }

    pub fn create_logon(&mut self, heartbeat_int: u32) -> FixMessage {
        let mut msg = FixMessage::new();
        msg.set(35, "A");
        msg.set(49, &self.sender_comp_id);
        msg.set(56, &self.target_comp_id);
        msg.set(34, self.outgoing_seq_num);
        msg.set(108, heartbeat_int);
        msg.set(98, 0); // EncryptMethod: None
        self.outgoing_seq_num += 1;
        msg
    }

    pub fn create_new_order_single(
        &mut self,
        cl_ord_id: &str,
        symbol: &str,
        side: u32, // 1 = Buy, 2 = Sell
        qty: u32,
        price: f64,
        ord_type: u32, // 1 = Market, 2 = Limit
    ) -> FixMessage {
        let mut msg = FixMessage::new();
        msg.set(35, "D");
        msg.set(49, &self.sender_comp_id);
        msg.set(56, &self.target_comp_id);
        msg.set(34, self.outgoing_seq_num);
        msg.set(11, cl_ord_id);
        msg.set(55, symbol);
        msg.set(54, side);
        msg.set(38, qty);
        msg.set(40, ord_type);
        if ord_type == 2 {
            msg.set(44, format!("{:.4}", price));
        }
        msg.set(60, "20261013-16:30:00.000"); // TransactTime
        self.outgoing_seq_num += 1;
        msg
    }
}
