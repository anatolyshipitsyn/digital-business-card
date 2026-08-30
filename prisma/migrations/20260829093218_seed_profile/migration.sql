-- The content of the card. This is a data migration, not a schema one: it runs from the same
-- `prisma migrate deploy` the entrypoint already invokes, is recorded in `_prisma_migrations`, and
-- is therefore skipped on every subsequent start — which is what makes REQ-INIT-02's repeat-start
-- check hold by construction. See "On filling the database" in docs/requirements/REQUIREMENTS.md.
--
-- Every id is written out rather than generated. That is what lets the foreign keys below be read
-- without running anything, and it keeps the rows addressable by a later content migration.
-- Correcting a sentence here means a new migration with an UPDATE, never an edit to this file.

-- The profile id is the fixed unique key the root `profile` query resolves against (REQ-API-03), so
-- it is a slug rather than a generated value.
INSERT INTO "Profile" ("id", "name", "description") VALUES (
    'anatoly-shipitsyn',
    'Anatoly Shipitsyn',
    'Full-stack developer and automation architect with more than twenty years in IT. I build multi-tenant SaaS platforms on NestJS, GraphQL and PostgreSQL, ship the React and React Native clients that sit on top of them, and design the integrations that connect them to the rest of a business: MCP servers for AI agents, n8n and Temporal.io workflows, ETL pipelines. I work end to end, from the schema and its migrations through the API and the client to the CI/CD and Docker deployment that carry it to production.'
);

INSERT INTO "Link" ("id", "label", "url", "profileId") VALUES
    ('link-github',   'GitHub',    'https://github.com/anatolyshipitsyn',          'anatoly-shipitsyn'),
    ('link-linkedin', 'LinkedIn',  'https://www.linkedin.com/in/anatoly-shipitsyn/', 'anatoly-shipitsyn'),
    ('link-telegram', 'Telegram',  'https://t.me/anatoly_cg',                      'anatoly-shipitsyn'),
    ('link-cv',       'Online CV', 'https://www.kickresume.com/cv/anatoly-shipicin/', 'anatoly-shipitsyn');

INSERT INTO "Skill" ("id", "name", "profileId") VALUES
    ('skill-typescript',          'TypeScript',                     'anatoly-shipitsyn'),
    ('skill-nodejs',              'Node.js',                        'anatoly-shipitsyn'),
    ('skill-nestjs',              'NestJS',                         'anatoly-shipitsyn'),
    ('skill-graphql',             'GraphQL',                        'anatoly-shipitsyn'),
    ('skill-prisma',              'Prisma',                         'anatoly-shipitsyn'),
    ('skill-typeorm',             'TypeORM',                        'anatoly-shipitsyn'),
    ('skill-postgresql',          'PostgreSQL',                     'anatoly-shipitsyn'),
    ('skill-redis',               'Redis',                          'anatoly-shipitsyn'),
    ('skill-elasticsearch',       'Elasticsearch',                  'anatoly-shipitsyn'),
    ('skill-mongodb',             'MongoDB',                        'anatoly-shipitsyn'),
    ('skill-react',               'React',                          'anatoly-shipitsyn'),
    ('skill-react-native',        'React Native',                   'anatoly-shipitsyn'),
    ('skill-nextjs',              'Next.js',                        'anatoly-shipitsyn'),
    ('skill-ant-design',          'Ant Design',                     'anatoly-shipitsyn'),
    ('skill-tailwind-css',        'Tailwind CSS',                   'anatoly-shipitsyn'),
    ('skill-bullmq',              'BullMQ',                         'anatoly-shipitsyn'),
    ('skill-temporal',            'Temporal.io',                    'anatoly-shipitsyn'),
    ('skill-n8n',                 'n8n',                            'anatoly-shipitsyn'),
    ('skill-mcp',                 'Model Context Protocol (MCP)',   'anatoly-shipitsyn'),
    ('skill-aws-lambda',          'AWS Lambda',                     'anatoly-shipitsyn'),
    ('skill-serverless',          'Serverless Framework',           'anatoly-shipitsyn'),
    ('skill-terraform',           'Terraform',                      'anatoly-shipitsyn'),
    ('skill-docker',              'Docker',                         'anatoly-shipitsyn'),
    ('skill-gitlab-ci',           'GitLab CI',                      'anatoly-shipitsyn'),
    ('skill-github-actions',      'GitHub Actions',                 'anatoly-shipitsyn'),
    ('skill-rest-apis',           'REST APIs',                      'anatoly-shipitsyn'),
    ('skill-etl-pipelines',       'ETL Pipelines',                  'anatoly-shipitsyn');

