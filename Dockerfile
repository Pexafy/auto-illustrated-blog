# Self-hosting: docker build -t auto-illustrated-blog . && docker run -p 3000:3000 --env-file .env.local auto-illustrated-blog
# Add --build-arg BASE_PATH=/some/path to serve the app under a path.
FROM node:22-alpine AS build
WORKDIR /app
ARG BASE_PATH=""
ENV BASE_PATH=$BASE_PATH NEXT_TELEMETRY_DISABLED=1
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
USER node
EXPOSE 3000
CMD ["node", "server.js"]
