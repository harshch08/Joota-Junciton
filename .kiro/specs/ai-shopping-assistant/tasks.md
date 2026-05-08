# Implementation Plan: AI Shopping Assistant

## Overview

Implement the AI Shopping Assistant end-to-end: backend service + route, frontend API client, chat panel, floating button, and wiring into App.tsx. Uses gpt-4o-mini for intent parsing, MongoDB text search for product lookup, and fast-check for property-based tests.

## Tasks

- [x] 1. Install fast-check and set up the MongoDB text index migration
  - Add `fast-check` to `server/package.json` devDependencies (`npm install --save-dev fast-check` in `server/`)
  - Add `fast-check` to root `package.json` devDependencies (`npm install --save-dev fast-check` in root)
  - Create `server/scripts/createAssistantIndex.js` — connects to MongoDB and calls `db.products.createIndex({ name: 'text', description: 'text', brand: 'text', category: 'text' })` with `{ background: true }`, no-ops if index already exists
  - _Requirements: 4.2_

- [x] 2. Implement `server/services/assistantService.js`
  - [x] 2.1 Scaffold the service module with brand/category cache
    - Export a class (or plain object) with an in-memory `brandsCache` and `categoriesCache`, each refreshed every 10 minutes via `setInterval` using `Brand.distinct('name')` and `Category.distinct('name')`
    - Add a `normalize(value, cache)` helper that finds the closest case-insensitive match in the cache array; returns the canonical stored form or the original value if no match
    - _Requirements: 4.5_

  - [ ]* 2.2 Write property test for brand/category normalization (Property 5)
    - **Property 5: Brand and category normalization**
    - **Validates: Requirements 4.5**
    - Use fast-check to generate brand strings with random casing variations; assert `normalize()` always returns the canonical form when a match exists in the cache

  - [x] 2.3 Implement `parseIntent(query)` — OpenAI call
    - Build the structured prompt requesting a JSON `ParsedIntent` object (brand, category, useCase, color, minPrice, maxPrice, sortBy, referenceProduct)
    - Call `openai.chat.completions.create` with model `gpt-4o-mini`, `max_tokens: 300`, wrapped in `Promise.race` against a 10-second timeout
    - Parse the JSON response; on parse failure or timeout throw errors with appropriate `.status` codes (502 for API errors, 503 for missing key)
    - Truncate `query` to 500 chars before sending to OpenAI (Requirement 9.1)
    - _Requirements: 4.1, 4.3, 9.1, 9.2, 9.3, 9.5_

  - [ ]* 2.4 Write property test for non-empty ParsedIntent (Property 6)
    - **Property 6: Non-empty ParsedIntent for parseable queries**
    - **Validates: Requirements 4.6**
    - Mock the OpenAI call; generate query strings containing known intent signals (brand names, price patterns, color words); assert returned `ParsedIntent` has at least one non-null field

  - [x] 2.5 Implement `buildQuery(parsedIntent)` — MongoDB query construction
    - Build `filter` object: `$text` search from brand/category/useCase terms, exact brand regex, exact category regex, all values escaped via `escapeRegex()` helper to prevent injection
    - Apply `referenceProduct` logic: find the reference product by name text search, extract its `_id` and category, add `{ _id: { $ne: refId } }` to filter
    - Fall back to category search if reference product not found in catalog (Requirement 7.4)
    - _Requirements: 4.2, 7.1, 7.2, 7.4, 9.4_

  - [ ]* 2.6 Write property test for MongoDB query sanitization (Property 14)
    - **Property 14: MongoDB query sanitization**
    - **Validates: Requirements 9.4**
    - Generate `ParsedIntent` fields containing regex metacharacters (`$`, `.`, `*`, `[`, `(`); assert `buildQuery()` escapes them and the resulting filter contains no MongoDB operator injection

  - [x] 2.7 Implement `search(query)` — main entry point
    - Call `parseIntent`, then `buildQuery`, then `Product.find(filter).limit(50).lean()`
    - Apply in-memory price filter using `effectivePrice = doc.discountedPrice ?? doc.price` for `minPrice`/`maxPrice` bounds (Requirement 4.2)
    - Apply `sortBy` ordering in-memory (`price_asc`, `price_desc`, `rating`, `newest`)
    - Capture `totalCount` from the full filtered set, then slice to 8 for `results`
    - Generate `intentSummary` string (e.g., "Showing running shoes under ₹5,000")
    - Return `{ results, parsedIntent, intentSummary, totalCount }`
    - _Requirements: 4.2, 4.4, 5.1, 5.5, 5.6, 8.2_

  - [ ]* 2.8 Write property test for price filter correctness (Property 4)
    - **Property 4: Price filter correctness**
    - **Validates: Requirements 4.2**
    - Generate random `ParsedIntent` with `minPrice`/`maxPrice` and a mock product list; assert every product in `results` satisfies `effectivePrice >= minPrice` and `effectivePrice <= maxPrice`

  - [ ]* 2.9 Write property test for result count cap (Property 7)
    - **Property 7: Result count cap**
    - **Validates: Requirements 5.1**
    - Generate mock product arrays of size 1–100; assert `results.length <= 8` always

  - [ ]* 2.10 Write property test for total count accuracy (Property 8)
    - **Property 8: Total count accuracy**
    - **Validates: Requirements 5.5**
    - Generate mock product arrays of size > 8; assert `totalCount` equals the full filtered set size, not the capped 8

  - [ ]* 2.11 Write property test for reference product exclusion (Property 11)
    - **Property 11: Reference product excluded from similar results**
    - **Validates: Requirements 7.2**
    - Generate a catalog with a known reference product; assert the reference product's `_id` is absent from `results`

  - [ ]* 2.12 Write property test for response shape invariant (Property 12)
    - **Property 12: Response shape invariant**
    - **Validates: Requirements 8.2**
    - Generate valid queries; assert the returned object always contains `results` (array), `parsedIntent` (object), `intentSummary` (non-empty string), `totalCount` (non-negative integer)

