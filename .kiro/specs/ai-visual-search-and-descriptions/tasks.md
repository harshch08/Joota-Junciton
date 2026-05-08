# Implementation Plan: AI Visual Search & Product Descriptions

## Overview

Implement two AI features for Joota Junction: visual search (CLIP-based image similarity via `@xenova/transformers`) and AI-generated product descriptions (Google Gemini 1.5 Flash). The backend is Node.js/Express/MongoDB; the frontend is React + TypeScript + Vite.

## Tasks

- [x] 1. Install backend dependencies and configure environment
  - In `server/`, install `@xenova/transformers`, `@google/generative-ai`, `express-rate-limit`, and `node-fetch`
  - Add `GEMINI_API_KEY` to `server/.env` (document the key name; do not commit a real value)
  - Add `VISUAL_SEARCH_RATE_LIMIT_WINDOW_MS`, `VISUAL_SEARCH_RATE_LIMIT_MAX`, `DESC_RATE_LIMIT_WINDOW_MS`, `DESC_RATE_LIMIT_MAX` env vars with sensible defaults in a `.env.example` file
  - Install `fast-check` and `vitest` as dev dependencies in `server/` for property-based tests
  - _Requirements: 1.1, 5.1, 8.1, 8.2_

- [x] 2. Update Product model with embedding field
  - [x] 2.1 Add `embedding` field to `server/models/Product.js`
    - Add `embedding: { type: [Number], default: undefined, select: false }` to the Mongoose schema
    - The field stores a 512-element Float32Array (CLIP ViT-B/32 output) serialized as a plain number array
    - `select: false` ensures the field is excluded from all normal product API responses
    - _Requirements: 4.1, 4.3_

- [x] 3. Implement VisualSearchService
  - [x] 3.1 Create `server/services/visualSearchService.js` with the `VisualSearchService` class
    - Implement `loadModel()`: lazy-loads the CLIP `image-feature-extraction` pipeline from `@xenova/transformers` on first call; caches the pipeline instance on the class
    - Implement `generateEmbedding(imageBuffer)`: calls the CLIP pipeline on the buffer, returns a 512-element `Float32Array`
    - _Requirements: 1.1, 2.5_
  - [ ]* 3.2 Write property test for valid image format acceptance (Property 1)
    - **Property 1: Valid image formats are accepted by visual search**
    - **Validates: Requirements 1.1**
    - Use `fc.constantFrom('image/jpeg', 'image/png', 'image/webp')` to generate MIME types; assert validation does not throw for these types
    - File: `server/services/__tests__/visualSearchService.test.js`
  - [x] 3.3 Implement input validation in `VisualSearchService`
    - Validate MIME type (accept only `image/jpeg`, `image/png`, `image/webp`); reject with `{ error: "Unsupported format. Upload a JPEG, PNG, or WebP image." }` for others
    - Validate file size ≤ 10 MB (10,485,760 bytes); reject with `{ error: "File too large. Maximum size is 10 MB." }` for oversized files
    - _Requirements: 1.1, 1.2, 1.3, 8.4_
  - [ ]* 3.4 Write property tests for oversized file rejection and non-image rejection (Properties 2 & 4)
    - **Property 2: Oversized files are rejected by visual search**
    - **Validates: Requirements 1.2**
    - **Property 4: Non-image data is rejected before processing**
    - **Validates: Requirements 1.3, 8.4**
    - Use `fc.integer({ min: 10_485_761, max: 50_000_000 })` for size; `fc.uint8Array` with non-image MIME for invalid data
    - File: `server/services/__tests__/visualSearchService.test.js`
  - [x] 3.5 Implement `search(imageBuffer, topK = 12)` in `VisualSearchService`
    - Call `generateEmbedding` on the query buffer
    - Load all product documents with `{ _id: 1, name: 1, brand: 1, category: 1, price: 1, discountedPrice: 1, images: 1, sizes: 1, embedding: 1 }` using `.select('+embedding')`
    - Compute cosine similarity between query embedding and each product embedding
    - Filter out products where all sizes have `stock === 0`
    - Filter out products with similarity score < 0.3
    - Sort by descending similarity score, return top `topK` (max 12) as `{ product, similarityScore }` objects
    - Return `{ results: [], message: "No similar products found. Try browsing by category." }` when result set is empty
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_
  - [ ]* 3.6 Write property tests for search result ordering, stock filtering, and field presence (Properties 5, 6 & 7)
    - **Property 5: Search results are bounded and sorted by similarity**
    - **Validates: Requirements 2.1**
    - **Property 6: Out-of-stock products are excluded from search results**
    - **Validates: Requirements 2.2**
    - **Property 7: Search result items contain all required fields**
    - **Validates: Requirements 2.4**
    - Mock the CLIP pipeline to return deterministic vectors; use `fc.array` of product arbitraries with mixed stock states
    - File: `server/services/__tests__/visualSearchService.test.js`
  - [x] 3.7 Implement `indexProduct(productId, imageUrls)` in `VisualSearchService`
    - Fetch the primary image (index 0) from the given URL using `node-fetch`
    - Generate embedding for the fetched image buffer
    - Update the product document: `Product.findByIdAndUpdate(productId, { embedding: Array.from(embedding) })`
    - Log and swallow errors (do not throw); the product save must not be blocked
    - _Requirements: 4.1, 4.3_
  - [ ]* 3.8 Write property test for embedding round-trip (Property 9)
    - **Property 9: Product embedding indexing round-trip**
    - **Validates: Requirements 4.1, 4.3**
    - For any product ID and image URL array, after `indexProduct` the stored embedding must be a 512-element number array; re-indexing must replace the previous value
    - File: `server/services/__tests__/visualSearchService.test.js`
  - [x] 3.9 Implement `removeProduct(productId)` in `VisualSearchService`
    - Unset the embedding field: `Product.findByIdAndUpdate(productId, { $unset: { embedding: '' } })`
    - _Requirements: 4.2_
  - [x] 3.10 Implement `rebuildIndex()` in `VisualSearchService`
    - Fetch all products in batches of 50 using cursor/skip pagination
    - For each product, call `indexProduct`; catch per-product errors, increment `failed` counter, log the error, and continue
    - Return `{ indexed: N, failed: M, errors: [...] }`
    - _Requirements: 4.4, 4.5_
  - [ ]* 3.11 Write property test for rebuild resilience (Property 10)
    - **Property 10: Index rebuild is resilient to individual failures**
    - **Validates: Requirements 4.5**
    - Inject failures on a random subset of products; assert `indexed + failed === total` and that the function does not throw
    - File: `server/services/__tests__/visualSearchService.test.js`

