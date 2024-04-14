FROM oven/bun:latest as bun

COPY ./ ./

RUN bun install
RUN bun run build
CMD [ "bun", "run", "preview" ]

