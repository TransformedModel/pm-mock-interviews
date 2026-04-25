# Build from the repository root (not only `web/`) so `question-bank/` is available.

FROM node:22-alpine AS builder
WORKDIR /app
COPY question-bank ./question-bank
COPY web ./web
WORKDIR /app/web
RUN npm ci && npm run build

FROM node:22-alpine AS runner
WORKDIR /app/web
ENV NODE_ENV=production
COPY --from=builder /app/web/.next ./.next
COPY --from=builder /app/web/public ./public
COPY --from=builder /app/web/package.json ./package.json
COPY --from=builder /app/web/package-lock.json ./package-lock.json
COPY --from=builder /app/web/node_modules ./node_modules
COPY --from=builder /app/web/question-bank ./question-bank
RUN test -f question-bank/categories/product_design.yaml
EXPOSE 3000
CMD ["npm", "run", "start"]
