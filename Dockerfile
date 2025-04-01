FROM node:20
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
COPY /etc/letsencrypt/live/ottavhq.com/privkey.pem /etc/letsencrypt/live/ottavhq.com/privkey.pem
COPY /etc/letsencrypt/live/ottavhq.com/fullchain.pem /etc/letsencrypt/live/ottavhq.com/fullchain.pem
EXPOSE 3000
CMD ["node", "server.js"]

