# BookRoom — фронтенд бронирования переговорных

React 18 + TypeScript SPA для тестового задания «Система бронирования
переговорных комнат». Работает поверх готового Fastify-бэкенда из `../server`,
использует его REST API и WebSocket-канал для real-time обновлений.

## Быстрый старт

Требуется **Node.js 20+**.

```bash
# 1. Установите зависимости
cd frontend
npm ci

# 2. Запустите бэкенд в отдельном терминале
cd ../server
npm ci
npm run dev            # http://localhost:3000

# 3. Запустите фронтенд
cd ../frontend
npm run dev            # http://localhost:5173
```

Vite настроен на прокси `/api → http://localhost:3000`, а также проксирует
WebSocket на тот же адрес. Никаких переменных окружения задавать не нужно.

## Скрипты

| Команда              | Назначение                                    |
| -------------------- | --------------------------------------------- |
| `npm run dev`        | Локальный dev-сервер                          |
| `npm run build`      | Прод-сборка (tsc + vite build)                |
| `npm run preview`    | Просмотр собранной версии                     |
| `npm run typecheck`  | Проверка типов без сборки                     |
| `npm run lint`       | ESLint                                        |
| `npm test`           | Юнит-тесты (Vitest)                           |
| `npm run test:watch` | Тесты в watch-режиме                          |

## Стек и обоснование выбора

| Направление           | Инструмент                          | Почему                                                                                                                             |
| --------------------- | ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Сборщик               | **Vite 5**                          | Быстрый dev-сервер, простой прокси, из коробки TypeScript.                                                                         |
| UI-фреймворк          | **React 18**                        | Требование ТЗ.                                                                                                                     |
| Роутинг               | **react-router-dom v6**             | Требование ТЗ. Заявленные маршруты `/rooms`, `/rooms/:roomId`, `/bookings` и `*` реализованы через `<Routes>`; `/` → `/rooms` через `<Navigate replace>`. |
| Глобальное состояние  | **Redux Toolkit** + **react-redux** | Хранит `currentUser`, `offices`, `selectedOfficeId`, статус первичной загрузки и статус WS-соединения. Async thunk `bootstrap` грузит `/me` + `/offices`, `data.reset` из WS перезапускает его. |
| Загрузка данных       | Собственный хук `useFetch` + `fetch`| Списки комнат, расписание и мои бронирования — это server cache, не глобальный state, поэтому осознанно не тянем `react-query`/`swr`. Хук: AbortController, keepPreviousData, ручной refetch и инвалидация по WS-событиям. |
| Стили                 | **Tailwind CSS v4** (`@tailwindcss/vite`) | Быстро воспроизвести макет, `@theme` для брендовых токенов, минимум CSS.                                                            |
| Работа со временем    | Нативный `Intl.DateTimeFormat`      | Все конверсии часовых поясов и форматирование дат сделаны без внешних библиотек (см. `src/lib/datetime.ts`).                       |
| Тесты                 | **Vitest** + **React Testing Library** | Тот же движок, что и на бэке. jsdom-окружение и мок `global.fetch`.                                                                |
| Realtime              | Собственный WS-клиент               | Автопереподключение с экспоненциальной паузой, статус подписки, инвалидация закешированных экранов.                                |

## Архитектура