- [x] 4. Implement DescriptionGeneratorService
  - [x] 4.1 Create `server/services/descriptionGeneratorService.js` with the `DescriptionGeneratorService` class
    - Implement `generate(imageUrl)`:
      1. Fetch image bytes from the Cloudinary URL using `node-fetch`; validate size ≤ 10 MB
      2. Initialize `@google/generative-ai` with `GEMINI_API_KEY`; use model `gemini-1.5-flash`
      3. Send image bytes + structured prompt: _"You are a product copywriter for a shoe e-commerce store. Describe this shoe in 50–300 words covering style, color, and apparent use case (e.g., running, casual, formal). Write in English."_
      4. Count words in the response; if outside [50, 300], throw an error rather than returning the text
      5. Return the validated description string
    - _Requirements: 5.1, 5.3, 5.4, 6.1, 6.2, 6.3, 6.4_
  - [ ]* 4.2 Write property test for oversized file rejection in description generator (Property 3)
    - **Property 3: Oversized files are rejected by the description generator**
    - **Validates: Requirements 5.3**
    - Use `fc.integer({ min: 10_485_761, max: 50_000_000 })` to generate oversized byte lengths; mock `node-fetch` to return a response with that `Content-Length`
    - File: `server/services/__tests__/descriptionGeneratorService.test.js`
  - [ ]* 4.3 Write property test for description word count constraint (Property 11)
    - **Property 11: Generated descriptions satisfy the word count constraint**
    - **Validates: Requirements 6.1**
    - Mock Gemini to return `fc.string()` responses of varying word counts; assert descriptions with < 50 or > 300 words cause an error, and those within range are returned as-is
    - File: `server/services/__tests__/descriptionGeneratorService.test.js`

