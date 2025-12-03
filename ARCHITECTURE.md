# System Architecture
## 1. Core Components
```markdown
| Component Name | Responsibility |
|---|---|
| `App` | Manages global application state (API key, game level, humor level, mode), orchestrates view rendering based on user interaction and API key status. |
| `PrepositionGame` | Main game logic, orchestrates question generation, answer checking, score tracking, and UI transitions. |
| `CategorySelectionScreen` | Provides UI for users to select a preposition category or all categories. |
| `AboutSection` | Displays information about the PrepositionPal application. |
| `FaqSection` | Displays frequently asked questions about the application. |
| `Button` | Reusable styled button component. |
| `LoadingSpinner` | Displays a loading animation and message during asynchronous operations. |
| `CanvasImageDisplay` | Handles rendering of base64 image data or URLs onto an OffscreenCanvas using a Web Worker for performance. |
| `services/geminiService` | Handles all interactions with the Google Gemini API for text and image generation. |
| `services/firebaseService` | (Disabled) Placeholder for Firestore integration for question caching. Currently a no-op to prevent crashes. |
| `services/imageStore` | Non-reactive cache for large image data (base64 strings) to prevent React state serialization issues. |
```
## 2. Data Models & Schemas
```json
"// PrepositionCategory Enum
{
  "LOCATION": "Location",
  "DIRECTION": "Direction",
  "TIME": "Time",
  "MANNER": "Manner",
  "CAUSE": "Cause",
  "POSSESSION": "Possession",
  "ACTION_BY": "By (Who/What)"
}"

"// Preposition Enum
{
  // ... all defined Preposition values ...
}"

"// PrepositionItem Interface
{
  "preposition": "Preposition",
  "category": "PrepositionCategory",
  "description": "string",
  "exampleSentence": "string"
}"

"// GameLevel Enum
{
  "A1": "A1",
  "A2": "A2",
  "B1": "B1",
  "B2": "B2",
  "C1": "C1",
  "C2": "C2"
}"

"// AppMode Enum
{
  "GAME": "game"
}"

"// Question Interface (for in-game use)
{
  "id?": "string",
  "sentence": "string",
  "correctAnswer": "Preposition",
  "options": "Preposition[]",
  "imageId?": "string"
}"

"// FirestoreQuestion Interface (for database storage, currently disabled)
{
  "id?": "string",
  "level": "GameLevel",
  "category": "PrepositionCategory",
  "sentence": "string",
  "correctAnswer": "Preposition",
  "imageUrl": "string",
  "createdAt": "any" // Firestore Timestamp
}"
```
## 3. Critical Logic Flows
*   **Application Initialization**:
    1.  `App` component mounts, checks `localStorage` for saved game and humor levels.
    2.  `App` calls `checkApiKey` to verify if a Gemini API key is selected.
    3.  If no API key is selected, the `SelectApiKeyPrompt` is displayed, allowing the user to `openSelectKey()`.
    4.  If API key is selected, `CategorySelectionScreen` and game settings (difficulty, humor) are rendered.
*   **Question Generation Flow**:
    1.  User starts game or clicks "Next Question".
    2.  `PrepositionGame` sets loading state and retrieves a witty loading message.
    3.  Calls `generateRandomSentenceContext` to pick a `correctPreposition` based on `level` and `category`.
    4.  Calls `services/geminiService.generateText` with a `buildGeminiPrompt` to get a sentence with a blank.
    5.  Calls `services/geminiService.generateImage` with a descriptive prompt based on the generated sentence to get image data.
    6.  Image data is stored in `services/imageStore` and rendered by `CanvasImageDisplay` via an `OffscreenCanvas` Web Worker.
    7.  Random incorrect `options` are generated for the question.
    8.  If Firebase caching were enabled, `getQuestionFromCache` would be called first, and `addQuestionToCache` after successful generation.
    9.  `PrepositionGame` updates `currentQuestion` state and `loading` becomes false.
*   **Answer Checking and Feedback Flow**:
    1.  User selects an answer and clicks "Check Answer".
    2.  `PrepositionGame` compares `selectedAnswer` with `currentQuestion.correctAnswer`.
    3.  If correct, score is incremented, and a positive sound plays.
    4.  If incorrect, a negative sound plays, and `services/geminiService.generateText` is called to produce a brief explanation.
    5.  UI updates to show correct/incorrect styling and the explanation.
