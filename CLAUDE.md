# HELION — инструкции проекта

Кинематографичный портфолио-сайт вымышленной программы космического туризма.
Эстетика **Interstellar / Dune** — масштаб, холодная тишина, сдержанность.

> Это единственный актуальный CLAUDE.md для данного репозитория. Он заменяет любые
> инструкции из родительских директорий (в частности, файл «SM STATION» —
> **другой** проект, к Helion отношения не имеет).

Приоритеты: **1) вау-эффект, 2) заявки клиентов** (финал ведёт в Telegram).
Аудитория: клиенты УЗ/СНГ. Язык: **RU по умолчанию**, UZ (латиница) — переключателем.

---

## КОМАНДЫ

```bash
npm run dev          # локальная разработка (http://localhost:5173)
npm run build        # прод-сборка (tsc + vite build) — должна проходить без ошибок
npm run preview      # предпросмотр собранной версии
npx tsc --noEmit     # строгая проверка типов (без any)
```

## СТЕК

Vite 6 · React 18 · TypeScript (**strict**, `noUnusedLocals/Parameters`) · Tailwind 3 ·
Lenis (плавный скролл) · lucide-react · Canvas API + IntersectionObserver.

**НЕ добавлять без явного запроса:** GSAP · Three.js · любой роутер · тяжёлые
анимационные библиотеки. Движение делается на кастомных хуках и canvas — намеренно лёгким.

## ПАЛИТРА — только токены, хардкод цветов запрещён

Токены заданы дважды и должны совпадать: `tailwind.config.js` (классы) и
`src/index.css` (CSS-переменные для canvas/imperative-кода).

```
void #060910 · deep #0B1120 · panel #111A2B
accent #6FD3F2 (bright #A9E7FF, deep #3E9FC4) — главный ледяной акцент
steel #6E8BA6 · ice #9DBBD6                   — приглушённый вторичный слой
bone #ECE6DA (текст) · ash #8B8578 (мета)
```

В компонентах — `bg-void`, `text-accent`, `text-steel` и т.д. В canvas — чтение через
`getComputedStyle(...).getPropertyValue('--accent')`. Новый цвет → добавить в оба файла.

## ТИПОГРАФИКА

- **Unbounded** (500–700) — display: акцент-строки заголовков (uppercase, ~0.52em от
  первой строки — оптическая компенсация ширины), вордмарк, названия. Без italic.
- **Inter** — весь текст (`font-sans`).
- **JetBrains Mono** — телеметрия, eyebrows, теги и **все цифры/статы**
  (`font-mono`, uppercase, широкий tracking, `tabular-nums`).

## ДВИЖЕНИЕ

Медленно, тяжело: 500–1200 мс. Ease `cubic-bezier(0.16, 1, 0.3, 1)` (класс `ease-cinematic`
/ `var(--ease-cinematic)`). Нет bounce/пружин/резких зумов. Тюнинг — в `MOTION`
(`src/lib/constants.ts`).

**Никогда не scroll-jacking** — нативный скролл + Lenis + IntersectionObserver.
`prefers-reduced-motion` уважать всегда: статический хиро, canvas и курсор off,
мгновенные появления.

## АРХИТЕКТУРА СЕКЦИЙ

```
hero      scroll-scrub видео (ScrollyHero) / статичный fallback (StaticHero)
missions  экспедиции — 3D-tilt карточки
fleet     флот — интерактивный селектор + count-up характеристик
route     маршрут — горизонтальный pinned-таймлайн
crew      экипаж — hover-раскрытие
contact   финал — «восход планеты» + Telegram/email CTA
```

Поверх всего: `Nav` (телеметрия + переключатель языка), `HudCursor`, `StarField` (фон),
`Footer`.

## ПРАВИЛА КОДА

1. **Только токены цвета** — никакого хардкода hex в компонентах (исключение —
   rgba в градиентах/box-shadow, где нужен литерал с альфой; помечать комментарием
   «mirrors --accent»).
2. **Весь текст — через i18n.** Ни одной строки контента в JSX напрямую; добавлять в
   `Dictionary` (types.ts) и обе локали (ru.ts, uz.ts). Формы обязаны совпадать.
3. **Прогрессивное улучшение.** Курсор/tilt/magnetic — только для точных указателей
   (`usePointerFine`) и вне reduced-motion. Тач и клавиатура работают всегда.
4. **Чистить эффекты.** Любой rAF / listener / IntersectionObserver / setInterval —
   с корректным cleanup. Canvas паузить вне вкладки.
5. **Магические числа — в именованные константы** (`MOTION`, `STARFIELD`, локальные `const`).
6. **Никакого `any`**, мёртвого и закомментированного кода. Early returns вместо вложенности.
7. **Медиа — через `asset()`** (учитывает `BASE_URL` для деплоя в подпапку), не через
   абсолютный `/path`.
8. Компоненты — PascalCase, один на файл. Tailwind для лейаута, переменные — для цветов.

## DEFINITION OF DONE (каждый компонент)

- [ ] Адаптив 375px и 1280px, без горизонтального переполнения
- [ ] `prefers-reduced-motion` уважается
- [ ] Видимый keyboard-focus, `aria` на иконках/контролах
- [ ] Цвета только из токенов
- [ ] Эффекты очищаются (нет утечек)
- [ ] `npx tsc --noEmit` и `npm run build` чистые

## ДОКУМЕНТАЦИЯ

Глубина — в `docs/`: `architecture.md`, `design-system.md`, `content.md`, `animations.md`.
При изменении команд/структуры — обновлять README и этот файл.
