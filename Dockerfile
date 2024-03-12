FROM node:20-alpine3.19

RUN mkdir -p /home/node/app
WORKDIR /home/node/app
COPY package.json ./
RUN npm install


# EXPOSE 7500