*   **Image Rendering with Web Worker**:
    1.  `CanvasImageDisplay` receives an `imageId`.
    2.  It retrieves the raw image data (base64 string or URL) from `services/imageStore`.
    3.  An `OffscreenCanvas` is created and transferred to a dedicated Web Worker.
    4.  The worker decodes the image data (or fetches it if a URL) into an `ImageBitmap`.
    5.  The worker draws the `ImageBitmap` onto the `OffscreenCanvas`, handling aspect ratios (cover effect).
    6.  The worker posts a 'loaded' message back to the main thread.
    7.  The main thread hides the `LoadingSpinner` and displays the canvas.
## 4. Prompt Engineering Library
*   `buildGeminiPrompt(level, preposition, humorLevel)`:
    *   **Purpose**: Generates a natural language prompt for the Gemini model to create a sentence for a preposition game.
    *   **Inputs**: `level` (GameLevel), `preposition` (Preposition), `humorLevel` (number).
    *   **Logic**: Dynamically adjusts vocabulary and sentence structure based on 'level'. A 'humorLevel' (0-10) input adds specific instructions to the prompt, ranging from 'strictly factual' for low levels to 'witty and clever' for high levels, to influence the tone of the generated scenario. Includes few-shot examples and strict constraints to ensure generated sentences are concise, natural, unambiguous, and suitable for image depiction.
    *   **Output**: A detailed string prompt for `geminiService.generateText`.
*   `Image Prompt (within PrepositionGame.tsx)`:
    *   **Purpose**: Generates a prompt for the Gemini model to create a photorealistic image.
    *   **Inputs**: The generated sentence (with the correct preposition inserted).
    *   **Logic**: Explicitly instructs the AI to directly and unambiguously depict the exact scene, avoid rendering any text, focus on a clear focal point emphasizing spatial/temporal relationships, and use distinct, easily identifiable objects.
    *   **Output**: A detailed string prompt for `geminiService.generateImage`.
*   `Explanation Prompt (within PrepositionGame.tsx)`:
    *   **Purpose**: Generates a prompt for the Gemini model to explain the correct use of a preposition.
    *   **Inputs**: `level` (GameLevel), `correctAnswer` (Preposition), `fullSentence` (string).
    *   **Logic**: Instructs the AI to provide a brief, simple, encouraging explanation tailored to the specified `level`.
    *   **Output**: A detailed string prompt for `geminiService.generateText`.

## 5. API Contracts
*   **`services/geminiService.ts`**:
    *   `getGeminiClient(): GoogleGenAI`: Initializes and returns a new `GoogleGenAI` instance with the API key from `process.env.API_KEY`.
    *   `generateText(prompt: string, model?: string): Promise<string>`: Sends a text prompt to the specified Gemini model (default `gemini-2.5-flash`), with `thinkingConfig` applied for `gemini-2.5-flash`. Returns the generated text.
    *   `generateSearchGroundedText(prompt: string, model?: string): Promise<{ text: string; groundingUrls: { uri: string; title?: string }[] }>`: Sends a text prompt to the specified Gemini model (default `gemini-2.5-flash`) with Google Search grounding enabled. Returns the generated text and an array of relevant grounding URLs (if any). Includes `thinkingConfig` for `gemini-2.5-flash`.
    *   `generateImage(prompt: string): Promise<string>`: Sends an image generation prompt to `gemini-2.5-flash-image`. Returns a base64 encoded image string (without prefix) or a fallback image URL. Handles API key selection errors.
*   **`services/firebaseService.ts` (currently disabled)**:
    *   `addQuestionToCache(question: Omit<FirestoreQuestion, 'createdAt' | 'id'>): Promise<void>`: Attempts to add a question to a Firestore collection. Currently a no-op.
    *   `getQuestionFromCache(level: GameLevel, category: PrepositionCategory | null, excludeIds: string[]): Promise<FirestoreQuestion | null>`: Attempts to retrieve a question from Firestore cache based on level, category, and excluded IDs. Currently a no-op, always returns `null`.
*   **`services/imageStore.ts`**:
    *   `setImageData(id: string, data: string): void`: Stores image data (base64 string or URL) by a unique ID.
    *   `getImageData(id: string): string | undefined`: Retrieves image data by ID.
    *   `clearImageData(id: string): void`: Removes image data by ID.
*   **`window.aistudio` (injected by runtime)**:
    *   `hasSelectedApiKey(): Promise<boolean>`: Checks if an API key has been selected by the user.
    *   `openSelectKey(): Promise<void>`: Opens a dialog for the user to select or enter an API key.
```