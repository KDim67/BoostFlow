
ckerfile
FROM node:20-alpine

WORKDIR /app

COPY package.json ./
COPY package-lock.json ./
RUN npm install

COPY . .

ARG REACT_APP_FIREBASE_API_KEY
ENV REACT_APP_FIREBASE_API_KEY=$REACT_APP_FIREBASE_API_KEY

RUN npm run build

RUN npm install -g serve
CMD ["serve", "-s", "build", "-l", "3000"]

