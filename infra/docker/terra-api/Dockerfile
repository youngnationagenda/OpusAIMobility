# TerraAI PHP API Container
# Multi-stage build: composer install + production runtime
# Validates: Requirements 3.1, 3.2

# ─── Stage 1: Composer dependency install ────────────────────────────────────
FROM composer:2 AS composer-deps

WORKDIR /app

# Copy composer files first for better layer caching
COPY apps/terra-api/composer.json apps/terra-api/composer.lock* ./

# Install production dependencies (no dev)
RUN composer install --no-dev --no-scripts --no-interaction --prefer-dist --optimize-autoloader \
    || composer install --no-dev --no-interaction --prefer-dist --optimize-autoloader

# ─── Stage 2: Production runtime ─────────────────────────────────────────────
FROM php:8.2-fpm-alpine AS runtime

# Install system dependencies for PHP extensions and Nginx
RUN apk add --no-cache \
    nginx \
    curl \
    icu-dev \
    libzip-dev \
    oniguruma-dev

# Install PHP extensions: pdo_mysql, mysqli, and supporting extensions
RUN docker-php-ext-install \
    pdo_mysql \
    mysqli \
    opcache \
    intl \
    mbstring

# Configure PHP-FPM for production
RUN sed -i 's/^listen = .*/listen = 127.0.0.1:9000/' /usr/local/etc/php-fpm.d/www.conf && \
    sed -i 's/^pm = .*/pm = dynamic/' /usr/local/etc/php-fpm.d/www.conf && \
    sed -i 's/^pm.max_children = .*/pm.max_children = 20/' /usr/local/etc/php-fpm.d/www.conf && \
    sed -i 's/^pm.start_servers = .*/pm.start_servers = 4/' /usr/local/etc/php-fpm.d/www.conf && \
    sed -i 's/^pm.min_spare_servers = .*/pm.min_spare_servers = 2/' /usr/local/etc/php-fpm.d/www.conf && \
    sed -i 's/^pm.max_spare_servers = .*/pm.max_spare_servers = 6/' /usr/local/etc/php-fpm.d/www.conf

# PHP production settings
RUN { \
    echo "opcache.enable=1"; \
    echo "opcache.memory_consumption=128"; \
    echo "opcache.interned_strings_buffer=16"; \
    echo "opcache.max_accelerated_files=10000"; \
    echo "opcache.validate_timestamps=0"; \
    echo "opcache.save_comments=1"; \
    echo "expose_php=Off"; \
    echo "memory_limit=256M"; \
    echo "max_execution_time=30"; \
    echo "upload_max_filesize=50M"; \
    echo "post_max_size=55M"; \
    } > /usr/local/etc/php/conf.d/production.ini

# Create required directories
RUN mkdir -p /var/www/html /run/nginx /var/log/nginx /var/tmp/nginx

# Copy Nginx configuration
COPY infra/docker/terra-api/nginx.conf /etc/nginx/nginx.conf

# Copy Composer dependencies from build stage
COPY --from=composer-deps /app/vendor /var/www/html/vendor

# Copy application source
COPY apps/terra-api/src/ /var/www/html/

# Set correct permissions
RUN chown -R www-data:www-data /var/www/html && \
    chmod -R 755 /var/www/html

# Expose HTTP port
EXPOSE 80

# Health check: verify Nginx + PHP-FPM are responding
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://127.0.0.1/health || exit 1

# Start PHP-FPM and Nginx
CMD ["sh", "-c", "php-fpm -D && nginx -g 'daemon off;'"]
