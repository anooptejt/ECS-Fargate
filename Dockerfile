FROM node:20-alpine

# Create non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

COPY src/package.json ./
RUN npm install --omit=dev

COPY src/app.js ./

USER appuser

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD wget -qO- http://localhost:8080/api/health || exit 1

ARG APP_VERSION=dev
ENV APP_VERSION=${APP_VERSION}

CMD ["node", "app.js"]
