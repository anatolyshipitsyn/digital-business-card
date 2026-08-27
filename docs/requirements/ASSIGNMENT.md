<!--
  The original assignment, as received. The wording is verbatim and must never be changed,
  translated or abridged — this file is the citation source for the final compliance report.
  Only Markdown formatting (headings, list nesting, code fence) has been normalized — markup
  only: no character of the text itself is added, dropped or reordered, a trailing colon
  included, even where the markup convention would drop it.
  Requirement IDs derived from this text live in REQUIREMENTS.md.
-->

# Тестовое задание

Создайте Вашу цифровую визитку (backend-приложение), которая презентует Вас как специалиста, с обязательным использованием следующих технологий:

- Git;
- TypeScript;
- Node.js;
- NestJS;
- Prisma;
- GraphQL;
- Docker.

Приложение должно предоставлять Apollo Sandbox (GraphQL Playground), через которое можно получить информацию о Вас, Вашем опыте работы, навыках и проектах.

Бэкенд должен содержать:

1. Профиль:
   - имя;
   - краткое описание;
   - ссылки на GitHub/LinkedIn или другие профессиональные ресурсы.

2. Список навыков.

3. Опыт работы:
   - компания;
   - должность;
   - период работы;
   - Ваши достижения.

4. Проекты:
   - название;
   - ссылка на проект/репозиторий.

При запуске приложения база данных должна быть автоматически подготовлена и заполнена Вашими данными.

API должно позволять получить профиль и связанные с ним данные, например:

```graphql
query {
  profile {
    name
    description
    skills {
      name
    }
    experience {
      company
      position
    }
    projects {
      name
    }
  }
}
```

Конкретную структуру GraphQL API, базы данных и архитектуру приложения выберите самостоятельно.

Бизнес-логика, работа с данными и GraphQL API должны иметь разумное разделение ответственности.

## Что оценивается:

- в первую очередь оценивается не количество написанного кода, а качество инженерных решений.

## Обратите внимание на:

- структуру приложения и разделение ответственности;
- работу GraphQL с вложенными данными;
- взаимодействие с базой данных;
- инициализацию и заполнение базы данных;
- читаемость и поддерживаемость кода;
- корректную работу приложения после запуска с нуля.

## Просим предоставить:

1. Ссылку на проект (для просмотра);
2. Ссылку на Git (для ознакомления с исходным кодом).
