# Design Guidelines for AI Chat Application

## Design Approach

**Selected Approach:** Reference-Based + Custom System Hybrid  
**Primary References:** ChatGPT, Linear, Claude  
**Rationale:** This is a utility-focused AI chat application requiring efficient information hierarchy, multi-modal input handling, and complex state management. We'll draw from best practices of leading AI chat interfaces while creating a cohesive dark-themed experience.

**Design Principles:**
1. Clarity over decoration - every element serves a functional purpose
2. Efficient density - maximize usable space without overwhelming users
3. Seamless model switching - make AI model selection intuitive and visible
4. Multi-modal flexibility - accommodate text, images, voice, and files equally well

---

## Core Design Elements

### A. Typography

**Font Family:**
- Primary: 'Inter' (400, 500, 600) for UI elements and body text
- Monospace: 'JetBrains Mono' (400) for code blocks within chat

**Type Scale:**
- Page Title: text-xl font-semibold (model name, settings headers)
- Section Headers: text-base font-medium (sidebar sections)
- Message Content: text-[15px] leading-relaxed (chat messages)
- UI Labels: text-sm font-medium (buttons, dropdowns, input labels)
- Secondary Text: text-sm (timestamps, metadata)
- Caption Text: text-xs (helper text, character counts)

**Reading Optimization:**
- Chat message width: max-w-3xl for optimal readability
- Line height: leading-relaxed (1.625) for message content
- Paragraph spacing: space-y-4 within messages

---

### B. Layout System

**Spacing Primitives:**
Primary units: 2, 3, 4, 6, 8, 12, 16 (Tailwind scale)
- Micro spacing (gaps, padding): 2, 3, 4
- Component spacing: 4, 6, 8
- Section spacing: 12, 16
- Major layout divisions: 16, 20

**Application Structure:**

**Three-Panel Layout:**
```
[Sidebar: w-64] [Chat Area: flex-1] [Details Panel: w-80 - collapsible]
```

**Sidebar (Left - w-64):**
- Fixed width navigation panel
- Sticky positioning
- Contains: New chat button, conversation history, model selector, settings access
- Sections separated by py-6
- Internal padding: px-4

**Main Chat Area (Center - flex-1):**
- Maximum content width: max-w-4xl mx-auto
- Top bar: h-14 sticky with model indicator and actions
- Message container: px-6 py-4 per message
- Input area: sticky bottom with pt-4 pb-6
- Scroll container: Custom scrollbar styling

**Details Panel (Right - w-80):**
- Toggleable via icon button
- Shows: File attachments, image previews, conversation metadata
- Internal padding: p-6
- Collapsible with smooth transition

**Responsive Behavior:**
- Mobile: Single column, sidebar becomes slide-over drawer
- Tablet: Hide details panel, show main chat + sidebar
- Desktop: Full three-panel layout

---

### C. Component Library

**1. Navigation & Model Selection**

**Model Selector (Prominent Dropdown):**
- Location: Top of sidebar OR top bar of chat area
- Height: h-12
- Display: Icon + model name + token info
- States: Default, hover, active, expanded
- Dropdown items: py-3 px-4 with model icon, name, and description
- Active model: Visual indicator (icon or subtle background treatment)

**Conversation List:**
- Item height: min-h-12
- Padding: px-4 py-3
- Truncate long titles: truncate with hover tooltip
- Grouping: "Today", "Yesterday", "Previous 7 days", "Older"
- Group headers: text-xs font-medium px-4 py-2

**New Chat Button:**
- Full-width in sidebar: w-full
- Height: h-11
- Prominent placement at top of sidebar
- Icon + "New Chat" text

**2. Chat Interface**

**Message Bubbles:**
- User messages: ml-auto max-w-3xl
- AI messages: mr-auto max-w-3xl
- Padding: px-6 py-4
- Spacing between: space-y-6
- No traditional "bubble" styling - use subtle differentiation via layout positioning

**Message Structure:**
```
[Avatar/Icon: 8x8] [Content Column: flex-1] [Actions: opacity-0 group-hover:opacity-100]
```

**Message Actions:**
- Positioned top-right of message on hover
- Icons: Copy, Regenerate (for AI), Edit (for user), Delete
- Icon size: w-5 h-5
- Spacing: gap-2

**Code Blocks:**
- Distinct treatment within messages
- Header bar with language label + copy button
- Padding: p-4
- Font: JetBrains Mono
- Line numbers: Optional, text-xs

**Image Display in Chat:**
- Inline images: max-w-md rounded-lg
- Click to expand to modal view
- Generated images: Same treatment + download/copy options
- Multiple images: Grid layout, grid-cols-2 gap-3

