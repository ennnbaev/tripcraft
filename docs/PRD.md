# TripCraft: PRD

**Продукт:** TripCraft, AI-планировщик путешествий
**Автор:** Danylo Yenbaiev
**Статус:** Draft v0.1, 2026-10-23
**Контекст:** Workplace Task из Personal Development Plan, цель «Study Artificial Intelligence technologies»

---

## 1. Суть

Пользователь указывает, куда и когда едет, какой у него бюджет и что ему интересно. TripCraft с помощью LLM строит маршрут по дням: места, время, примерные цены и советы. Маршрут можно сохранить, а любой день перегенерировать с комментарием, например «меньше музеев, больше еды».

## 2. Цели

**Продуктовые:**
- За минуту получить готовый и реалистичный план поездки вместо часов поиска.
- Давать возможность точечно править план без пересборки всего маршрута.

**Учебные (для отчёта по PDP):**
- Спроектировать и реализовать Java-backend, интегрированный с LLM через API.
- Использовать **prompt templates** для стабильных и полезных ответов.
- Получать от модели **структурированный ответ** (JSON → Java record) с валидацией.
- Хранить запросы к AI и их метрики в БД для анализа.
- Сделать интеграцию **provider-agnostic**: Gemini, Groq или OpenAI переключаются конфигом.

## 3. Non-goals (вне скоупа)

- Бронирование отелей и билетов, реальные цены из внешних API.
- Мобильное приложение.
- Мультиязычность UI (интерфейс на английском, маршрут можно запросить на любом языке).
- Продакшн-деплой с масштабированием.

## 4. Пользователь и сценарии

**Персона:** человек 20–45 лет, который сам планирует поездки и не хочет тратить вечера на сбор маршрута из блогов.

**User stories:**
1. Как путешественник, я хочу ввести город, даты, бюджет и интересы и получить план по дням.
2. Как путешественник, я хочу видеть примерную стоимость каждого пункта и всего дня.
3. Как путешественник, я хочу перегенерировать один день с комментарием, не теряя остальной план.
4. Как путешественник, я хочу сохранять поездки и возвращаться к ним.
5. Как путешественник, я хочу получить список вещей в дорогу.
6. Как разработчик или владелец продукта, я хочу видеть статистику AI-запросов: количество, токены, время ответа, ошибки.

## 5. Функциональные требования

### 5.1 MVP (P0)

**F1. Форма новой поездки**
- Поля: `destination` (текст), `startDate`, `endDate`, `travelers` (1–10), `budgetLevel` (ECONOMY / MEDIUM / PREMIUM), `interests` (мультивыбор: FOOD, MUSEUMS, NATURE, NIGHTLIFE, SHOPPING, HISTORY, ART, SPORT), `pace` (RELAXED / BALANCED / ACTIVE), `notes` (опционально, свободный текст).
- Валидация: даты не в прошлом, `endDate >= startDate`, длительность до 14 дней.
- Критерий приёмки: при невалидном вводе backend возвращает 400 с понятным сообщением по полю.

**F2. Генерация маршрута**
- Backend вызывает LLM с шаблонами `itinerary-system` и `itinerary-generate`.
- Ответ маппится в `Itinerary` (схема в разделе 7) и сохраняется в `trips.itinerary` (JSONB).
- Если JSON невалиден, делается 1 автоматический retry, затем возвращается ошибка 502 с понятным текстом.
- Backend проверяет, что в ответе ровно `N` дней (N = endDate − startDate + 1) с `dayNumber` от 1 до N. Несовпадение считается невалидным ответом и идёт в retry.
- Критерий приёмки: на запрос «Tbilisi, 3 дня, MEDIUM, FOOD+HISTORY» приходят 3 дня по 3–6 активностей с ценами и общим бюджетом.

**F3. Просмотр маршрута**
- Карточки по дням: заголовок дня, активности по слотам (MORNING / AFTERNOON / EVENING), время, описание, примерная цена, категория.
- Итог: общий примерный бюджет и 3–5 практических советов.
- Подпись: «Цены и детали примерные, проверяйте перед поездкой».

