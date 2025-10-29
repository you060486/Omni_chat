# AI Chat Application

## Overview
This project is a full-featured, ChatGPT-style web application providing a unified interface to various AI models, including advanced GPT versions, Google's Gemini, and a specialized STEM AI. It supports multimodal input (text, voice, image, files) and image generation. The application aims to offer a seamless and rich conversational AI experience with features like real-time streaming responses, web search integration, and comprehensive conversation history management. The business vision is to provide a versatile AI interaction platform, leveraging cutting-edge models for diverse user needs, from general conversation to specialized tasks and creative content generation.

## User Preferences
- I prefer simple language.
- I want iterative development.
- Ask before making major changes.
- I prefer detailed explanations.
- Do not make changes to the folder `Z`.
- Do not make changes to the file `Y`.

## System Architecture

### UI/UX Decisions
The application features a dark theme by default, with a toggle for a light theme. It uses Tailwind CSS for styling and Shadcn UI for pre-built components, ensuring a modern and responsive design. The input field dynamically expands up to 50% screen height on desktop and 70% on mobile. 

**Conversation List UX**: Each conversation row in the sidebar features a flex layout where the text container (icon + title + timestamp) uses `flex-1 min-w-0` to allow truncation when space is limited, while the action buttons (edit/delete) occupy a fixed 64px width with `shrink-0` to guarantee visibility. The entire row is clickable for navigation, with buttons preventing event propagation. On mobile, action buttons are always visible; on desktop (≥768px), they appear only on hover. User messages display on the right with a light background (`bg-muted/30`) and blue avatar, while AI messages appear on the left without background and a muted avatar.

**Auth Page Layout**: The authentication page uses a centered flex layout (`items-center justify-center`) to ensure the login/signup form remains properly centered on mobile devices.

### Technical Implementations
- **Frontend**: Built with React and TypeScript, using Wouter for routing and TanStack Query for server state management. React Markdown handles rendering AI responses.
- **Backend**: An Express.js server integrates with various AI SDKs (OpenAI, Google Generative AI, Tavily) and handles file uploads via Multer, PDF parsing with PDF Parse, and database interactions with Drizzle ORM.
- **AI Models**:
    - OpenAI: GPT-5, GPT-5 Mini
    - Google: Gemini (Gemini 2.5 Pro for chat, Gemini 2.5 Flash Image for generation)
    - Specialized: o3-mini (for STEM, math, science, code)
- **Multimodal Input**: Supports text, voice (Web Speech API), image uploads (vision capabilities), and file uploads (PDF, text).
- **Image Generation**: Integrates Nano Banana (Google DeepMind's `gemini-2.5-flash-image`) for advanced image generation and editing directly within the chat.
- **Web Search**: Integrates Tavily API for automatic, context-aware web searches to provide up-to-date information.
- **Streaming Responses**: AI responses are streamed in real-time with typing animations.
- **Conversation History**: Stored locally in `localStorage`, grouped by date, with options for renaming, deleting, and switching chats. Model settings are saved per conversation.
- **Configurable Model Parameters**: Users can adjust system prompt, temperature, max tokens, and Top P. o3-mini also offers a "reasoning effort" setting. Settings are saved per conversation.
- **Preset Prompts**: Global preset prompts stored in PostgreSQL, manageable via an admin panel with CRUD operations through a protected API.

### Feature Specifications
- **Hybrid Storage**: Conversations are stored locally in `localStorage` for device isolation, while global preset prompts are stored in PostgreSQL for cross-device synchronization.
- **File Handling**: Images are converted to base64 for AI processing; text is extracted from PDFs and text files for context.
- **Hotkeys**: Ctrl+Enter for sending messages, Enter for new lines.

### System Design Choices
- **File Structure**: Organized into `client/` (frontend), `server/` (backend), and `shared/` (common types/schemas) directories.
- **API Endpoints**:
    - `POST /api/chat`: For sending messages and receiving SSE streaming responses, supporting multipart/form-data.
    - `POST /api/generate-image`: For generating images via Gemini Imagen.
    - Preset Prompts API (`/api/presets`): GET, POST, PUT, DELETE operations, protected by an `x-admin-password` header.

## External Dependencies
- **OpenAI API**: For GPT models.
- **Google Generative AI API**: For Gemini models and image generation.
- **Tavily API**: For web search capabilities.
- **PostgreSQL (Neon)**: For persistent storage of global preset prompts.
- **React, Tailwind CSS, Shadcn UI, React Markdown, Wouter, TanStack Query**: Frontend libraries and frameworks.
- **Express.js, OpenAI SDK, Google Generative AI SDK, Tavily SDK, Multer, PDF Parse, Drizzle ORM**: Backend libraries and tools.