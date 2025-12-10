# Подготовка к загрузке на GitHub

## Что нужно сделать перед загрузкой

### 1. Инициализировать Git репозиторий

```bash
cd /root/callcenter-app
git init
git add .
git commit -m "Initial commit: Call Center Reporting System"
```

### 2. Создать репозиторий на GitHub

1. Зайдите на https://github.com
2. Нажмите "New repository"
3. Название: `callcenter-reporting-system`
4. Описание: "Web application for call center operator performance tracking and reporting"
5. Выберите Private или Public
6. НЕ создавайте README, .gitignore, license (они уже есть)

### 3. Подключить удаленный репозиторий

```bash
git remote add origin https://github.com/YOUR_USERNAME/callcenter-reporting-system.git
git branch -M main
git push -u origin main
```

---

## Файлы, которые НЕ будут загружены (в .gitignore)

- `node_modules/` - зависимости (устанавливаются через npm)
- `.env` - конфигурация с паролями
- `client/node_modules/` - зависимости frontend
- `client/build/` - собранное приложение
- `*.log` - логи

---

## Что будет загружено

✅ Исходный код (server/, client/src/)  
✅ Конфигурационные файлы (package.json, tailwind.config.js и т.д.)  
✅ Документация (README.md, DEPLOYMENT_COMPLETE.md)  
✅ Скрипты развертывания (deploy.sh, setup-nginx.sh и т.д.)  
✅ Примеры конфигурации (.env.example, env-production)  
✅ SQL схема (server/database/schema.sql)

---

## Структура репозитория

```
callcenter-reporting-system/
├── README.md                    # Главная документация
├── DEPLOYMENT_COMPLETE.md       # Инструкция по развертыванию
├── LICENSE                      # Лицензия (добавьте если нужно)
├── .gitignore                   # Игнорируемые файлы
├── package.json                 # Backend зависимости
├── .env.example                 # Пример конфигурации
├── env-production               # Production конфигурация (пример)
│
├── server/                      # Backend (Node.js + Express)
│   ├── index.js                # Главный файл сервера
│   ├── database/
│   │   ├── db.js              # Подключение к БД
│   │   └── schema.sql         # SQL схема
│   ├── middleware/
│   │   └── auth.js            # Аутентификация
│   ├── routes/
│   │   ├── auth.js            # API авторизации
│   │   ├── operators.js       # API операторов
│   │   └── reports.js         # API отчетов
│   └── scripts/
│       └── init-db.js         # Инициализация БД
│
├── client/                      # Frontend (React)
│   ├── package.json            # Frontend зависимости
│   ├── public/
│   │   └── index.html
│   └── src/
│       ├── index.js
│       ├── App.js
│       ├── components/
│       │   ├── Login.js
│       │   └── Dashboard.js
│       ├── context/
│       │   └── AuthContext.js
│       └── services/
│           └── api.js
│
└── deployment/                  # Скрипты развертывания
    ├── deploy.sh               # Автоматическая установка
    ├── setup-nginx.sh          # Настройка Nginx
    ├── install-service.sh      # Установка systemd сервиса
    ├── quick-start.sh          # Быстрый старт
    └── callcenter.service      # Systemd unit file
```

---

## Рекомендации для README на GitHub

Добавьте в начало README.md:

```markdown
# Call Center Reporting System

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/postgresql-%3E%3D12-blue)](https://www.postgresql.org/)

Веб-приложение для мониторинга и отчетности работы операторов колл-центра.

## 🎯 Возможности

- Управление списком операторов
- Ввод отчетов 3 раза в день (утро, день, вечер)
- Автоматический расчет KPI и метрик
- Дневные и месячные отчеты
- Разграничение прав доступа (Supervisor, Management, Admin)

## 🚀 Быстрый старт

См. [DEPLOYMENT_COMPLETE.md](DEPLOYMENT_COMPLETE.md) для полной инструкции.

## 📸 Скриншоты

(Добавьте скриншоты приложения)
```

---

## Добавление лицензии (опционально)

Если хотите добавить лицензию MIT:

```bash
cat > LICENSE << 'EOF'
MIT License

Copyright (c) 2025 IT-MyDoc

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
EOF
```

---

## Команды для загрузки на GitHub

```bash
# 1. Инициализация
cd /root/callcenter-app
git init
git add .
git commit -m "Initial commit: Call Center Reporting System v1.0.0"

# 2. Подключение к GitHub (замените YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/callcenter-reporting-system.git
git branch -M main

# 3. Загрузка
git push -u origin main
```

---

## После загрузки на GitHub

1. Добавьте описание репозитория
2. Добавьте темы (topics): `callcenter`, `reporting`, `react`, `nodejs`, `postgresql`
3. Добавьте скриншоты в README
4. Настройте GitHub Actions для CI/CD (опционально)
5. Добавьте CONTRIBUTING.md если планируете принимать PR

---

**Готово к загрузке!** 🚀
