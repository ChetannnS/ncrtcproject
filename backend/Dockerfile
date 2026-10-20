FROM node:20-bookworm-slim
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
EXPOSE 8100
CMD ["npm", "run", "dev"]
