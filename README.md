# Library Rental Frontend

Мінімалістичний клієнт (Angular 20) для роботи з Library Rental API.

## Основні можливості
- Аутентифікація (вхід / реєстрація) через бекенд JWT
- Перегляд каталогу книг, пошук, базові деталі
- Видача книги (issue) та повернення (return) з розрахунком штрафів
- Продовження (renew) позики в межах ліміту
- Бронювання книги та перегляд власної черги
- Індикація статусів прострочки (due chips) та залишку часу
- Уніфіковані глобальні стилі та утиліти (таблиці, скрол, chips, tabs)
- Легка адаптація API базового URL через `environment` файли

## Швидкий старт
Вимоги: Node 18+ (рекомендовано LTS), бекенд запущений на `http://localhost:5000`.

Встановлення:
```
npm install
```
Запуск (dev):
```
npm start
```
Після старту: http://localhost:4200/

Бекенд (за замовчуванням) очікується на: `http://localhost:5000/api` (див. `src/environment/environment.ts`).

## Конфігурація
API URL змінюється у файлах:
```
src/environment/environment.ts
src/environment/environment.prod.ts
```
Поля:
- `apiUrl` – базовий URL REST API
- `logLevel` – рівень логування в браузері (debug/info)

## Скрипти
```
npm start   # dev сервер (ng serve)
npm run build  # production збірка в dist/
npm test    # юніт тести (Karma/Jasmine)
```

## Структура
```
library-frontend/
	src/
		main.ts            Точка входу
		styles.scss        Глобальні змінні та утиліти (таблиці, chips, tabs)
		app/
			app.routes.ts    Маршрути (standalone)
			core/            Сервіси, інтерсептори, моделі
			features/        Функціональні екрани (auth, books, loans, reservations ...)
			shared/          Перевикористовувані компоненти/директиви (як будуть додаватись)
		environment/       Конфігурація dev/prod
```

## Стилізація
- Використано SCSS + CSS custom properties (`--lib-*`) для теми
- Глобальні класи: `.table-scroll-x`, `.row-actions`, `.empty`, `.loading`, `.chip`, `.pill`, `.due-chip-*`, `.tabs`, `.mono` та ін.
- Компонентні SCSS очищені від дублювання на користь глобальних утиліт

## Продукційна збірка
```
npm run build
```
Файли у `dist/library-frontend/` можна сервити будь-яким статичним сервером (nginx, Netlify, S3 і т.д.).

## Відмінності від початкової версії
- Видалено зайві scaffold інструкції CLI
- Дубльовані стилі винесені в один глобальний файл
- Уніфіковано назви класів і відформатовано код
- Мінімізовано специфічність CSS

## Подальші ідеї (не реалізовано)
- E2E (Playwright / Cypress)
- PWA + офлайн кеш
- Збереження вибору теми (dark/light) у localStorage
- Покриття тестами критичних сценаріїв (issue → renew → return)

## Ліцензія
ISC (як і бекенд)

## Пов’язано
Backend README: `../library-rental-backend/README.md`

