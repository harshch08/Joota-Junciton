# Requirements Document

## Introduction

This document covers two AI/ML features for Joota Junction, a shoe e-commerce platform:

1. **Visual Search** — Users upload a photo of a shoe and the system returns visually similar products from the catalog.
2. **AI-Generated Product Descriptions** — Admins upload a product image and the AI generates a ready-to-use product description, speeding up the product listing workflow.

Both features integrate with the existing React + Vite + TypeScript frontend, Node.js + Express backend, MongoDB (Mongoose) data layer, and Cloudinary image storage.

---

## Glossary

- **Visual_Search_Service**: The backend service responsible for extracting image embeddings and performing similarity search against the catalog index.
- **Description_Generator**: The backend service that calls an AI/LLM API to produce a product description from an uploaded image.
- **Embedding**: A numerical vector representation of an image used for similarity comparison.
- **Catalog_Index**: The vector store or similarity index built from embeddings of all product images in the database.
- **Query_Image**: The shoe image uploaded by a user to initiate a visual search.
- **Admin**: A user with the `admin` role as defined in the User model.
- **Product**: A document in the MongoDB Product collection with fields: name, brand, category, price, discountedPrice, description, images[], sizes[], featured, rating, reviews.
- **Similarity_Score**: A numeric value between 0 and 1 representing how visually similar two images are, where 1 is identical.
- **Visual_Search_Result**: A ranked list of Products returned by the Visual_Search_Service in response to a Query_Image.

---

## Requirements

### Requirement 1: Visual Search — Image Upload

**User Story:** As a shopper, I want to upload a photo of a shoe I like, so that I can find similar products available on Joota Junction without knowing the brand or name.

#### Acceptance Criteria

1. THE Visual_Search_Service SHALL accept image uploads in JPEG, PNG, and WebP formats.
2. IF an uploaded file exceeds 10 MB, THEN THE Visual_Search_Service SHALL reject the request and return a descriptive error message.
3. IF an uploaded file is not a supported image format, THEN THE Visual_Search_Service SHALL reject the request and return a descriptive error message.
4. WHEN a valid Query_Image is uploaded, THE Visual_Search_Service SHALL process the image and return a Visual_Search_Result within 10 seconds.
5. THE Visual_Search_Service SHALL be accessible to both authenticated and unauthenticated users.

---

### Requirement 2: Visual Search — Similarity Matching

**User Story:** As a shopper, I want the visual search results to show me the most relevant shoes, so that I can quickly find products that match what I'm looking for.

#### Acceptance Criteria

1. WHEN a Query_Image is processed, THE Visual_Search_Service SHALL return up to 12 Products ranked by descending Similarity_Score.
2. THE Visual_Search_Service SHALL only include Products with at least one size in stock in the Visual_Search_Result.
3. IF no Products have a Similarity_Score above 0.3, THEN THE Visual_Search_Service SHALL return an empty result set and a message indicating no similar products were found.
4. THE Visual_Search_Service SHALL include each matched Product's name, brand, category, price, discountedPrice, images, and Similarity_Score in the Visual_Search_Result.
5. WHEN the Catalog_Index is queried, THE Visual_Search_Service SHALL complete the similarity lookup within 3 seconds.

---

### Requirement 3: Visual Search — Frontend UI

**User Story:** As a shopper, I want a clear and accessible way to trigger visual search from the storefront, so that I can use the feature without confusion.

#### Acceptance Criteria

1. THE Visual_Search_UI SHALL provide a camera/image icon button in the main search bar that opens an image upload interface.
2. WHEN a user selects or drops an image, THE Visual_Search_UI SHALL display a preview of the Query_Image before submitting.
3. WHEN results are loading, THE Visual_Search_UI SHALL display a loading indicator.
4. WHEN a Visual_Search_Result is returned, THE Visual_Search_UI SHALL render matched products using the existing ProductCard component.
5. WHEN a Visual_Search_Result is empty, THE Visual_Search_UI SHALL display a "No similar products found" message and a prompt to browse by category.
6. THE Visual_Search_UI SHALL allow users to clear the Query_Image and return to text-based search without a full page reload.

