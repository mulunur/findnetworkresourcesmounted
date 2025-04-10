FROM node:12-slim 
# в 12 версии нет SEA

WORKDIR /app

COPY . .

RUN node --experimental-sea-config sea-config.json  && \
    cp $(command -v node) networkResourcesList-Linux && \
    npx postject networkResourcesList-Linux NODE_SEA_BLOB sea-prep.blob \
    --sentinel-fuse NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2 