FROM node:14-alpine
RUN apk add --update --no-cache libc6-compat git make python2 g++
WORKDIR /app
COPY . .

RUN yarn install --frozen-lockfile
RUN yarn build

EXPOSE 3000
CMD ["yarn", "start"]