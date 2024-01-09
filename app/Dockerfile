FROM node:20-alpine

WORKDIR /app
COPY ./frontend ./frontend
COPY ./backend ./backend
WORKDIR /app/frontend
RUN npm install
RUN npm run build
RUN cp -r ./build ../backend/public
WORKDIR /app/backend
RUN npm install
RUN npm run build
EXPOSE 3001
CMD ["npm", "run", "start:prod"]
