# Grouped Shopping List Card

A custom Lovelace card for Home Assistant that groups shopping list items by category using `[CATEGORY]` bracket prefixes with emoji headers.

![Home Assistant](https://img.shields.io/badge/Home%20Assistant-2024.1+-blue)

## Features

- Groups items by `[CATEGORY]` prefix (e.g., `[PRODUCE] Lettuce`)
- Emoji headers for each category
- Collapsible completed items section
- Add items inline with keyboard-friendly input
- Check/uncheck and delete items
- DOM diffing for smooth updates (no full re-renders)
- iOS keyboard fix — input stays focused during state updates
- Works with any `todo` entity

## Categories

| Category | Emoji |
|----------|-------|
| PRODUCE | `vegetables` |
| MEAT | `meat` |
| DAIRY | `cheese` |
| FROZEN | `ice` |
| BAKERY | `bread` |
| PANTRY | `canned` |
| BEVERAGES | `coffee` |
| SNACKS | `popcorn` |
| HEALTH | `pill` |
| HOUSEHOLD | `house` |
| OTHER | `package` |

Uncategorized items (without a `[CATEGORY]` prefix) appear at the top under a separate section.

## Installation

### Manual

1. Copy `grouped-shopping-list-card.js` to your `config/www/` directory
2. Add the resource in **Settings > Dashboards > Resources**:
   - URL: `/local/grouped-shopping-list-card.js?v=1`
   - Type: JavaScript Module

### Configuration

Add the card to a dashboard:

```yaml
type: custom:grouped-shopping-list-card
entity: todo.shopping_list
title: Shopping List  # optional
```

## AI Categorization

This card is designed to work with AI-powered categorization. Items added as plain text (e.g., "milk") can be categorized by an automation that calls an AI service to prefix them with the appropriate `[CATEGORY]` tag (e.g., `[DAIRY] Milk`).

Example automation using `ai_task.generate_data`:

```yaml
action:
  - action: ai_task.generate_data
    data:
      task_prompt: |
        Sort these shopping items into categories.
        Categories: PRODUCE, MEAT, DAIRY, FROZEN, BAKERY, PANTRY, BEVERAGES, SNACKS, HEALTH, HOUSEHOLD, OTHER
        Format each item as: [CATEGORY] item name
        Items: {{ items }}
```

## License

MIT
