FROM --platform=linux/arm64 oven/bun:latest

COPY package.json ./
COPY bun.lockb ./
COPY src ./

RUN bun install
CMD [ "bun", "run", "index.ts" ]