```
frontend/
├── index.html                 // корневой HTML для Vite
├── vite.config.ts             // dev-server, proxy /api → :3000, Vitest
├── src/
│   ├── main.tsx               // <Provider store> + BrowserRouter + App
│   ├── App.tsx                // роутинг: /rooms, /rooms/:roomId, /bookings, *
│   ├── api/
│   │   ├── client.ts          // тонкая обёртка над fetch и все ручки
│   │   ├── errors.ts          // ApiError + признак isConflict (409)
│   │   ├── realtime.ts        // WebSocket-клиент с reconnect
│   │   └── types.ts           // типы DTO
│   ├── hooks/
│   │   ├── useFetch.ts        // универсальный хук загрузки с AbortController
│   │   └── useRealtimeEvent.ts// прямой subscribe на WS-singleton (без Context)
│   ├── store/                 // Redux Toolkit
│   │   ├── index.ts           // configureStore, dispatch(bootstrap()), мостик WS→Redux
│   │   ├── appSlice.ts        // currentUser, offices, selectedOfficeId, статус загрузки
│   │   ├── realtimeSlice.ts   // статус WS-соединения
│   │   ├── selectors.ts       // селекторы
│   │   ├── hooks.ts           // useAppDispatch / useAppSelector
│   │   └── realtimeClient.ts  // singleton WS-клиента
│   ├── lib/
│   │   ├── datetime.ts        // работа с датой/временем/тайм-зонами
│   │   └── bookingSlots.ts    // бизнес-правила: шаг 15 мин, рабочие часы, лимит 30 дней
│   ├── components/
│   │   ├── layout/            // Header, AppLayout, ConnectionBadge
│   │   ├── rooms/             // OfficePicker, RoomFilters, RoomCard,
│   │   │                      // ScheduleTimeline, BookingFormModal и др.
│   │   ├── bookings/          // BookingRow, CancelBookingModal
│   │   └── ui/                // Button, Modal, Popover, Field, Toast, States, Icon
│   ├── pages/                 // RoomsPage, RoomDetailPage, BookingsPage, NotFoundPage
│   ├── styles/global.css      // Tailwind + токены темы
│   └── vite-env.d.ts
└── src/**/__tests__/*.test.(ts|tsx)
```

### Слой данных

* `useFetch` принимает функцию-фетчер `(signal) => Promise<T>` и массив зависимостей.
  Возвращает `{ data, loading, error, refetch }`. При изменении зависимостей
  предыдущий запрос отменяется через `AbortController`, а с `keepPreviousData`
  на экранах не мигает пустой skeleton при перезапросах.
* Все ручки API описаны в `src/api/client.ts` — один компактный объект `api`.
  Ошибки нормализуются в `ApiError` с полем `code`, `status`, `details` и
  геттером `isConflict`.

### Real-time

`createRealtimeClient` открывает `ws://<host>/api/v1/ws`, автоматически
переподключается с паузой `0.5s → 1s → 2s → 5s → 10s`. Экземпляр хранится в
модуле-синглтоне `store/realtimeClient.ts`, чтобы страницы могли подписываться
напрямую, минуя React-контекст.

В `store/index.ts` мостик из клиента в Redux:

* каждое изменение статуса соединения диспатчит `realtime/setStatus` →
  бейдж в шапке (`ConnectionBadge`) читает его селектором;
* событие `data.reset` диспатчит `bootstrap` — заново подгружает `/me` и
  `/offices`.

Хук `useRealtimeEvent(handler)` подписывается на raw-события того же
синглтона; страницы используют его, чтобы дёргать `refetch()`:

* `RoomsPage` — на `room.availability_changed`, `data.reset`.
* `RoomDetailPage` — на `booking.*`, `room.availability_changed`, `data.reset`.
* `BookingsPage` — на `booking.*`, `data.reset`.

Статус соединения показывается бейджем в шапке (`selectRealtimeStatus`).

### Бизнес-правила

`src/lib/bookingSlots.ts`:

* `buildDefaultSlot(timezone)` — берёт текущее локальное время офиса,
  округляет до ближайших 15 минут вверх, ставит длительность 60 мин;
  если рабочий день закончился — переносит на следующий день на 09:00.
* `slotToInterval(slot, timezone)` — переводит выбор пользователя в UTC-интервал
  для API.
* `maxDurationForStart(startTime)` — ограничивает длительность так, чтобы
  бронирование помещалось до 20:00.
* `isSlotInFuture`, `isSlotWithinAdvanceLimit` — валидация «в будущем» и лимита
  30 дней вперёд.

