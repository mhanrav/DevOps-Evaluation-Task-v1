FROM node:18-alpine
WORKDIR /usr/src/app
COPY app/package*.json ./
RUN npm ci --only=production || npm install --production
COPY app/ .
ENV NODE_ENV=production
EXPOSE 3000
CMD ["node","index.js"]
