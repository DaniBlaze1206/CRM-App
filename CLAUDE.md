# CLAUDE.md

Guidance for working in this repository. Read this before writing or changing code.

## Project

A CRM (Customer Relationship Management) backend — a single system of record for
the people, companies, and deals a business works, plus every interaction with
them. This repo is the **backend API only**.

**Stack:** Node.js · Express · MongoDB (via Mongoose). Plain JavaScript, no build
step — Node runs `src/` directly. Validation with Zod. Auth with JWT + bcrypt.

## Architecture

Strict, thin, one-directional layering. A request flows:

```
route → middleware → validator → controller → service → model/MongoDB
```

Errors flow back up: a service throws `ApiError` → `asyncHandler` forwards it →
`errorHandler` sends a clean JSON response.

**Non-negotiable layer rules:**

- **Only services touch the database.** No Mongoose calls in controllers, routes,
  or middleware. Ever.
- **Controllers are thin HTTP glue.** They extract inputs, call one service, pick
  a status code, and respond. No business logic, no decisions. If a controller is
  growing logic, move it to the service.
- **Services hold all business logic** and are HTTP-agnostic — they take plain
  arguments and return values, and `throw new ApiError(...)`; they never touch
  `req`/`res`.
- **Routes are wiring only** — `path + method → [authMiddleware] → [validate(schema)]
  → controller`. No logic.
- **Validators check input shape/format only.** Never query the database from a
  validator (existence/uniqueness/ownership are service or model concerns).
- **Models define what data IS** — fields, types, enums, references, indexes. The
  only behaviour allowed on a model is data-integrity logic (password hashing,
  `toJSON` cleanup).

## Directory map

```
src/
  config/       env.js (validated config), db.js (Mongoose connection), logger.js
  models/       one <name>.model.js per collection (canonical schema only)
  middleware/   authMiddleware.js, errorHandler.js, notFound.js
  validators/   one <name>.validator.js per model (Zod schemas)
  routes/       index.js (aggregator) + one <name>.routes.js per resource
  controllers/  one <name>.controller.js per resource
  services/     one <name>.service.js per resource
  utils/        ApiError.js, asyncHandler.js
  app.js        builds & exports the Express app (does NOT listen)
  server.js     validates env → connects DB → starts listening
```

## Domain model & key decisions

Six entities: **User, Lead, Contact, Note, FollowUp, Deal.** Children reference
**up** to parents (a Deal holds `contactId`); parents hold no arrays pointing down.
Relations are assembled with `populate` in services.

These decisions were made deliberately. Do not reverse them without asking:

- **Lead and Contact are separate collections.** A Lead is an unqualified prospect;
  a Contact is a qualified person.
- **Hard conversion.** Converting a lead **creates a Contact and deletes the Lead** —
  no `convertedContactId`, no lingering "converted" lead. This create-and-delete
  **MUST run inside a MongoDB transaction** so the person is never duplicated or
  lost. This is the highest-risk operation in the app.
- **Lifecycle history lives on the Contact:** `convertedAt` is stamped at creation.
  There is intentionally no `becameLeadAt`.
- **"Lost" = status + `lostAt` + `lostReason`** (a constrained enum, never free
  text) on **Lead and Deal**. A Contact is a person and does not get "lost".
  Whenever status/stage becomes `lost`, set all three together.
- **No `authorize` middleware.** Authentication is in `authMiddleware`;
  **authorization (ownership + admin checks) lives inside services.** Every mutating
  service method follows: fetch → check existence (404) → check ownership/role
  (403) → act → return.
- **Active-leads filter:** the default lead list query excludes lost leads. Only
  explicit reporting paths include them.

## Conventions

- **Identity always comes from `req.user`** (set by `authMiddleware`), never from the
  request body. `ownerId`, `authorId`, `assigneeId` are set from the authenticated
  user server-side. A client must never be able to forge who owns/authored a record.
- **Errors:** wrap every async controller in `asyncHandler`. Throw
  `new ApiError(statusCode, message)` from services — never call `res` from a
  service. `errorHandler` is registered **last** in `app.js`.
- **app.js ordering (critical):** global middleware → routes → `notFound` →
  `errorHandler`. Wrong order = handlers silently never fire.
- **System-managed fields are never accepted from client input** in validators:
  `convertedAt`, `lostAt`, timestamps, `authorId`.
- **Create schemas** require essential fields; **update schemas** make fields
  optional but still validate them if present.
- **Config access:** read from `config` (exported by `config/env.js`), never
  `process.env` directly, anywhere except `env.js`.
- **Naming:** files are `<name>.<layer>.js` (e.g. `contact.service.js`). Service
  methods are verbs (`create`, `getById`, `list`, `convert`, `markLost`,
  `changeStage`, `getDue`).
- **Action routes** for real operations that aren't plain CRUD:
  `POST /leads/:id/convert`, `PATCH /deals/:id/stage`, `PATCH /follow-ups/:id/complete`.

## Mongo-specific responsibilities (the DB won't do these for you)

- Before saving a Note/FollowUp/Deal, **verify referenced ids actually exist**
  (validators only check id *format*). Throw 404 if a referenced record is missing.
- Don't orphan references on delete.
- Use Mongoose sessions/transactions for multi-step writes (lead conversion; a
  stage change that also appends `statusHistory`).

## Commands

```bash
npm install
npm run dev      # nodemon src/server.js
npm start        # node src/server.js
```

## Environment

Required in `.env` (see `.env.example`): `MONGODB_URI`, `JWT_SECRET`, `PORT`,
`JWT_EXPIRES_IN`, `NODE_ENV`. `config/env.js` validates these at boot and the
process should refuse to start if any required one is missing.

## Do NOT

- Add a repository/DAO layer under services. Mongoose *is* the data-access layer;
  services call it directly.
- Build a generic base controller/service to "DRY up" the near-identical CRUD.
  Prefer obvious duplication; extract a shared helper only once real repetition
  causes pain.
- Put business logic in controllers, or DB access anywhere but services.
- Trust client-supplied identity or accept system-managed fields as input.
- Reveal whether an email exists on login failure — return a generic 401 for both
  "no such user" and "wrong password".

## Current status

Planning is complete; implementation not started. **Build one vertical slice
first: the `contact` resource end to end** (model → validator → route → controller
→ service), get it running against MongoDB, then clone the pattern for the other
resources. Write and test the non-CRUD operations (`convert`, `login`, `markLost`,
`changeStage`, `getDue`) hardest — that's where the real logic lives.
