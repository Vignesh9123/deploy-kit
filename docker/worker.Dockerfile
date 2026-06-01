FROM oven/bun:latest AS pruner
WORKDIR /app
RUN bun install -g turbo
COPY . .
RUN turbo prune worker --docker

FROM oven/bun:latest
RUN apt-get update && apt-get install -y \
    curl \
    git \
    ca-certificates \
    gnupg \
    && mkdir -p /etc/apt/keyrings \
    && curl -fsSL https://download.docker.com/linux/debian/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg \
    && echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/debian bookworm stable" > /etc/apt/sources.list.d/docker.list \
    && apt-get update && apt-get install -y docker-ce-cli \
    && rm -rf /var/lib/apt/lists/*

RUN curl -sSL https://railpack.com/install.sh | sh
WORKDIR /app
COPY --from=pruner /app/out/json/ .
RUN bun install
COPY --from=pruner /app/out/full/ .

WORKDIR /app/apps/worker
CMD ["bun", "run", "index.ts"]