- [x] 5. Create visual search API route
  - [x] 5.1 Create `server/routes/visualSearch.js`
    - Mount `multer` with `memoryStorage` and a 10 MB file size limit; accept field name `image`
    - Apply `express-rate-limit`: 20 requests per minute per IP; on exceed return `{ error: "Too many requests. Try again after {resetTime}." }` with status 429
    - `POST /api/visual-search`: validate file present → call `VisualSearchService.search(req.file.buffer)` → return `{ results, message? }`
    - Handle all error cases from the error table in the design document (400 for validation, 500 for model failure, 429 for rate limit)
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1–2.5, 8.1, 8.3, 8.4_
  - [x] 5.2 Register the visual search route in `server/server.js`
    - Add `const visualSearchRoutes = require('./routes/visualSearch');` and `app.use('/api', visualSearchRoutes);`
    - _Requirements: 1.5_
  - [ ]* 5.3 Write unit tests for the visual search route
    - Test: no file uploaded → 400; unsupported MIME → 400; file > 10 MB → 400; valid image → 200 with results shape
    - Test: unauthenticated request succeeds (public endpoint)
    - Test: 21st request from same IP → 429 with reset header
    - File: `server/routes/__tests__/visualSearch.route.test.js`

- [x] 6. Create description generation API route
  - [x] 6.1 Add `POST /api/admin/generate-description` to `server/routes/admin.js`
    - Apply per-user rate limiter: 50 requests per hour per `req.user._id`; on exceed return 429 with reset message
    - Use `protect` + `admin` middleware (already imported in `admin.js`)
    - Body: `{ imageUrl: string }`; validate `imageUrl` is present
    - Call `DescriptionGeneratorService.generate(imageUrl)` → return `{ description }`
    - Handle all error cases from the design error table (400, 403, 502, 429)
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 6.1–6.4, 8.2, 8.3_
  - [ ]* 6.2 Write unit tests for the description generation route
    - Test: unauthenticated → 401; non-admin → 403; admin with no imageUrl → 400; admin with valid URL → 200 with `{ description }`
    - Test: Gemini timeout → 502 without writing to DB
    - Test: 51st request from same admin → 429
    - File: `server/routes/__tests__/adminAI.route.test.js`

- [x] 7. Hook catalog index sync into product controllers
  - [x] 7.1 Update the `POST /api/admin/products` route handler in `server/routes/admin.js`
    - After `Product.create(...)` succeeds, fire-and-forget: `visualSearchService.indexProduct(product._id, product.images).catch(err => console.error('Index error:', err))`
    - Import `VisualSearchService` at the top of `admin.js`
    - _Requirements: 4.1_
  - [x] 7.2 Update the `PUT /api/admin/products/:id` route handler in `server/routes/admin.js`
    - After `Product.findByIdAndUpdate(...)` succeeds, fire-and-forget `indexProduct` only when `req.files` were uploaded (images changed)
    - _Requirements: 4.3_
  - [x] 7.3 Update the `DELETE /api/admin/products/:id` route handler in `server/routes/admin.js`
    - After `Product.findByIdAndDelete(...)` succeeds, fire-and-forget: `visualSearchService.removeProduct(req.params.id).catch(err => console.error('Remove index error:', err))`
    - _Requirements: 4.2_

- [x] 8. Add admin rebuild index endpoint
  - [x] 8.1 Add `POST /api/admin/visual-search/rebuild-index` to `server/routes/admin.js`
    - Use `protect` + `admin` middleware
    - Call `VisualSearchService.rebuildIndex()` and return `{ indexed, failed, errors }`
    - _Requirements: 4.4, 4.5_

- [x] 9. Checkpoint — backend complete
  - Ensure all server-side tests pass, ask the user if questions arise.

