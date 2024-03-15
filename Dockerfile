# Image with node.js + npm
FROM node:20-alpine3.19

# The node.js app is configured with env. variables transmitted in a JSON file
ARG conf_dir=.
ARG conf_file=.env.json
ARG container_port=3030
ARG db_connection_uri="mongodb://127.0.0.1/rudi_prod"

RUN mkdir -p /home/rudi-api
WORKDIR /home/rudi-api
COPY package.json ./
RUN npm i -q
COPY . "${conf_dir}/${conf_file}" ./

EXPOSE ${container_port}

CMD npm start

