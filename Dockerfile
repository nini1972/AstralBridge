FROM node:20-slim
WORKDIR /app
COPY shared ./shared
COPY backend ./backend
WORKDIR /app/backend
RUN npm install
RUN npm run build
EXPOSE 8080
ENV PORT=8080
CMD ["node", "dist/backend/src/server.js"]