- [x] 10. Implement VisualSearchModal frontend component
  - [x] 10.1 Create `src/components/VisualSearchModal.tsx`
    - Props: `isOpen: boolean`, `onClose: () => void`
    - Render a modal overlay with a drag-and-drop / file-picker zone (accept `image/jpeg,image/png,image/webp`, max 10 MB enforced client-side)
    - On file select: show image preview using `URL.createObjectURL`
    - Use `@tanstack/react-query` `useMutation` to `POST /api/visual-search` with `FormData`
    - Loading state: show a spinner and disable the submit button
    - Success state: render a grid of `ProductCard` components for each result; pass `onProductClick` and `onAuthRequired` props through
    - Empty result state: show "No similar products found. Try browsing by category." with a link to `/`
    - Error state: show a dismissible error banner inside the modal (not a full-page error)
    - "Clear" button: resets file, preview, and results; returns focus to text search
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_
  - [ ]* 10.2 Write property test for ProductCard-per-result rendering (Property 8)
    - **Property 8: ProductCard is rendered for each search result**
    - **Validates: Requirements 3.4**
    - Use `fc.array(productArbitrary, { minLength: 1, maxLength: 12 })` to generate result arrays; assert rendered `ProductCard` count equals array length
    - File: `src/components/__tests__/VisualSearchModal.test.tsx`
  - [ ]* 10.3 Write unit tests for VisualSearchModal UI states
    - Test: loading indicator shown during pending mutation
    - Test: "No similar products found" shown for empty result array
    - Test: clear button resets modal state (file, preview, results)
    - File: `src/components/__tests__/VisualSearchModal.test.tsx`

- [x] 11. Add camera icon button to Header
  - [x] 11.1 Modify `src/components/Header.tsx` to add visual search trigger
    - Import `Camera` from `lucide-react` and `VisualSearchModal` component
    - Add `showVisualSearch` state (`useState(false)`)
    - In the desktop search bar (`hidden lg:flex` form), add a `<button>` with `<Camera>` icon to the right of the search input (before the Search button); clicking it sets `showVisualSearch(true)`
    - In the mobile search bar (`lg:hidden` form), add the same camera button
    - Render `<VisualSearchModal isOpen={showVisualSearch} onClose={() => setShowVisualSearch(false)} />` at the bottom of the component (alongside `AuthModal` and `CartSidebar`)
    - _Requirements: 3.1_

- [x] 12. Add "Generate Description" button to AdminProductForm
  - [x] 12.1 Locate the admin product create/edit form (check `src/pages/` for the form used by `/admin/products/new` and `/admin/products/:id/edit` routes in `src/App.tsx`)
    - Read the existing form component to understand the current description field and image upload state
    - _Requirements: 7.1_
  - [x] 12.2 Add "Generate Description" button and generation logic to the admin product form
    - Add `isGenerating` state (`useState(false)`)
    - Place a "Generate Description" button adjacent to the description `<textarea>`
    - Button is disabled when no product image has been uploaded yet (check existing image state in the form)
    - On click: set `isGenerating(true)`, POST `{ imageUrl: images[0] }` to `POST /api/admin/generate-description` with admin auth token from `localStorage.getItem('adminToken')`
    - On success: populate the description field with the returned string (editable by admin)
    - On error: show inline error using `sonner` `toast.error(...)` (consistent with existing admin UI)
    - While generating: show spinner + "Generating…" text on the button, disable it
    - On complete (success or error): set `isGenerating(false)`
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_
  - [ ]* 12.3 Write unit tests for AdminProductForm description generation
    - Test: "Generate Description" button disabled when no image uploaded
    - Test: button disabled + spinner shown during generation
    - Test: description field populated and editable after success
    - Test: inline error shown on API failure
    - File: `src/components/__tests__/AdminProductForm.test.tsx`

- [x] 13. Final checkpoint — Ensure all tests pass
  - Run `vitest --run` in both `server/` and the root; ensure all tests pass. Ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- The CLIP model (~170 MB) is downloaded on first `loadModel()` call; subsequent calls use the cached pipeline
- `embedding` is `select: false` — always use `.select('+embedding')` when querying for similarity search
- Rate limiters use `express-rate-limit`; the per-user limiter for description generation keys on `req.user._id`
- All catalog sync calls (indexProduct, removeProduct) are fire-and-forget — product CRUD must never fail due to indexing errors
- Property tests require a minimum of 100 iterations (fast-check default); use `{ numRuns: 200 }` for critical properties (P5, P6, P9)
- Mock `@xenova/transformers` pipeline in all unit/property tests to return deterministic 512-d vectors; mock `@google/generative-ai` to return controlled strings
- Use `mongodb-memory-server` for any tests that touch the database