**F4. Перегенерация дня**
- Кнопка «Regenerate day» и поле для комментария.
- Шаблон `day-regenerate` получает весь маршрут как контекст, номер дня и комментарий. Возвращается только новый `Day`.
- Остальные дни не меняются, `totalEstimatedCost` и `totalEstimatedCostUsd` пересчитываются на backend.
- Если LLM вернула ошибку или невалидный день (после retry), сохранённый маршрут не меняется, ответ 502.
- `dayNumber` вне диапазона дней поездки → 400.
- Новый день должен быть непохож на остальные по местам: шаблон получает список уже использованных названий и просит их не повторять.

**F5. Мои поездки**
- Список: направление, даты, дата создания. Действия: открыть, удалить.

**F6. Логирование AI-запросов**
- Каждый вызов LLM пишет строку в `ai_requests`: шаблон, версия шаблона, провайдер, модель, токены (если провайдер их вернул), latency, статус, ошибка.

### 5.2 Phase 2 (P1, если будет время)

- **F7. Packing list:** шаблон `packing-list`, результат хранится в `trips.packing_list`.
- **F8. Страница статистики:** запросы по дням, средняя latency, доля ошибок, токены по провайдерам.
- **F9. Streaming:** маршрут появляется постепенно (SSE).
- **F10. Карта:** точки активностей на Leaflet + OpenStreetMap (координаты от модели или через геокодинг Nominatim).

### 5.3 Phase 3 (P2)

- Авторизация (Spring Security + JWT). До этого используется один демо-пользователь.
- Ссылка «поделиться поездкой» (read-only).
- Экспорт в PDF.
- Кэш одинаковых запросов (Redis).

## 6. Prompt templates

Файлы лежат в `backend/src/main/resources/prompts/` в формате Spring AI `PromptTemplate`. Версия шаблонов задаётся в `app.ai.prompt-version` и пишется в лог.

| Шаблон | Тип | Переменные | Что делает |
|---|---|---|---|
| `itinerary-system.st` | system | — | Роль «опытный локальный тревел-планер». Правила: только реальные известные места; реалистичная логистика (близкие места в один день, учёт переездов); цены в местной валюте и в USD как оценка; учитывать темп и бюджет; отвечать строго по JSON-схеме без текста вокруг. |
| `itinerary-generate.st` | user | `destination, startDate, endDate, days, travelers, budgetLevel, interests, pace, notes, language` | Запрос на полный маршрут |
| `day-regenerate.st` | user | `itineraryJson, dayNumber, feedback` | Переделать только указанный день с учётом фидбека, не повторяя места из других дней |
| `packing-list.st` | user | `destination, startDate, endDate, activities` | Список вещей по категориям |

