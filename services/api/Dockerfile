FROM node:22-alpine AS build
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY services/api ./services/api
COPY tsconfig.json ./
EXPOSE 3001
CMD ["pnpm", "api:start"]
