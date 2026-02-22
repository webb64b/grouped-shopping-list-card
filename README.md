# Grouped Shopping List Card

A custom Lovelace card for Home Assistant that groups shopping list items by category using `[CATEGORY]` bracket prefixes with emoji headers. Includes built-in AI categorization and an optional automation package for full sorting features.

[![HACS Custom](https://img.shields.io/badge/HACS-Custom-41BDF5?logo=homeassistantcommunitystore)](https://github.com/hacs/integration)
![Home Assistant](https://img.shields.io/badge/Home%20Assistant-2026.1+-blue)

## Features

### Core (card only, no extra config needed)
- Groups items by `[CATEGORY]` prefix (e.g., `[PRODUCE] Lettuce`)
- Emoji headers for each category (11 built-in categories)
- Add, check/uncheck, and delete items inline
- Collapsible completed items section with "clear all" button
- Built-in lookup table (~400 common grocery items) for instant categorization
- AI-powered categorization for unknown items via `ai_task.generate_data`
- "Categorize All" button on the Uncategorized section header
- Configurable category display order
- DOM diffing for smooth updates (no full re-renders)
- iOS keyboard fix — input stays focused during state updates
- Works with any `todo` entity

### Full Features (with automation package)
- **Sort button** — full-list AI re-sort from the card header
- **Auto-categorize toggle** — automatically categorize new items as they're added
- **Daily auto-sort** — catches any uncategorized items added via voice, app, etc.
- **Bulk add script** — add comma-separated items via a service call

## Categories

| Category   | Emoji |
|------------|-------|
| PRODUCE    | 🥬    |
| MEAT       | 🥩    |
| DAIRY      | 🧀    |
| FROZEN     | 🧊    |
| BAKERY     | 🍞    |
| PANTRY     | 🥫    |
| BEVERAGES  | ☕    |
| SNACKS     | 🍿    |
| HEALTH     | 💊    |
| HOUSEHOLD  | 🏠    |
| OTHER      | 📦    |

Uncategorized items (without a `[CATEGORY]` prefix) appear at the top under a separate section.

## Installation

### HACS (Recommended)

1. Open **HACS** in Home Assistant
2. Click the three-dot menu (top right) and select **Custom repositories**
3. Paste `https://github.com/webb64b/grouped-shopping-list-card` and select **Dashboard** as the category
4. Click **Add**, then find **Grouped Shopping List Card** in the HACS store and install it
5. Restart Home Assistant
6. Add the card to a dashboard:

```yaml
type: custom:grouped-shopping-list-card
entity: todo.shopping_list
title: Shopping List
```

### Manual

1. Copy `grouped-shopping-list-card.js` to your `config/www/` directory
2. Add the resource in **Settings > Dashboards > Resources**:
   - URL: `/local/grouped-shopping-list-card.js?v=1`
   - Type: JavaScript Module
3. Add the card to a dashboard (same YAML as above)

Either method gives you the grouped display, manual item management, and the built-in categorization features (local lookup + AI categorize button).

### Step 2: Install the Automation Package (optional)

This adds the sort button, auto-categorize toggle, and daily auto-sort.

**Prerequisite:** You need an AI integration that exposes the `ai_task.generate_data` service. Any of these work:
- [OpenAI Conversation](https://www.home-assistant.io/integrations/openai_conversation/)
- [Google Generative AI](https://www.home-assistant.io/integrations/google_generative_ai_conversation/)
- [Anthropic](https://www.home-assistant.io/integrations/anthropic/)

**Install:**

1. Copy `packages/shopping_list_sorter.yaml` to your `config/packages/` directory
2. Make sure your `configuration.yaml` includes:
   ```yaml
   homeassistant:
     packages: !include_dir_named packages
   ```
3. Restart Home Assistant
4. Update the card config to reference the new entities:

```yaml
type: custom:grouped-shopping-list-card
entity: todo.shopping_list
title: Shopping List
sort_button_entity: input_button.sort_shopping_list_button
auto_sort_entity: input_boolean.auto_sort_shopping_list
```

## Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `entity` | string | **(required)** | The `todo` entity to use |
| `title` | string | `Shopping List` | Card title |
| `sort_button_entity` | string | `input_button.sort_shopping_list_button` | Entity for the sort button (requires package) |
| `auto_sort_entity` | string | `input_boolean.auto_sort_shopping_list` | Entity for auto-sort toggle (requires package) |
| `category_order` | list | *(see categories above)* | Custom display order for categories |

### Custom Category Order

You can reorder categories in the visual editor or in YAML:

```yaml
type: custom:grouped-shopping-list-card
entity: todo.shopping_list
category_order:
  - DAIRY
  - PRODUCE
  - MEAT
  - PANTRY
  - FROZEN
  - BAKERY
  - BEVERAGES
  - SNACKS
  - HEALTH
  - HOUSEHOLD
  - OTHER
```

## How Categorization Works

The card uses a two-tier approach:

1. **Local lookup (instant, free):** ~400 common grocery items are matched against a built-in dictionary. "milk" instantly becomes `[DAIRY] Milk` with zero API calls.

2. **AI fallback:** Items not found in the dictionary are sent to `ai_task.generate_data` for categorization. This requires an AI integration but handles any item.

The in-card categorization (both single-item and batch) uses **non-destructive in-place renames** — items are never deleted and re-added.

## What the Package Adds

The `shopping_list_sorter.yaml` package provides:

| Component | What it does |
|-----------|-------------|
| `input_button.sort_shopping_list_button` | Triggers a full-list AI re-sort when pressed |
| `input_boolean.auto_sort_shopping_list` | When ON, new items are auto-categorized on add |
| `automation.sort_shopping_list_button` | Clears the list and re-adds all items in sorted `[CATEGORY]` order |
| `automation.sort_shopping_list_daily` | At 9 AM, checks for uncategorized items and sorts if found |
| `script.add_items_to_shopping_list` | Add multiple comma-separated items via one service call |
| `script.sort_shopping_list_alphabetical` | Simple alphabetical sort (no AI) |

## License

MIT
