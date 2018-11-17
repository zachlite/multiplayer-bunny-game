FROM node:8.11.4-alpine

WORKDIR /gameserver

COPY package.json .
COPY yarn.lock .

RUN yarn install

COPY . .

EXPOSE 8000
EXPOSE 5555

RUN yarn client:build
RUN NODE_ENV=production yarn server:build

CMD ["yarn", "server:start"]