- [x] 3. Implement `server/routes/assistant.js`
  - [x] 3.1 Create the route file
    - Set up `express-rate-limit` at 30 req/min per IP with a 429 handler matching the pattern in `visualSearch.js` (include ISO reset timestamp in error message)
    - Add input validation middleware: reject if `query` is missing, not a string, empty/whitespace-only, or > 500 chars with `{ error: "query must be a non-empty string of at most 500 characters" }`
    - Wire `POST /` to call `assistantService.search(query)` and return the result as JSON
    - Map service error `.status` codes to HTTP responses (400, 429, 502, 503, 500)
    - _Requirements: 8.1, 8.3, 8.4, 8.5, 8.6, 9.5_

  - [ ]* 3.2 Write property test for input validation returns 400 (Property 13)
    - **Property 13: Input validation returns 400**
    - **Validates: Requirements 8.6**
    - Use fast-check to generate invalid inputs (empty string, whitespace-only strings, strings > 500 chars, missing field); assert HTTP 400 is returned and `assistantService.search` is never called

- [x] 4. Register the assistant route in `server/app.js`
  - Add `const assistantRouter = require('./routes/assistant')` and `app.use('/api/assistant', assistantRouter)` following the same pattern as the existing routes
  - _Requirements: 8.1_

- [x] 5. Checkpoint — verify backend wiring
  - Ensure all backend tests pass, ask the user if questions arise.

- [x] 6. Implement `src/lib/assistantApi.ts`
  - Create `src/lib/assistantApi.ts` exporting `queryAssistant(query: string): Promise<AssistantResponse>`
  - Define and export `AssistantResponse`, `ParsedIntent`, and `ConversationTurn` TypeScript interfaces matching the design document
  - Use `fetch` with `API_URL` from `src/config` (same pattern as `VisualSearchModal.tsx`)
  - Throw typed errors for non-OK responses, preserving the HTTP status for 429/502/503 differentiation
  - _Requirements: 8.1, 8.2_

