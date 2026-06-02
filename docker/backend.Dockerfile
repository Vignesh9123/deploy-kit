FROM oven/bun:latest AS pruner
WORKDIR /app
RUN bun install -g turbo
COPY . .
RUN turbo prune backend --docker

FROM oven/bun:latest
WORKDIR /app
COPY --from=pruner /app/out/json/ .
RUN bun install
COPY --from=pruner /app/out/full/ .

WORKDIR /app/apps/backend
CMD ["bun", "run", "dev"]