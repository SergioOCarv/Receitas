# Imagem de PRODUCAO do Bom Bocado (PHP 8.5 + Apache). Serve o web, a fila e o agendador.
# Modelo: ERP-IPSim/producao/Dockerfile. O leitor de links (Chromium + yt-dlp) vira outro conteiner na Fase 7.
FROM php:8.5-apache

COPY --from=mlocati/php-extension-installer:2.9.10 /usr/bin/install-php-extensions /usr/local/bin/
# gd e exif: fotos das receitas e do perfil; mariadb-client: mariadb-dump do backup (Fase 11).
RUN install-php-extensions pdo_mysql intl zip gd exif bcmath pcntl opcache \
 && apt-get update && apt-get install -y --no-install-recommends git unzip mariadb-client \
 && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2.8.12 /usr/bin/composer /usr/local/bin/composer

RUN a2enmod rewrite headers
COPY apache-bombocado.conf /etc/apache2/conf-enabled/zz-bombocado.conf

ENV TZ=America/Sao_Paulo \
    APACHE_DOCUMENT_ROOT=/app/sistema/public
RUN sed -ri 's!/var/www/html!/app/sistema/public!g' /etc/apache2/sites-available/*.conf \
 && git config --system --add safe.directory '*' \
 && cp "$PHP_INI_DIR/php.ini-production" "$PHP_INI_DIR/php.ini" \
 && printf 'expose_php = Off\n' > "$PHP_INI_DIR/conf.d/zz-bombocado.ini"

WORKDIR /app/sistema
# O Apache inicia como root (porta 80); os processos PHP rodam como www-data.
# Fila e agendador rodam como www-data (user: no compose.yaml).
