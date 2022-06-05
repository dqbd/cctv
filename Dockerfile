FROM node:16-alpine3.15 as deps
RUN apk add --update --no-cache libc6-compat git make python2 g++
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

FROM node:16-alpine3.15 as builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN yarn build

FROM node:16-alpine3.15 AS runner
RUN apk add --update --no-cache tzdata
RUN mkdir -p /cctv/config && mkdir -p /cctv/storage
WORKDIR /app

ENV NODE_ENV production

COPY --from=builder /app/scripts ./scripts
RUN /bin/sh /app/scripts/install-ffmpeg.sh

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000
ENV PORT 3000

ENTRYPOINT ["/app/scripts/entrypoint.sh"]
