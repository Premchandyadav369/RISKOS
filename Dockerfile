# Multi-stage production container build for RISKOS Terminal
# Stage 1: Build native C++ and Rust components
FROM rust:1.80-alpine AS rust-builder
WORKDIR /build
RUN apk add --no-cache build-base clang cmake
COPY rust/ ./rust/
WORKDIR /build/rust
RUN cargo build --release

# Stage 2: Production Web & Node.js Runtime
FROM node:20-alpine AS production
WORKDIR /usr/share/nginx/html

# Install Nginx and lightweight web server utilities
RUN apk add --no-cache nginx curl bash

# Copy static frontend terminal assets
COPY . /usr/share/nginx/html/

# Copy compiled native libraries from builder
COPY --from=rust-builder /build/rust/target/release/libriskos_core.* /usr/share/nginx/html/bin/

# Configure high-performance Nginx reverse proxy
RUN echo 'server { \
    listen 80; \
    server_name localhost; \
    root /usr/share/nginx/html; \
    index index.html app.html; \
    location / { \
        try_files $uri $uri/ /index.html; \
        add_header Cache-Control "no-cache"; \
        add_header Cross-Origin-Opener-Policy "same-origin"; \
        add_header Cross-Origin-Embedder-Policy "require-corp"; \
    } \
}' > /etc/nginx/http.d/default.conf

EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s CMD curl -f http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
