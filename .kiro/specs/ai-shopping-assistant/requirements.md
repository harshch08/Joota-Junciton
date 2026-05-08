# Requirements Document

## Introduction

This document covers the AI-Powered Natural Language Shopping Assistant for Joota Junction, a shoe e-commerce platform. The feature adds a floating chat-style panel that lets shoppers describe what they're looking for in plain language — e.g., "Show me running shoes under ₹5000" or "Find something like Nike Air Max but cheaper" — and returns matching products from the catalog.

The assistant parses natural language intent (brand, category, price range, use case, color, etc.) using the OpenAI API (already integrated for product descriptions) and queries the existing MongoDB product catalog. It complements the existing visual search and text search features without replacing them.

---

## Glossary

- **Shopping_Assistant**: The end-to-end feature comprising the frontend chat panel and the backend NLP query service.
- **Assistant_Panel**: The floating UI component that opens when the user activates the Shopping_Assistant.
- **NLP_Service**: The backend service that sends user queries to the OpenAI API, extracts structured intent, and queries the Product catalog.
- **User_Query**: A natural language string entered by the shopper describing desired products.
- **Suggested_Query**: A pre-written example query displayed in the Assistant_Panel to help users get started.
- **Parsed_Intent**: The structured representation of a User_Query, containing extracted fields such as brand, category, price range, use case, color, and sort preference.
- **Assistant_Result**: The list of Products returned by the NLP_Service in response to a User_Query.
- **Product**: A document in the MongoDB Product collection with fields: name, brand, category, price, discountedPrice, description, images[], sizes[], featured, rating.
- **Shopper**: An authenticated or unauthenticated user browsing the storefront.
- **Conversation_Turn**: A single exchange consisting of one User_Query and one Assistant_Result.

---

## Requirements

### Requirement 1: Assistant Panel — Floating Entry Point

**User Story:** As a shopper, I want a persistent, unobtrusive button on the storefront, so that I can open the shopping assistant at any time without interrupting my browsing.

#### Acceptance Criteria

1. THE Shopping_Assistant SHALL render a floating action button on all storefront pages.
2. THE floating action button SHALL remain visible during page scroll without obscuring primary content.
3. WHEN the floating action button is activated, THE Assistant_Panel SHALL open as an overlay panel without navigating away from the current page.
4. WHEN the Assistant_Panel is open and the shopper activates the close control, THE Assistant_Panel SHALL close and return focus to the page.
5. THE floating action button SHALL include an accessible label readable by screen readers.

---

### Requirement 2: Assistant Panel — Suggested Queries

**User Story:** As a shopper, I want to see example queries when I open the assistant, so that I understand what kinds of questions I can ask without having to guess.

#### Acceptance Criteria

1. WHEN the Assistant_Panel opens with no prior Conversation_Turn, THE Assistant_Panel SHALL display at least 4 Suggested_Queries.
2. THE Suggested_Queries SHALL cover a variety of intent types including price-filtered search, brand-alternative search, use-case search, and style/color search.
3. WHEN a shopper selects a Suggested_Query, THE Assistant_Panel SHALL populate the input field with that query and submit it automatically.
4. WHILE an Assistant_Result is being loaded, THE Assistant_Panel SHALL hide the Suggested_Queries list to avoid layout shift.
5. IF the Assistant_Result is empty, THE Assistant_Panel SHALL re-display the Suggested_Queries to encourage the shopper to try a different query.

---

### Requirement 3: Natural Language Query Input

**User Story:** As a shopper, I want to type my own query in plain language, so that I can describe exactly what I'm looking for in my own words.

#### Acceptance Criteria

1. THE Assistant_Panel SHALL provide a text input field that accepts free-form natural language queries up to 500 characters.
2. WHEN the shopper submits a query (via Enter key or submit button), THE NLP_Service SHALL be called with the User_Query.
3. IF the User_Query is empty or contains only whitespace, THEN THE Assistant_Panel SHALL not submit the query and SHALL display an inline validation message.
4. IF the User_Query exceeds 500 characters, THEN THE Assistant_Panel SHALL prevent submission and display an inline character-limit message.
5. WHILE the NLP_Service is processing, THE Assistant_Panel SHALL display a loading indicator and disable the submit control.
6. THE Assistant_Panel SHALL preserve the User_Query text in the input field after results are returned, so the shopper can refine it.

---

### Requirement 4: Intent Parsing

**User Story:** As a shopper, I want the assistant to understand what I mean even when I use informal language, so that I get relevant results without needing to use exact product names or filters.

#### Acceptance Criteria

1. WHEN a User_Query is received, THE NLP_Service SHALL call the OpenAI API to extract a Parsed_Intent containing zero or more of: brand, category, use case, color, minimum price, maximum price, and sort preference.
2. THE NLP_Service SHALL construct a MongoDB query from the Parsed_Intent and execute it against the Product collection.
3. IF the OpenAI API returns an error or times out after 10 seconds, THEN THE NLP_Service SHALL return a descriptive error message to the Assistant_Panel and SHALL NOT return partial results.
4. THE NLP_Service SHALL handle queries that reference price comparisons (e.g., "cheaper than Nike Air Max") by resolving the reference product's price and using it as a maximum price bound.
5. THE NLP_Service SHALL normalize brand and category names extracted from the Parsed_Intent to match the values stored in the Product collection before querying.
6. FOR ALL valid User_Queries that contain a parseable intent, THE NLP_Service SHALL produce a Parsed_Intent with at least one non-null field.