---

### Requirement 4: Visual Search — Catalog Index Management

**User Story:** As a system operator, I want the visual search index to stay in sync with the product catalog, so that newly added or removed products are reflected in search results.

#### Acceptance Criteria

1. WHEN a new Product is created, THE Catalog_Index SHALL be updated to include the embeddings for all images in that Product's images array.
2. WHEN a Product is deleted, THE Catalog_Index SHALL remove all embeddings associated with that Product.
3. WHEN a Product's images array is updated, THE Catalog_Index SHALL replace the previous embeddings for that Product with embeddings derived from the updated images array.
4. THE Visual_Search_Service SHALL expose an admin-only endpoint to trigger a full Catalog_Index rebuild from all current Products.
5. IF embedding generation fails for a Product image during indexing, THEN THE Visual_Search_Service SHALL log the error and continue indexing the remaining images.

---

### Requirement 5: AI-Generated Product Descriptions — Image Input

**User Story:** As an admin, I want to upload a product image and have AI generate a description for me, so that I can list new shoes faster without writing descriptions manually.

#### Acceptance Criteria

1. THE Description_Generator SHALL accept image uploads in JPEG, PNG, and WebP formats from authenticated Admin users only.
2. IF a non-Admin user attempts to access the description generation endpoint, THEN THE Description_Generator SHALL return a 403 Forbidden error.
3. IF an uploaded file exceeds 10 MB, THEN THE Description_Generator SHALL reject the request and return a descriptive error message.
4. WHEN a valid product image is submitted, THE Description_Generator SHALL return a generated description within 15 seconds.

---

### Requirement 6: AI-Generated Product Descriptions — Description Quality

**User Story:** As an admin, I want the AI-generated description to be relevant and ready to use, so that I spend minimal time editing before publishing.

#### Acceptance Criteria

1. WHEN a shoe image is processed, THE Description_Generator SHALL produce a description between 50 and 300 words.
2. THE Description_Generator SHALL include details about visible shoe attributes such as style, color, and apparent use case (e.g., running, casual, formal) in the generated description.
3. THE Description_Generator SHALL produce descriptions in English.
4. IF the AI provider returns an error or times out, THEN THE Description_Generator SHALL return a descriptive error message and SHALL NOT save any partial description to the Product.

---

### Requirement 7: AI-Generated Product Descriptions — Admin Workflow Integration

**User Story:** As an admin, I want the description generator to be integrated into the product creation and editing flow, so that I don't have to switch between tools.

#### Acceptance Criteria

1. THE Admin_Product_Form SHALL include a "Generate Description" button adjacent to the description input field on both the new product and edit product pages.
2. WHEN the Admin clicks "Generate Description" and a product image has been uploaded, THE Admin_Product_Form SHALL call the Description_Generator and populate the description field with the result.
3. WHEN the Admin clicks "Generate Description" and no product image has been uploaded, THE Admin_Product_Form SHALL display an inline error prompting the Admin to upload an image first.
4. WHEN a generated description is populated in the description field, THE Admin_Product_Form SHALL allow the Admin to edit the description before saving.
5. WHILE the Description_Generator is processing, THE Admin_Product_Form SHALL disable the "Generate Description" button and display a loading indicator.

---

### Requirement 8: Security and Rate Limiting

**User Story:** As a system operator, I want AI endpoints to be protected against abuse, so that API costs and server load remain predictable.

#### Acceptance Criteria

1. THE Visual_Search_Service SHALL limit each IP address to 20 visual search requests per minute.
2. THE Description_Generator SHALL limit each Admin account to 50 description generation requests per hour.
3. IF a rate limit is exceeded, THEN THE system SHALL return a 429 Too Many Requests response with a message indicating when the limit resets.
4. THE Visual_Search_Service SHALL validate and sanitize all uploaded image data before processing to prevent injection attacks.
