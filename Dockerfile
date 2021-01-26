FROM node:12-alpine

RUN apk add --no-cache make gcc g++ python linux-headers udev

WORKDIR /home/node/app

COPY package.json ./
COPY yarn.lock ./

RUN yarn install

COPY . .

EXPOSE 4000

CMD ["node", "index.js"]