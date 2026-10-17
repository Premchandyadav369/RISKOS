//! RISKOS NASDAQ ITCH 5.0 Binary Protocol Parser in Rust
//! Zero-copy packet parsing for low-latency market depth feeds

#[repr(C, packed)]
#[derive(Debug, Clone, Copy)]
pub struct RawAddOrder {
    pub stock_locate: u16,
    pub tracking_number: u16,
    pub timestamp_bytes: [u8; 6],
    pub order_ref_number: u64,
    pub buy_sell_indicator: u8,
    pub shares: u32,
    pub stock: [u8; 8],
    pub price: u32,
}

#[derive(Debug, Clone, PartialEq)]
pub struct DecodedAddOrder {
    pub timestamp_ns: u64,
    pub order_ref: u64,
    pub is_buy: bool,
    pub shares: u32,
    pub symbol: String,
    pub price: f64,
}

pub fn decode_timestamp_48(ts: &[u8; 6]) -> u64 {
    ((ts[0] as u64) << 40)
        | ((ts[1] as u64) << 32)
        | ((ts[2] as u64) << 24)
        | ((ts[3] as u64) << 16)
        | ((ts[4] as u64) << 8)
        | (ts[5] as u64)
}

pub fn parse_itch_add_order(buf: &[u8]) -> Option<DecodedAddOrder> {
    if buf.len() < std::mem::size_of::<RawAddOrder>() {
        return None;
    }

    let raw: RawAddOrder = unsafe {
        std::ptr::read_unaligned(buf.as_ptr() as *const RawAddOrder)
    };

    let ts_ns = decode_timestamp_48(&raw.timestamp_bytes);
    let order_ref = u64::from_be(raw.order_ref_number);
    let is_buy = raw.buy_sell_indicator == b'B';
    let shares = u32::from_be(raw.shares);
    let raw_price = u32::from_be(raw.price);
    let price = raw_price as f64 / 10000.0;

    let symbol_str = std::str::from_utf8(&raw.stock)
        .unwrap_or("")
        .trim_end();

    Some(DecodedAddOrder {
        timestamp_ns: ts_ns,
        order_ref,
        is_buy,
        shares,
        symbol: symbol_str.to_string(),
        price,
    })
}