- [x] 7. Implement `src/components/AssistantPanel.tsx`
  - [x] 7.1 Build the panel shell and input area
    - Create a slide-in panel (fixed overlay, not a Dialog) with a header, close button, and "Clear conversation" button
    - Add a controlled `<textarea>` or `<input>` for the query (max 500 chars), submit on Enter (without Shift) or button click
    - Show inline validation message when query is empty/whitespace-only or over 500 chars; disable submit while loading
    - Preserve query text in input after results are returned
    - _Requirements: 3.1, 3.3, 3.4, 3.5, 3.6, 1.4_

  - [ ]* 7.2 Write property test for input length acceptance (Property 1)
    - **Property 1: Input length acceptance**
    - **Validates: Requirements 3.1**
    - Generate strings of length 1–500; assert the submit button is enabled and no validation message is shown

  - [ ]* 7.3 Write property test for whitespace query rejection (Property 2)
    - **Property 2: Whitespace query rejection**
    - **Validates: Requirements 3.3**
    - Generate strings composed entirely of whitespace characters; assert submission is blocked and conversation state is unchanged

  - [ ]* 7.4 Write property test for over-length query rejection (Property 3)
    - **Property 3: Over-length query rejection**
    - **Validates: Requirements 3.4**
    - Generate strings of length 501–2000; assert submission is blocked and conversation state is unchanged

  - [x] 7.5 Implement `SuggestedQueries` sub-component and conversation turns
    - Render the 4 hardcoded suggested query chips when `turns.length === 0` and not loading; hide while loading; re-show on empty results
    - On chip click: populate input and auto-submit
    - Render each `ConversationTurn` showing the query text, `intentSummary`, product grid (up to 8 `ProductCard`s), and `totalCount` overflow message
    - Show "No products found" state with suggested queries when `results` is empty
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 5.1, 5.2, 5.4, 5.5, 5.6_

  - [x] 7.6 Implement conversation history management
    - Store turns in `useState<ConversationTurn[]>`, capped at 5 (drop oldest when 6th is added)
    - "Clear conversation" resets `turns` to `[]` and clears input
    - On product click: close panel and navigate to `/product/:productId` using `useNavigate`
    - _Requirements: 6.1, 6.3, 6.4, 5.3_

  - [ ]* 7.7 Write property test for conversation history cap (Property 9)
    - **Property 9: Conversation history cap**
    - **Validates: Requirements 6.1**
    - Generate sequences of 1–20 mock turns; assert `turns.length <= 5` and oldest turn is dropped when 6th is added

  - [ ]* 7.8 Write property test for stateless API — no history in request (Property 10)
    - **Property 10: Stateless API — no history in request**
    - **Validates: Requirements 6.2**
    - Generate conversation state with 1–5 prior turns; spy on `queryAssistant`; assert POST body contains only the `query` field

  - [x] 7.9 Implement error and loading states
    - Show dismissible error banner for network errors ("Something went wrong. Please try again.")
    - Show specific messages for 429 ("Too many requests. Please wait a moment.") and 502/503 ("Assistant is temporarily unavailable.")
    - Show `Loader2` spinner and disable submit while `isLoading` is true
    - _Requirements: 3.5_

- [x] 8. Implement `src/components/AssistantButton.tsx`
  - Create a fixed floating action button (bottom-right, above `BottomNav` on mobile) with a chat/sparkle icon from `lucide-react`
  - Include `aria-label="Open shopping assistant"` for screen reader accessibility
  - Accept `onClick: () => void` prop
  - _Requirements: 1.1, 1.2, 1.5_

- [x] 9. Wire up in `src/App.tsx`
  - Import `AssistantButton` and `AssistantPanel`; add `showAssistant` boolean state
  - Render `<AssistantButton onClick={() => setShowAssistant(true)} />` and `<AssistantPanel isOpen={showAssistant} onClose={() => setShowAssistant(false)} />` inside `AppContent`, outside the route tree, conditionally hidden on admin routes (same guard as `Header`)
  - _Requirements: 1.1, 1.3_

- [x] 10. Final checkpoint — ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- `fast-check` must be installed in both `server/` and root before running property tests
- The MongoDB text index script (`server/scripts/createAssistantIndex.js`) should be run once against the database before deploying
- Property tests use the tag format: `Feature: ai-shopping-assistant, Property {N}: {property_text}`
- Each property test runs a minimum of 100 iterations
- The OpenAI client should be initialized lazily (inside the function) to allow the 503 check for missing `OPENAI_API_KEY` to work correctly
