FROM oven/bun:latest AS pruner
WORKDIR /app
RUN bun install -g turbo
COPY . .
RUN turbo prune frontend --docker

FROM oven/bun:latest
WORKDIR /app
COPY --from=pruner /app/out/json/ .
RUN bun install
COPY --from=pruner /app/out/full/ .

WORKDIR /app/apps/frontend

ARG NEXT_PUBLIC_BACKEND_URL
ENV NEXT_PUBLIC_BACKEND_URL=$NEXT_PUBLIC_BACKEND_URL

RUN bun run build

CMD ["bun", "run", "start"]
