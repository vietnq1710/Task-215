# --- Builder Stage ---
FROM node:22-alpine AS builder

WORKDIR /app

# Copy dependency files first to leverage Docker layer caching
COPY package*.json tsconfig*.json nest-cli.json ./

# Use 'npm ci' for faster, more reliable builds. 
# Using a cache mount speeds up rebuilds significantly.
RUN --mount=type=cache,target=/root/.npm \
    npm ci

# Copy the source code
COPY src ./src

# Build the application
RUN npm run build-bundle

# --- Production Stage ---
FROM node:22-alpine

# Set timezone and standard Node.js production environment variable
ENV TZ=Asia/Ho_Chi_Minh \
    NODE_ENV=production

WORKDIR /app

# RUN apk update
# RUN apk add libreoffice
# RUN apk --no-cache add msttcorefonts-installer fontconfig && \
#     update-ms-fonts && \
#     fc-cache -f

# Change ownership of the working directory to the built-in, unprivileged 'node' user
RUN chown node:node /app

# Switch to the non-root 'node' user for better security
USER node

# Copy configuration files and dependencies list
COPY --chown=node:node package*.json .sequelizerc ./
COPY --chown=node:node sequelize ./sequelize

# Remove husky/prepare scripts, install ONLY prod deps, and clean up cache to save space
# Note: '-only=prod' is deprecated; '--omit=dev' is the modern standard.
RUN npm pkg delete scripts.prepare && \
    npm ci --omit=dev && \
    npm cache clean --force

# Copy the built application from the builder stage
COPY --chown=node:node --from=builder /app/dist ./dist

# Use CMD in exec form (assumes standard NestJS output is main.js)
CMD ["node", "dist/main.js"]