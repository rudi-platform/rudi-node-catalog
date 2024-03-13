FROM node:20-alpine3.19

RUN mkdir -p /home/node/rudi-api
WORKDIR /home/node/rudi-api
COPY package.json ./
RUN npm install
COPY . .
CMD npm start


# EXPOSE 7500
