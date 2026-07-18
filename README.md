# Helion

[![Deploy](https://github.com/SamandarMansurkhodjaev2713/helion/actions/workflows/deploy.yml/badge.svg)](https://github.com/SamandarMansurkhodjaev2713/helion/actions/workflows/deploy.yml)
[![CI](https://github.com/SamandarMansurkhodjaev2713/helion/actions/workflows/ci.yml/badge.svg)](https://github.com/SamandarMansurkhodjaev2713/helion/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-38bdf8.svg)](LICENSE)
![React 18](https://img.shields.io/badge/React-18-149eca?logo=react&logoColor=white)
![TypeScript strict](https://img.shields.io/badge/TypeScript-strict-3178c6?logo=typescript&logoColor=white)
![Vite 6](https://img.shields.io/badge/Vite-6-646cff?logo=vite&logoColor=white)
![Tailwind 3](https://img.shields.io/badge/Tailwind-3-38bdf8?logo=tailwindcss&logoColor=white)

**Живое демо → [samandarmansurkhodjaev2713.github.io/helion](https://samandarmansurkhodjaev2713.github.io/helion/)**

> Кинематографичный портфолио-сайт вымышленной программы космического туризма.
> Эстетика Interstellar / Dune: масштаб, холодная тишина, сдержанность.

**Helion** прокладывает маршруты в тишине между мирами — сайт рассказывает о первом
гражданском рейсе за пояс астероидов (2027). Проект создан как витрина фронтенд-навыков:
scroll-driven видео-хиро, живой canvas-фон, кастомный HUD-курсор, полноценная
двуязычность (RU / UZ) и award-уровень движения — без тяжёлых зависимостей.

**English:** A cinematic portfolio site for a fictional space-tourism brand. Scroll-driven
video hero, live canvas starfield, custom HUD cursor, full RU/UZ localization, and
award-grade motion — built with a deliberately light stack (~73 KB JS gzip).

---

## ✦ Возможности

- **Направление «кино-кадр»** — сайт стилизован под фильм: **живые** letterbox-бары
  (широкие в кино-моментах, узкие в контенте, автоскрытие на телефоне), живой
  SMPTE-таймкод от позиции скролла (страница = 167-секундная плёнка, 24 fps),
  сцены SC.01–06, индикатор REC.
- **Единый язык появлений** — весь текст поднимается из-под линий-масок, все
  изображения «проявляются» как фотография, номер сцены рисуется мелом и уходит
  в параллакс. Один жест вместо набора шаблонных fade-ов.
- **Синтезированный звук** (WebAudio, без аудиофайлов): гул корабля и тики
  интерфейса. Выключен по умолчанию, тумблер в баре.
- **Адаптивное качество** — FPS-проба и хинты устройства выбирают полный
  спектакль или облегчённый монтаж; на телефоне добавлены тактильные отклики.
- **Кино-каунтдаун при входе** (`FilmLeader`) — 3-2-1 в стилистике ракорда плёнки;
  показывается раз за сессию, пропускается любым вводом, off при reduced-motion.
- **Хиро в трёх монтажах, один сценарий** — на десктопе прокрутка управляет
  `currentTime` видео с инерцией. Скраб 26-мегабайтного файла кладёт мобильный
  декодер, поэтому на телефоне тот же дубль играется покадрово (72 кадра WebP,
  ~1.6 МБ, прогрессивная загрузка от каждого 8-го кадра к полной плотности).
  Idle-петля над первым кадром при этом осталась видео — телефоны не умеют
  перематывать, но линейно играют отлично (0.77 МБ, тот же кроп, стык
  невидим). При `prefers-reduced-motion` — статичный кадр.
  Биты дубля все версии читают из общего `hero/heroScript.ts`.
- **Полноэкранное меню** — гигантские сверхтонкие пункты со scramble-декодированием,
  стаггер-появление, превью-подписи, телеметрия — одинаково на десктопе и мобиле.
- **Живой canvas-фон** (`StarField`) — дрейф звёзд, растягивающихся в warp-полосы по
  скорости скролла. Пауза вне вкладки, полное отключение при `prefers-reduced-motion`.
- **Кастомный HUD-курсор** — визир-прицел с инерцией, «захватом» интерактивных
  элементов и живой телеметрией координат. Автоматически off на тач-устройствах.
- **Две локали RU / UZ** (узбекский латиницей) с сохранением выбора в `localStorage` и
  синхронизацией `<html lang>` / `<title>`.
- **Секции без шаблонных карточек:** миссии — леджер-досье с аккордеон-раскрытием;
  флот — технический лист с ARIA-табами, count-up и приборной схемой; маршрут —
  pinned-таймлайн с линией-траекторией (на мобиле — вертикальный); экипаж — «титры»;
  финал — «восход планеты» и bracket-CTA (`CineButton`).
- **Доступность и производительность:** `prefers-reduced-motion`, видимый
  keyboard-focus, клавиатурная навигация табов, семантика, очищаемые rAF/observers.

## ✦ Технологии

| Слой | Инструмент |
| --- | --- |
| Сборка | [Vite 6](https://vite.dev) |
| UI | [React 18](https://react.dev) + TypeScript (strict) |
| Стили | [Tailwind CSS 3](https://tailwindcss.com) + токены-переменные |
| Плавный скролл | [Lenis](https://github.com/darkroomengineering/lenis) |
| Иконки | [lucide-react](https://lucide.dev) |
| Движение | Canvas API + IntersectionObserver + кастомные хуки (без GSAP/Three) |

Типографика — «кино-титры»: **Inter** (сверхтонкое 200 + uppercase + широкий трекинг
для заголовков, обычное — для текста) и **JetBrains Mono** (телеметрия, таймкод, цифры).

## ✦ Быстрый старт

```bash
npm install      # установка зависимостей
npm run dev      # локальная разработка на http://localhost:5173
npm run build    # прод-сборка в dist/ (tsc + vite build)
npm run preview  # предпросмотр собранной версии
```

Проверка типов выполняется в рамках `npm run build`; запустить отдельно:

```bash
npx tsc --noEmit
```

## ✦ Структура проекта

```
helion/
├─ public/                 # статические медиа (видео-скраб, постеры)
├─ src/
│  ├─ main.tsx             # точка входа
│  ├─ App.tsx              # композиция: провайдер, курсор, фон, секции
│  ├─ index.css            # токены-переменные, grain/vignette, база
│  ├─ i18n/                # словари RU/UZ + провайдер (typesafe)
│  ├─ lib/                 # константы, easing-математика, хуки
│  └─ components/
│     ├─ HudCursor / StarField / Nav / Footer
│     ├─ hero/              # MobileHero + общий словарь движения heroMotion
│     ├─ ScrollyHero (десктоп) / StaticHero (reduced-motion)
│     ├─ primitives/       # MagneticButton, TiltCard, Reveal, ScrambleText…
│     └─ sections/         # Missions, Fleet, Route, Crew, Contact
├─ docs/                   # проектная документация
└─ .github/workflows/      # CI + деплой на GitHub Pages
```

## ✦ Документация

| Документ | Содержание |
| --- | --- |
| [`docs/architecture.md`](docs/architecture.md) | Архитектура, слои, потоки данных |
| [`docs/design-system.md`](docs/design-system.md) | Палитра, типографика, движение |
| [`docs/content.md`](docs/content.md) | Нарратив-байбл и правила текста |
| [`docs/animations.md`](docs/animations.md) | Спецификация scroll/hover/cursor-эффектов |
| [`docs/qa.md`](docs/qa.md) | **QA:** CI-ворота, чек-листы, журнал верификации |

## ✦ QA

Качество закрывается двумя контурами (подробно — в [`docs/qa.md`](docs/qa.md)):

- **Автоматика:** на каждый push/PR CI гоняет строгий `tsc --noEmit` и полную
  прод-сборку; в `main` деплой уходит только после успешной сборки.
- **Ручной DoD:** адаптив 375/1280 без переполнений, reduced-motion, клавиатура и
  видимый фокус, паритет локалей RU/UZ, чистая консоль, работающие CTA.

## ✦ Локализация

Весь текст живёт в типизированных словарях `src/i18n/ru.ts` и `src/i18n/uz.ts`,
реализующих общий интерфейс `Dictionary` — TypeScript гарантирует, что ни одна локаль
не потеряет ключ. Компоненты читают строки через хук `useI18n()`.

## ✦ Деплой

`vite.config.ts` использует относительный `base: './'`, а медиа подключаются через
`asset()` (учитывает `BASE_URL`), поэтому сборка работает и в корне домена, и в
подпапке GitHub Pages. Пуш в `main` автоматически собирает и публикует сайт через
[`deploy.yml`](.github/workflows/deploy.yml).

## ✦ Медиа и атрибуция

- **Текстура Марса** (`public/mars_2k.jpg`) — [Solar System Scope](https://www.solarsystemscope.com/textures/)
  (зеркало Wikimedia Commons), лицензия [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
- **Архивные кадры флота** — фотографии NASA (public domain, [images.nasa.gov](https://images.nasa.gov)):
  `art002e016281` (Orion, Artemis II), `iss053e317722` (Cygnus OA-8),
  `iss072e004110` (Dragon Freedom). На сайте обработаны в холодный дуотон.
- Hero-видео и постеры — собственные материалы проекта.

## ✦ Автор

**Samandar Mansurkhodjaev** — дизайн, код, контент.

- GitHub: [@SamandarMansurkhodjaev2713](https://github.com/SamandarMansurkhodjaev2713)
- Telegram: [@Killallofthem13](https://t.me/Killallofthem13)

## ✦ Лицензия

[MIT](LICENSE) © 2026 Samandar Mansurkhodjaev. Программа Helion вымышлена; код — настоящий.
