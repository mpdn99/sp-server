FROM oven/bun:1.3.5

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --production

COPY src ./src
COPY tsconfig.json ./

EXPOSE 3000
CMD ["bun", "src/server.ts"]