**3. Input Area**

**Composite Input System:**
- Container: Centered, max-w-3xl
- Base height: min-h-24
- Structure: Multi-row textarea with attachment bar below

**Textarea:**
- Auto-expanding (min 2 rows, max 8 rows)
- Padding: px-4 py-3
- Border treatment: Subtle focus state
- Placeholder text guides multi-modal usage

**Attachment Bar:**
- Height: h-12
- Icon buttons: Image upload, File upload, Voice input, Image generation
- Icon size: w-5 h-5
- Spacing: gap-4
- Alignment: Left side of input

**Send Button:**
- Position: Bottom-right corner of input
- Size: w-10 h-10
- Disabled state when input empty
- Icon only (send arrow)

**Active File/Image Preview:**
- Shows above input when files attached
- Thumbnail grid: max-h-24
- Individual preview: w-20 h-20 with remove button
- File name truncation for documents

**4. File & Image Handling**

**Upload Drop Zone:**
- Appears on drag-over anywhere in chat area
- Full coverage overlay with centered prompt
- Dashed outline treatment
- Icon + text instruction

**Image Generation Interface:**
- Modal or slide-up panel
- Prompt textarea: min-h-32
- Style/size options: Radio buttons or segmented control
- Generate button: Prominent, w-full or aligned right
- Loading state: Progress indicator + "Generating..." text

**Voice Input:**
- Modal or inline expansion
- Waveform visualization (simple bars)
- Status: "Listening...", "Processing..."
- Cancel and send options
- Automatic transcription display before sending

**5. Settings & Configuration**

**Settings Panel (Modal or Right Panel):**
- Sections: API Keys, Preferences, About
- Section spacing: space-y-8
- Section headers: text-base font-medium mb-4

**Form Elements:**
- Label above input: text-sm font-medium mb-2
- Input height: h-11
- Full-width inputs within sections
- Helper text below: text-xs
- API key display: Masked with reveal toggle

**Model Configuration:**
- Each model: Expandable card
- Shows: Model name, capabilities, pricing info
- Toggle or checkbox to enable/disable

---

### D. Interaction Patterns

**Lazy Loading:**
- Conversation list: Load on scroll
- Message history: Load previous messages on scroll up
- Smooth loading indicators

**Optimistic Updates:**
- User messages appear immediately
- AI streaming response: Text appears token-by-token
- Image generation: Placeholder → Progress → Final image

**Keyboard Shortcuts:**
- Enter: Send (Shift+Enter for new line)
- Cmd/Ctrl + K: New chat
- Cmd/Ctrl + /: Focus model selector
- Visible hint: Subtle text near input

**Error States:**
- Inline error messages below relevant component
- Retry action for failed operations
- API error handling: Clear messaging with suggested actions

---

### E. Responsive Considerations

**Mobile (< 768px):**
- Single column, full-width chat
- Sidebar: Hamburger menu → slide-over drawer
- Input: Full-width with stacked attachment buttons
- Message width: Full width with reduced padding (px-4)

**Tablet (768px - 1024px):**
- Show sidebar + chat area
- Details panel: Hidden by default, toggle to overlay
- Input: max-w-2xl

**Desktop (> 1024px):**
- Full three-panel layout
- Details panel: Toggle between visible/hidden
- Optimal reading width maintained

---

### F. Accessibility

**Focus Management:**
- Clear focus indicators on all interactive elements
- Focus trap in modals
- Keyboard navigation through conversation history
- Skip to main content link

**Screen Reader Support:**
- Semantic HTML structure
- ARIA labels for icon buttons
- Live region for streaming AI responses
- Announce model changes

**Contrast & Readability:**
- Text meets WCAG AA standards minimum
- Interactive elements: Clearly distinguishable
- Focus indicators: Visible against all backgrounds

---

## Special Considerations

**Multi-Modal Input Clarity:**
- Clear visual feedback when switching input modes (voice, image, text)
- Distinct icons for each capability
- Tooltip guidance on first use

**Model Switching:**
- Model indicator always visible in chat header
- Conversation context: Clearly indicate which model generated each message (subtle icon or label)
- Switching mid-conversation: Confirmation prompt or seamless with indicator

**Performance:**
- Virtual scrolling for long conversation histories
- Lazy load images and files
- Optimize re-renders during streaming responses

---

This design creates a professional, efficient AI chat application that balances feature richness with clarity, ensuring users can seamlessly interact with multiple AI models and input methods within a cohesive dark-themed interface.