#!/bin/bash

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

clear

echo -e "${BLUE}"
cat << "EOF"
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║     СИСТЕМА ОТЧЕТНОСТИ КОЛЛ-ЦЕНТРА                        ║
║     Call Center Reporting System                          ║
║                                                            ║
║     Quick Start Installation                              ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

echo -e "${YELLOW}Этот скрипт выполнит полную установку и настройку системы.${NC}"
echo -e "${YELLOW}Процесс займет 5-10 минут.${NC}\n"

read -p "Продолжить? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
fi

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
  echo -e "${RED}Пожалуйста, запустите с правами root (используйте sudo)${NC}"
  exit 1
fi

# Step 1: Deploy infrastructure
echo -e "\n${GREEN}[Шаг 1/7] Установка системных компонентов...${NC}"
chmod +x deploy.sh
./deploy.sh

if [ $? -ne 0 ]; then
    echo -e "${RED}Ошибка при установке системных компонентов${NC}"
    exit 1
fi

# Step 2: Configure environment
echo -e "\n${GREEN}[Шаг 2/7] Настройка окружения...${NC}"
if [ ! -f .env ]; then
    cp env-production .env
    echo -e "${YELLOW}Создан файл .env${NC}"
    echo -e "${RED}⚠️  ВАЖНО: Измените JWT_SECRET в файле .env!${NC}"
fi

# Step 3: Initialize database
echo -e "\n${GREEN}[Шаг 3/7] Инициализация базы данных...${NC}"
node server/scripts/init-db.js

if [ $? -ne 0 ]; then
    echo -e "${RED}Ошибка при инициализации базы данных${NC}"
    exit 1
fi

# Step 4: Build frontend
echo -e "\n${GREEN}[Шаг 4/7] Сборка frontend приложения...${NC}"
cd client
npm run build
cd ..

if [ $? -ne 0 ]; then
    echo -e "${RED}Ошибка при сборке frontend${NC}"
    exit 1
fi

# Step 5: Setup Nginx
echo -e "\n${GREEN}[Шаг 5/7] Настройка Nginx...${NC}"
chmod +x setup-nginx.sh
./setup-nginx.sh

# Step 6: Setup SSL (optional, requires domain)
echo -e "\n${GREEN}[Шаг 6/7] Настройка SSL сертификата...${NC}"
echo -e "${YELLOW}Хотите настроить SSL сертификат сейчас?${NC}"
echo -e "${YELLOW}(Требуется, чтобы домен call.it-mydoc.ru указывал на этот сервер)${NC}"
read -p "Настроить SSL? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    certbot --nginx -d call.it-mydoc.ru
fi

# Step 7: Install and start service
echo -e "\n${GREEN}[Шаг 7/7] Установка и запуск сервиса...${NC}"
chmod +x install-service.sh
./install-service.sh

# Final message
echo -e "\n${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                                            ║${NC}"
echo -e "${GREEN}║     ✓ УСТАНОВКА ЗАВЕРШЕНА УСПЕШНО!                        ║${NC}"
echo -e "${GREEN}║                                                            ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"

echo -e "\n${BLUE}📋 Информация для входа:${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "🌐 URL: ${GREEN}https://call.it-mydoc.ru${NC}"
echo -e ""
echo -e "👤 Учетные записи:"
echo -e "   Supervisor: ${GREEN}supervisor${NC} / ${GREEN}supervisor123${NC}"
echo -e "   Manager:    ${GREEN}manager${NC} / ${GREEN}manager123${NC}"
echo -e "   Admin:      ${GREEN}admin${NC} / ${GREEN}admin123${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

echo -e "\n${BLUE}🔧 Полезные команды:${NC}"
echo -e "   Статус:     ${GREEN}systemctl status callcenter${NC}"
echo -e "   Перезапуск: ${GREEN}systemctl restart callcenter${NC}"
echo -e "   Логи:       ${GREEN}journalctl -u callcenter -f${NC}"

echo -e "\n${RED}⚠️  ВАЖНО:${NC}"
echo -e "   1. Смените пароли по умолчанию!"
echo -e "   2. Измените JWT_SECRET в файле .env"
echo -e "   3. Перезапустите сервис после изменения .env"

echo -e "\n${GREEN}Спасибо за использование системы!${NC}\n"
