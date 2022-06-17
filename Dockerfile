FROM node:16-alpine3.16 as deps
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

FROM node:16-alpine3.16 as builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN yarn build

FROM node:16-alpine3.16 AS runner
RUN apk add --update --no-cache tzdata ffmpeg
RUN mkdir -p /cctv/config && mkdir -p /cctv/storage
WORKDIR /app

ENV NODE_ENV production

COPY --from=builder /app/scripts ./scripts

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000
ENV PORT 3000

ENTRYPOINT ["/app/scripts/entrypoint.sh"]
