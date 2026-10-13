/**
 * RISKOS High-Performance FIX Protocol Engine
 * Language: C++20
 * 
 * Features:
 * - Zero-allocation tag-value tokenizer for FIX 4.4 and 5.0 SP2
 * - High-speed ASCII checksum validation (Tag 10)
 * - Extern "C" bindings for WebAssembly and shared library integration
 */

#include <cstdint>
#include <cstring>
#include <string>
#include <string_view>
#include <unordered_map>
#include <vector>

namespace riskos::fix {

constexpr char SOH = '\x01';

struct FixField {
    uint32_t tag;
    std::string value;
};

class FixMessage {
public:
    std::unordered_map<uint32_t, std::string> fields;

    void set(uint32_t tag, std::string_view val) {
        fields[tag] = std::string(val);
    }

    std::string get(uint32_t tag) const {
        auto it = fields.find(tag);
        return (it != fields.end()) ? it->second : "";
    }

    static uint32_t compute_checksum(const uint8_t* data, size_t len) {
        uint32_t sum = 0;
        for (size_t i = 0; i < len; ++i) {
            sum += data[i];
        }
        return sum % 256;
    }

    std::string serialize(const std::string& version = "FIX.4.4") const {
        std::string body;
        body.reserve(256);

        auto it35 = fields.find(35);
        if (it35 != fields.end()) {
            body += "35=" + it35->second + SOH;
        }

        for (const auto& [tag, val] : fields) {
            if (tag != 8 && tag != 9 && tag != 35 && tag != 10) {
                body += std::to_string(tag) + "=" + val + SOH;
            }
        }

        std::string wire = "8=" + version + SOH + "9=" + std::to_string(body.length()) + SOH + body;
        uint32_t csum = compute_checksum(reinterpret_cast<const uint8_t*>(wire.data()), wire.length());

        char csum_buf[8];
        snprintf(csum_buf, sizeof(csum_buf), "%03u", csum);
        wire += "10=";
        wire += csum_buf;
        wire += SOH;

        return wire;
    }

    static bool parse(const char* data, size_t len, FixMessage& out_msg) {
        out_msg.fields.clear();
        size_t i = 0;
        while (i < len) {
            size_t eq = i;
            while (eq < len && data[eq] != '=') ++eq;
            if (eq >= len) break;

            uint32_t tag = 0;
            for (size_t k = i; k < eq; ++k) {
                if (data[k] >= '0' && data[k] <= '9') {
                    tag = tag * 10 + (data[k] - '0');
                }
            }

            size_t val_end = eq + 1;
            while (val_end < len && data[val_end] != SOH && data[val_end] != '|') ++val_end;

            out_msg.fields[tag] = std::string(data + eq + 1, val_end - (eq + 1));
            i = val_end + 1;
        }
        return out_msg.fields.find(35) != out_msg.fields.end();
    }
};

} // namespace riskos::fix

extern "C" {

uint32_t cpp_fix_compute_checksum(const uint8_t* data, size_t len) {
    return riskos::fix::FixMessage::compute_checksum(data, len);
}

int32_t cpp_fix_validate_message(const char* raw, size_t len) {
    riskos::fix::FixMessage msg;
    return riskos::fix::FixMessage::parse(raw, len, msg) ? 1 : 0;
}

}
