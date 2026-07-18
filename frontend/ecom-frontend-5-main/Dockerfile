# Build stage
FROM node:18-alpine AS build

WORKDIR /app

COPY package*.json ./
COPY . .

RUN npm install
RUN npm run build

# Dev stage
FROM node:18-alpine AS dev
WORKDIR /app

COPY package*.json ./
COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host"]