-- A NULL endDate is the current position; there is no sentinel to compare against later.
INSERT INTO "Experience" ("id", "company", "position", "startDate", "endDate", "achievements", "profileId") VALUES
    (
        'exp-speed-and-function',
        'Speed & Function',
        'Software Developer',
        DATE '2016-02-01',
        NULL,
        ARRAY[
            'Designed and built DailyMark end to end, a multi-tenant B2B SaaS platform for restaurant shift operations: a NestJS API, a Next.js client, a superadmin panel and a marketing site in one monorepo, shipped to production at dailymark.me.',
            'Enforced tenant isolation at the database layer with PostgreSQL row-level security driven by the verified JWT, so many organizations share a single instance with no cross-tenant leakage.',
            'Built exactly-once Telegram delivery on the transactional outbox pattern (PostgreSQL and BullMQ, retry with backoff, rate limiting), eliminating message loss during Redis and database failures.',
            'Made checklist dispatch exactly-once across instances and restarts using per-checklist advisory locks and a grace window.',
            'Integrated an LLM agent (LiteLLM, forced tool calls, model fallback chain) that turns free-form Telegram messages from staff into structured leave and shift-swap requests.',
            'Hardened payments and sessions: HMAC-verified Paddle webhooks with deduplication and last-write-wins upserts, refresh-token reuse detection, and read-only superadmin impersonation.',
            'Built a zero-downtime deployment pipeline (Docker, docker-rollout, a local registry, migrations applied before rollout) and cut image sizes from 2.08 GB to 281 MB for the web app and from 1.97 GB to 415 MB for the API using multi-stage builds.',
            'Delivered end-to-end PDF disaster-plan generation for SecureCore: a NestJS and Bull worker assembling the document with pdf-lib and a programmatic table of contents, a Puppeteer and Handlebars rendering microservice, and the QR-code download flow in the web client.',
            'Implemented offline mode for the SecureCore React Native app: full dataset synchronization through a single GraphQL endpoint into local SQLite, with background sync and soft-delete handling.',
            'Built MCP servers and n8n and Temporal.io workflows connecting AI agents to business systems, alongside automated ETL pipelines.'
        ],
        'anatoly-shipitsyn'
    ),
    (
        'exp-korund',
        'LLC "Korund"',
        'Front-end Developer',
        DATE '2014-12-01',
        DATE '2016-02-01',
        ARRAY[
            'Supported and developed websites built on WordPress, ChaplinJS/Backbone and the 1C-Bitrix e-commerce system.'
        ],
        'anatoly-shipitsyn'
    ),
    (
        'exp-new-wind',
        'DOO "New-Wind, Budva"',
        'Software Developer',
        DATE '2013-03-01',
        DATE '2014-12-01',
        ARRAY[
            'Developed websites and organized the work of the 1C-Bitrix affiliate network.',
            'Trained staff for certification on 1C-Bitrix software products.'
        ],
        'anatoly-shipitsyn'
    ),
    (
        'exp-internet-client',
        'LLC "Internet-Client"',
        'Software Developer',
        DATE '2011-04-01',
        DATE '2013-02-01',
        ARRAY[
            'Developed customer websites.'
        ],
        'anatoly-shipitsyn'
    ),
    (
        'exp-individ-cjsc',
        'CJSC "Individ"',
        'Software Engineer',
        DATE '2008-05-01',
        DATE '2011-02-01',
        ARRAY[
            'Developed e-commerce systems, supported existing projects and built websites.'
        ],
        'anatoly-shipitsyn'
    ),
    (
        'exp-itonz',
        'LLC "Itonz"',
        'Front-end Developer',
        DATE '2007-02-01',
        DATE '2008-05-01',
        ARRAY[
            'Supported an online shop and integrated it with billing and accounting system calls.'
        ],
        'anatoly-shipitsyn'
    ),
    (
        'exp-m3-media',
        'CJSC "Agency of Financial Information M3-Media"',
        'Front-end Developer',
        DATE '2002-04-01',
        DATE '2006-06-01',
        ARRAY[
            'Built an e-commerce system and a number of small websites.'
        ],
        'anatoly-shipitsyn'
    ),
    (
        'exp-individ-llc',
        'LLC "Individ"',
        'Front-end Developer',
        DATE '2000-11-01',
        DATE '2002-02-01',
        ARRAY[
            'Developed CMS features for the Saitistika platform at one of the ten largest web development companies in Russia.',
            'Delivered corporate sites including allianz.ru, xerox.ru and nordea.ru.'
        ],
        'anatoly-shipitsyn'
    );

INSERT INTO "Project" ("id", "name", "url", "profileId") VALUES
    ('project-dailymark',             'DailyMark',             'https://dailymark.me',                                        'anatoly-shipitsyn'),
    ('project-securecore',            'SecureCore',            'https://securecore.com',                                      'anatoly-shipitsyn'),
    ('project-digital-business-card', 'Digital Business Card', 'https://github.com/anatolyshipitsyn/digital-business-card',    'anatoly-shipitsyn'),
    ('project-workspace-plugins',     'Workspace Plugins',     'https://github.com/anatolyshipitsyn/workspace-plugins',        'anatoly-shipitsyn');