---

### Requirement 5: Product Results Display

**User Story:** As a shopper, I want to see matching products directly in the assistant panel, so that I can evaluate options without leaving the current page.

#### Acceptance Criteria

1. WHEN an Assistant_Result is returned, THE Assistant_Panel SHALL display up to 8 matching Products.
2. THE Assistant_Panel SHALL render each Product using the existing ProductCard component, showing name, brand, price, discountedPrice (if present), and primary image.
3. WHEN a shopper selects a product from the Assistant_Result, THE Assistant_Panel SHALL close and navigate to that product's detail page.
4. IF the Assistant_Result contains zero Products, THE Assistant_Panel SHALL display a "No products found" message and suggest the shopper try a different query or browse by category.
5. THE Assistant_Panel SHALL display the total count of matched Products when the Assistant_Result contains more than 8 Products.
6. WHEN an Assistant_Result is displayed, THE Assistant_Panel SHALL show a plain-language summary of the Parsed_Intent (e.g., "Showing running shoes under ₹5,000") so the shopper can verify the assistant understood the query.

---

### Requirement 6: Conversation Context

**User Story:** As a shopper, I want to refine my search within the same session, so that I can narrow down results without starting over.

#### Acceptance Criteria

1. THE Assistant_Panel SHALL maintain a history of up to 5 Conversation_Turns within a single session.
2. WHEN the shopper submits a follow-up query, THE NLP_Service SHALL receive the current User_Query only; context from prior turns SHALL NOT be sent to the OpenAI API to limit token usage.
3. THE Assistant_Panel SHALL display the most recent Conversation_Turn's query and results; prior turns SHALL be accessible by scrolling up within the panel.
4. WHEN the shopper activates a "Clear conversation" control, THE Assistant_Panel SHALL reset to the initial state showing Suggested_Queries.
5. THE Assistant_Panel SHALL persist the conversation history for the duration of the browser session only; history SHALL NOT be stored server-side or across sessions.

---

### Requirement 7: Similar Product Search

**User Story:** As a shopper, I want to find alternatives to a specific product I already know, so that I can discover options that match my style at a different price point.

#### Acceptance Criteria

1. WHEN a User_Query references a specific product by name or description (e.g., "something like Nike Air Max"), THE NLP_Service SHALL identify the reference product and include its attributes in the Parsed_Intent.
2. WHEN a reference product is identified, THE NLP_Service SHALL query for Products in the same category and use case, excluding the reference product itself from the results.
3. IF the User_Query includes a price modifier (e.g., "cheaper", "under ₹X"), THE NLP_Service SHALL apply the corresponding price filter to the similar-product query.
4. IF no reference product matching the query description is found in the catalog, THEN THE NLP_Service SHALL fall back to a category and use-case based search using the remaining Parsed_Intent fields.

---

### Requirement 8: Backend API

**User Story:** As a developer, I want a well-defined API endpoint for the shopping assistant, so that the frontend and backend are cleanly decoupled and the endpoint can be maintained independently.

#### Acceptance Criteria

1. THE NLP_Service SHALL expose a POST endpoint at `/api/assistant/query` that accepts a JSON body with a `query` string field.
2. THE NLP_Service SHALL return a JSON response containing: `results` (array of Products), `parsedIntent` (the Parsed_Intent object), `intentSummary` (a human-readable string), and `totalCount` (integer).
3. THE NLP_Service SHALL be accessible to both authenticated and unauthenticated users.
4. THE NLP_Service SHALL limit each IP address to 30 assistant requests per minute.
5. IF a rate limit is exceeded, THEN THE NLP_Service SHALL return a 429 Too Many Requests response with a message indicating when the limit resets.
6. THE NLP_Service SHALL validate that the `query` field is a non-empty string of at most 500 characters before calling the OpenAI API; IF validation fails, THEN THE NLP_Service SHALL return a 400 Bad Request response.

---

### Requirement 9: Security and Cost Controls

**User Story:** As a system operator, I want the assistant to be protected against abuse and runaway API costs, so that the OpenAI usage remains predictable.

#### Acceptance Criteria

1. THE NLP_Service SHALL truncate any User_Query exceeding 500 characters before sending it to the OpenAI API.
2. THE NLP_Service SHALL use a low-cost OpenAI model (e.g., gpt-4o-mini) for intent parsing to minimize per-request cost.
3. THE NLP_Service SHALL set a maximum token limit of 300 on the OpenAI API response for intent parsing.
4. THE NLP_Service SHALL sanitize the Parsed_Intent fields before constructing MongoDB queries to prevent injection attacks.
5. IF the OpenAI API key is not configured, THEN THE NLP_Service SHALL return a 503 Service Unavailable response and SHALL log the misconfiguration.