**Как добиваемся стабильности:**
- Spring AI `BeanOutputConverter` / `.entity(Itinerary.class)`: схема генерируется из Java record и добавляется в промпт.
- Низкая `temperature` (0.3).
- Валидация результата (Bean Validation на record'ах) и 1 retry при ошибке.
- Few-shot не используем, чтобы экономить токены на бесплатных лимитах. Добавим, если качество будет нестабильным.

## 7. Схема ответа модели (Itinerary)

```json
{
  "destination": "Tbilisi, Georgia",
  "currency": "GEL",
  "days": [
    {
      "dayNumber": 1,
      "date": "2026-11-10",
      "title": "Old Town and sulfur baths",
      "activities": [
        {
          "slot": "MORNING",
          "time": "09:30",
          "name": "Narikala Fortress",
          "description": "Walk up or take the cable car for city views.",
          "category": "HISTORY",
          "estimatedCost": 0,
          "estimatedCostUsd": 0,
          "durationMinutes": 90
        }
      ],
      "dayEstimatedCost": 120
    }
  ],
  "totalEstimatedCost": 360,
  "totalEstimatedCostUsd": 133,
  "tips": ["Use Bolt for taxis", "..."]
}
```

Java: `Itinerary`, `Day`, `Activity`, enum `Slot`, enum `Category`, всё в виде `record`.

## 8. Архитектура

```
React (Vite, TS, Tailwind, TanStack Query)
        │  /api (JSON)
        ▼
Spring Boot 3.5 (Java 21)
  ├─ web      : REST-контроллеры, DTO, валидация, обработка ошибок
  ├─ trip     : TripService, TripRepository, сущность Trip
  ├─ ai       : ItineraryAiService, PromptTemplates, AiRequestLogger
  ├─ stats    : StatsService
  └─ config   : ChatClient, CORS, Jackson
        │                         │
        ▼                         ▼
PostgreSQL 17              LLM API (OpenAI-compatible)
 (JSONB для маршрутов)      Gemini | Groq | OpenAI
```

**Провайдеры** переключаются Spring-профилем (`SPRING_PROFILES_ACTIVE=gemini|groq|openai`) и переменной `AI_API_KEY`. Код от провайдера не зависит: везде используется `ChatClient` из Spring AI.

## 9. Стек

| Слой | Технологии |
|---|---|
| Backend | Java 21, Spring Boot 3.5, Spring Web, Validation, Data JPA (Hibernate 6), Actuator, Lombok |
| AI | Spring AI 1.0 (`spring-ai-starter-model-openai`, OpenAI-compatible endpoint) |
| БД | PostgreSQL 17, JSONB, Flyway |
| Frontend | React 19, TypeScript, Vite, Tailwind CSS 4, TanStack Query, React Router |
| Инфра | Docker Compose (Postgres), Maven |
| Тесты | JUnit 5, Spring Boot Test, MockMvc; Testcontainers (P1) |

## 10. Модель данных

См. `backend/src/main/resources/db/migration/V1__init_schema.sql`.

- `users`: id, email, name, created_at
- `trips`: id, user_id, destination, start_date, end_date, travelers, budget_level, pace, interests (jsonb), **itinerary (jsonb)**, packing_list (jsonb), created_at, updated_at
- `ai_requests`: id, trip_id, template_name, template_version, provider, model, input_tokens, output_tokens, latency_ms, status, error_message, created_at
- Демо-пользователь создаётся отдельной миграцией (`V2__seed_demo_user.sql`). Все поездки привязаны к нему, пока нет авторизации (P2).
- При удалении поездки строки `ai_requests` остаются, `trip_id` становится NULL: статистика не должна теряться.

**Почему JSONB:** маршрут — это вложенный документ, который читается и пишется целиком. Нормализовать его в таблицы days/activities нет смысла. Получается гибридная модель: реляционные сущности плюс документное хранилище в одной БД.

## 11. REST API

| Метод | Путь | Описание |
|---|---|---|
| GET | `/api/health` | Smoke-test (уже есть) |
| POST | `/api/trips` | Создать поездку и сгенерировать маршрут. Body: форма F1. Response: `TripResponse` |
| GET | `/api/trips` | Список поездок (краткий) |
| GET | `/api/trips/{id}` | Поездка с маршрутом |
| DELETE | `/api/trips/{id}` | Удалить |
| POST | `/api/trips/{id}/days/{dayNumber}/regenerate` | Body: `{ "feedback": "..." }`. Response: обновлённый `TripResponse` |
| POST | `/api/trips/{id}/packing-list` | (P1) Сгенерировать список вещей |
| GET | `/api/stats` | (P1) Агрегаты по `ai_requests` |

**Ошибки:** единый формат `{ "error": "...", "details": {...} }` через `@RestControllerAdvice`. 400 при ошибке валидации, 404 если не найдено, 502 при ошибке AI-провайдера или битом ответе, 429 при превышении лимита провайдера.

## 12. Нефункциональные требования

- Генерация маршрута на 3 дня занимает до 30 секунд. В UI показывается индикатор загрузки.
- API-ключ хранится только в env-переменной и не логируется и не коммитится.
- Таймаут вызова LLM 60 секунд.
- При 429 от провайдера пользователь видит сообщение «лимит бесплатного API, попробуйте через минуту».
- Тесты: unit-тесты на валидацию и парсинг; MockMvc-тесты эндпоинтов с замоканным `ChatClient`. В тестах реальный LLM не вызывается.
- Фронтенд: у каждого экрана есть состояния загрузки, ошибки и пустого списка.
- Логи: каждая строка AI-вызова содержит версию шаблона; текст промптов и ответов модели в логи не пишется по умолчанию.

## 13. Риски

| Риск | Митигирующее действие |
|---|---|
| Модель выдумывает места или цены | Правила в system prompt, пометка «примерно» в UI |
| Невалидный JSON | Structured output, валидация, retry |
| Лимиты бесплатного тарифа | Groq как запасной провайдер, переключение профилем |
| Не хватит времени | Строгое разделение на P0 / P1 / P2 |

## 14. План работ

Задачи идут по порядку, каждая делается и проверяется отдельно. «Готово, когда» — критерий приёмки задачи.

| # | Задача | Зависит от | Готово, когда |
|---|---|---|---|
| T1 | ✅ Каркас проекта: backend, frontend, Docker, миграция V1 | — | `GET /api/health` отвечает, фронт показывает «UP» |
| T2 | ✅ `ChatClient` по профилям gemini / groq / openai, проверочный вызов LLM | T1 | Запрос уходит к выбранному провайдеру и возвращает текст; ключ не попадает в логи |
| T3 | ✅ Records `Itinerary`, `Day`, `Activity`, enum `Slot`, `Category` + Bean Validation | T1 | Unit-тесты валидации проходят |
| T4 | ✅ Шаблоны `itinerary-system`, `itinerary-generate`, `day-regenerate` в `prompts/`; версия из `app.ai.prompt-version` | T2, T3 | Шаблоны рендерятся с переменными в unit-тесте |
| T5 | ✅ `ItineraryAiService`: `.entity(Itinerary.class)`, проверка числа дней, 1 retry, ошибки 502 / 429 | T4 | Провайдер с битым JSON → retry → 502 с понятным текстом |
| T6 | ✅ `AiRequestLogger`: строка в `ai_requests` на каждый вызов (включая retry) | T5 | В таблице есть SUCCESS / INVALID_JSON / ERROR с токенами и latency |
| T7 | ✅ Сущность `Trip` (JSONB), репозиторий, демо-пользователь (миграция V2), `TripService` | T1 | Itinerary сохраняется и читается из JSONB без потерь |
| T8 | ✅ `POST / GET / DELETE /api/trips`, валидация формы F1, единый формат ошибок `@RestControllerAdvice` | T7 | 400 с указанием поля при невалидном вводе, 404 при неизвестном id |
| T9 | ✅ Генерация маршрута в `POST /api/trips`: вызов LLM, сохранение, логирование | T5, T6, T8 | «Tbilisi, 3 дня, MEDIUM, FOOD + HISTORY» даёт 3 дня, цены и бюджет |
| T10 | ✅ `POST /api/trips/{id}/days/{n}/regenerate` | T9 | Меняется только день n, бюджет пересчитан, при ошибке маршрут не меняется |
| T11 | ✅ Frontend: API-слой (типы, TanStack Query), роутинг, форма новой поездки | T8 | Поездка создаётся из UI, ошибки валидации видны у полей |
| T12 | ✅ Frontend: страница маршрута (карточки дней, слоты, бюджет, советы, дисклеймер), индикатор загрузки | T9, T11 | Маршрут читается на телефоне и на десктопе |
| T13 | ✅ Frontend: «Regenerate day» с комментарием, список «Мои поездки» с удалением | T10, T12 | Сценарии F3–F5 проходят из UI |
| T14 | 🟡 Hardening (тесты и README готовы; осталось: проверка с реальным ключом, скриншоты, push): MockMvc-тесты, README со скриншотами, проверка трёх провайдеров, git init и push | T13 | Демо из раздела 15 проходит целиком |
| T15 | ✅ (P1) Packing list (F7): шаблон, колонка `packing_list`, эндпоинт, блок в UI | T9 | Список по категориям на странице поездки |
| T16 | ✅ (P1) Статистика (F8): `GET /api/stats`, страница `/stats` | T6 | Запросы, средняя latency, доля ошибок, токены по провайдерам |
| T17 | (P1) Streaming маршрута (F9, SSE) | T9 | Дни появляются по мере генерации |
| T18 | ✅ (P1) Карта (F10): Leaflet + OpenStreetMap | T12 | Точки активностей на карте дня |

## 15. Демо для отчёта (2–3 минуты)

1. Заполнить форму: Tbilisi, 3 дня, MEDIUM, FOOD + HISTORY.
2. Показать сгенерированный маршрут.
3. Перегенерировать день 2 с комментарием «more food, less walking».
4. Показать таблицу `ai_requests` или страницу статистики.
5. Переключить провайдера (Gemini → Groq) сменой профиля и показать, что код не менялся.

## 16. Открытые вопросы

- Язык маршрута: всегда английский или по выбору пользователя?
- Нужна ли авторизация для демо, или хватит одного пользователя?
- Где хостить демо (локально или Render/Railway)?
- Проект пока не под git. Инициализировать репозиторий сейчас или в T14, перед push на GitHub?
- Валюта: всегда та, что в ответе модели (как в примере раздела 7), или фиксированная по направлению?