`src/lib/datetime.ts` реализует конвертацию UTC ↔ произвольная IANA-зона через
`Intl.DateTimeFormat` (`formatToParts`) — без сторонних библиотек.

### UX-состояния

Для каждой страницы явно обработаны:

* **loading** — скелетоны `LoadingSkeleton` (единый компонент);
* **error** — общий `ErrorState` с кнопкой «Повторить»;
* **empty** — `EmptyState` с иллюстрацией и опциональным CTA;
* **success/error toast** — короткое уведомление в шапке;
* **409 конфликт** — специальный экран в модалке бронирования с CTA «Выбрать
  другое время».

## Тесты

```bash
npm test
```

Покрыто 7 файлов / 25 тестов. Фокус — на логике, которая легко ломается:

* `src/lib/__tests__/datetime.test.ts` — форматирование, шаг 15 минут, UTC/MSK
  round-trip, работа с датами через полугодия.
* `src/lib/__tests__/bookingSlots.test.ts` — построение дефолтного слота,
  перенос на следующий день, лимит 30 дней, максимальная длительность.
* `src/api/__tests__/client.test.ts` — сериализация query, обработка 204, 409
  → `ApiError.isConflict`.
* `src/components/rooms/__tests__/RoomCard.test.tsx` — включение/отключение
  кнопки в зависимости от `available`, вызов `onBook`.
* `src/components/rooms/__tests__/BookingFormModal.test.tsx` — валидация темы,
  обработка ответа 409 → экран конфликта.
* `src/components/bookings/__tests__/BookingRow.test.tsx` — рендеринг локального
  времени и вызов `onCancel`.
* `src/pages/__tests__/NotFoundPage.test.tsx` — 404 и ссылка на `/rooms`.

## Принятые решения

* **Redux Toolkit — только для глобального состояния.** В стор попадают только
  данные, которые нужны нескольким экранам сразу: текущий пользователь, список
  офисов, выбранный офис, статус первичной загрузки и статус WS. Списки комнат /
  расписаний / моих бронирований — server cache, поэтому остались на своём
  `useFetch` без Redux (иначе получилась бы вторая половина react-query руками).
* **Контекстов нет.** `AppDataProvider` и `RealtimeProvider` были заменены на
  Redux + модуль-синглтон WS-клиента. В коде остался только один провайдер —
  `<Provider store={store}>` в `main.tsx`.
* **Свои UI-примитивы поверх Tailwind.** Простые Button/Modal/Popover/Field
  спроектированы под конкретный макет, без стороннего компонентного набора.
  Компоненты изолированы и заменяемы: при необходимости их можно заменить на
  готовый набор (например, shadcn/ui) без переделки страниц.
* **Selection офиса сохраняется в `localStorage`.** Иначе после перезагрузки
  пользователь снова оказывается на экране «Выберите офис», что не соответствует
  ожидаемому UX по макету.
* **Календарь и слоты времени — свои.** Позволяет строго ограничить выбор датой
  «не в прошлом» и «не дальше 30 дней», а также шагом 15 минут и рабочими
  часами 09:00–20:00 в локальной зоне офиса. Библиотечные пикеры не покрывают
  эти правила без дополнительных настроек.
* **Оптимистичной отмены и .ics-экспорта пока нет.** Это дополнительные задания
  из ТЗ; в текущей поставке приоритет — обязательная функциональность и стабильные
  тесты. Reconnect с индикатором соединения реализован сразу (бесплатно из
  собственного WS-клиента).
* **API ошибки локализованы.** Показываем `error.message` из бэка (он на
  русском) без «двойного перевода».

## Что не реализовано

Из блока «Дополнительные задания» ТЗ:

* оптимистичная отмена с rollback;
* экспорт `.ics`;
* повторяющиеся бронирования;
* автоматический ресинк расписания после `data.reset` уже реализован; отдельная
  логика полного resync после долгого reconnect по времени также покрывается
  текущей инвалидацией (все страницы дёргают REST после потери соединения).
