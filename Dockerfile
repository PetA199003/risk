FROM node:18-alpine

# Install dependencies needed for Prisma
RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Generate Prisma client
ENV PRISMA_CLI_BINARY_TARGETS=linux-musl
RUN npx prisma generate

# Copy source code
COPY . .

# Build the application
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]