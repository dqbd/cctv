FROM node:14-alpine3.12 as deps
RUN apk add --update --no-cache libc6-compat git make python2 g++
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

FROM node:14-alpine3.12 as builder
WORKDIR /app
COPY . .
COPY --from=deps /app/node_modules ./node_modules
RUN yarn build

FROM node:14-alpine3.12 AS runner
RUN apk add --update --no-cache ffmpeg
RUN mkdir -p /cctv/config && mkdir -p /cctv/storage

WORKDIR /app

ENV NODE_ENV production

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000
ENV PORT 3000

ENTRYPOINT ["node", ".next/server/start.js"]
