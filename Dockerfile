FROM node:20.16.0 as production
WORKDIR /usr/water-and-gas-reading-system
ENV DATABASE_URL="postgresql://root:root@database:5432/wgs?schema=public"
COPY package*.json ./
COPY . .
RUN npm install
RUN npm run build
EXPOSE 80
CMD ["npm", "run", "start:prod"]