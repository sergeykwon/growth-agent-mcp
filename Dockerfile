# Multi-stage build for the remote (Streamable HTTP) growth-marketing server.
# Deploy to any container host (Railway, Render, Fly, Cloud Run, a VPS) and add
# the resulting https URL as a Claude custom connector.

FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json tsconfig.json ./
RUN npm ci
COPY src ./src
COPY data ./data
RUN npm run build

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/dist ./dist
COPY --from=build /app/data ./data
EXPOSE 3000
# PORT and GROWTH_MARKETING_TOKEN are read from the environment.
CMD ["node", "dist/http.js"]
