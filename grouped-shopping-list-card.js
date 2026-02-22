/**
 * Grouped Shopping List Card for Home Assistant
 * Groups items by [CATEGORY] bracket prefixes with emoji headers.
 * Uses DOM diffing (not innerHTML rebuild) so iOS WKWebView doesn't
 * dismiss the keyboard on every hass update.
 */

const CARD_VERSION = '1.0.0';
console.info(
  `%c GROUPED-SHOPPING-LIST-CARD %c v${CARD_VERSION} `,
  'color: white; background: #555; font-weight: bold; padding: 2px 4px;',
  'color: white; background: #1c8c4c; font-weight: bold; padding: 2px 4px;'
);

const CATEGORY_EMOJI = {
  PRODUCE: '🥬',
  MEAT: '🥩',
  DAIRY: '🧀',
  FROZEN: '🧊',
  BAKERY: '🍞',
  PANTRY: '🥫',
  BEVERAGES: '☕',
  SNACKS: '🍿',
  HEALTH: '💊',
  HOUSEHOLD: '🏠',
  OTHER: '📦',
};

const CATEGORY_ORDER = [
  'PRODUCE', 'MEAT', 'DAIRY', 'FROZEN', 'BAKERY',
  'PANTRY', 'BEVERAGES', 'SNACKS', 'HEALTH', 'HOUSEHOLD', 'OTHER',
];

const UNCATEGORIZED_EMOJI = '📝';
const UNCATEGORIZED_LABEL = 'UNCATEGORIZED';

/**
 * Common grocery items → category lookup. Checked before calling AI.
 * Keys are lowercase. Supports both singular and plural forms.
 */
const COMMON_ITEMS = {
  // PRODUCE
  'apple': 'PRODUCE', 'apples': 'PRODUCE', 'avocado': 'PRODUCE', 'avocados': 'PRODUCE',
  'banana': 'PRODUCE', 'bananas': 'PRODUCE', 'basil': 'PRODUCE', 'bell pepper': 'PRODUCE',
  'bell peppers': 'PRODUCE', 'blueberries': 'PRODUCE', 'broccoli': 'PRODUCE',
  'cabbage': 'PRODUCE', 'carrots': 'PRODUCE', 'carrot': 'PRODUCE', 'celery': 'PRODUCE',
  'cherries': 'PRODUCE', 'cilantro': 'PRODUCE', 'corn': 'PRODUCE', 'cucumber': 'PRODUCE',
  'cucumbers': 'PRODUCE', 'garlic': 'PRODUCE', 'ginger': 'PRODUCE', 'grapes': 'PRODUCE',
  'green beans': 'PRODUCE', 'green onions': 'PRODUCE', 'herbs': 'PRODUCE',
  'jalapeno': 'PRODUCE', 'jalapenos': 'PRODUCE', 'kale': 'PRODUCE', 'lemons': 'PRODUCE',
  'lemon': 'PRODUCE', 'lettuce': 'PRODUCE', 'limes': 'PRODUCE', 'lime': 'PRODUCE',
  'mango': 'PRODUCE', 'mangoes': 'PRODUCE', 'melon': 'PRODUCE', 'mint': 'PRODUCE',
  'mushrooms': 'PRODUCE', 'mushroom': 'PRODUCE', 'onion': 'PRODUCE', 'onions': 'PRODUCE',
  'orange': 'PRODUCE', 'oranges': 'PRODUCE', 'parsley': 'PRODUCE', 'peaches': 'PRODUCE',
  'pears': 'PRODUCE', 'peas': 'PRODUCE', 'peppers': 'PRODUCE', 'pineapple': 'PRODUCE',
  'potatoes': 'PRODUCE', 'potato': 'PRODUCE', 'raspberries': 'PRODUCE',
  'romaine': 'PRODUCE', 'rosemary': 'PRODUCE', 'salad': 'PRODUCE', 'salad mix': 'PRODUCE',
  'scallions': 'PRODUCE', 'shallots': 'PRODUCE', 'spinach': 'PRODUCE',
  'squash': 'PRODUCE', 'strawberries': 'PRODUCE', 'sweet potato': 'PRODUCE',
  'sweet potatoes': 'PRODUCE', 'thyme': 'PRODUCE', 'tomato': 'PRODUCE',
  'tomatoes': 'PRODUCE', 'watermelon': 'PRODUCE', 'zucchini': 'PRODUCE',
  'arugula': 'PRODUCE', 'asparagus': 'PRODUCE', 'beets': 'PRODUCE',
  'brussels sprouts': 'PRODUCE', 'cauliflower': 'PRODUCE', 'clementines': 'PRODUCE',
  'coleslaw': 'PRODUCE', 'coleslaw mix': 'PRODUCE', 'dill': 'PRODUCE',
  'edamame': 'PRODUCE', 'eggplant': 'PRODUCE', 'fennel': 'PRODUCE', 'figs': 'PRODUCE',
  'fruit': 'PRODUCE', 'green pepper': 'PRODUCE', 'honeydew': 'PRODUCE',
  'jicama': 'PRODUCE', 'kiwi': 'PRODUCE', 'leeks': 'PRODUCE', 'nectarines': 'PRODUCE',
  'okra': 'PRODUCE', 'papaya': 'PRODUCE', 'parsnips': 'PRODUCE', 'plums': 'PRODUCE',
  'pomegranate': 'PRODUCE', 'radishes': 'PRODUCE', 'red onion': 'PRODUCE',
  'red pepper': 'PRODUCE', 'rhubarb': 'PRODUCE', 'shallot': 'PRODUCE',
  'snap peas': 'PRODUCE', 'snow peas': 'PRODUCE', 'sprouts': 'PRODUCE',
  'tangerines': 'PRODUCE', 'turnips': 'PRODUCE', 'yams': 'PRODUCE',
  'shredded lettuce': 'PRODUCE', 'baby spinach': 'PRODUCE', 'mixed greens': 'PRODUCE',

  // MEAT
  'bacon': 'MEAT', 'beef': 'MEAT', 'brisket': 'MEAT', 'chicken': 'MEAT',
  'chicken breast': 'MEAT', 'chicken breasts': 'MEAT', 'chicken thighs': 'MEAT',
  'chicken wings': 'MEAT', 'deli meat': 'MEAT', 'ground beef': 'MEAT',
  'ground turkey': 'MEAT', 'ham': 'MEAT', 'hot dogs': 'MEAT', 'lamb': 'MEAT',
  'meatballs': 'MEAT', 'pork': 'MEAT', 'pork chops': 'MEAT', 'ribs': 'MEAT',
  'roast': 'MEAT', 'salmon': 'MEAT', 'sausage': 'MEAT', 'sausages': 'MEAT',
  'shrimp': 'MEAT', 'steak': 'MEAT', 'steaks': 'MEAT', 'tilapia': 'MEAT',
  'tuna': 'MEAT', 'turkey': 'MEAT', 'crab': 'MEAT', 'fish': 'MEAT',
  'lobster': 'MEAT', 'pepperoni': 'MEAT', 'prosciutto': 'MEAT', 'salami': 'MEAT',
  'scallops': 'MEAT', 'cod': 'MEAT', 'catfish': 'MEAT', 'anchovies': 'MEAT',
  'chorizo': 'MEAT', 'corned beef': 'MEAT', 'filet': 'MEAT', 'flank steak': 'MEAT',
  'ground chicken': 'MEAT', 'ground pork': 'MEAT', 'jerky': 'MEAT',
  'lunch meat': 'MEAT', 'pork loin': 'MEAT', 'pork tenderloin': 'MEAT',
  'pulled pork': 'MEAT', 'rib eye': 'MEAT', 'ribeye': 'MEAT', 'roast beef': 'MEAT',
  'sirloin': 'MEAT', 'tri tip': 'MEAT', 'wings': 'MEAT',

  // DAIRY
  'butter': 'DAIRY', 'cheddar': 'DAIRY', 'cheese': 'DAIRY', 'colby jack': 'DAIRY',
  'cottage cheese': 'DAIRY', 'cream': 'DAIRY', 'cream cheese': 'DAIRY',
  'eggs': 'DAIRY', 'egg': 'DAIRY', 'feta': 'DAIRY', 'goat cheese': 'DAIRY',
  'greek yogurt': 'DAIRY', 'half and half': 'DAIRY', 'heavy cream': 'DAIRY',
  'milk': 'DAIRY', 'mozzarella': 'DAIRY', 'parmesan': 'DAIRY',
  'provolone': 'DAIRY', 'ricotta': 'DAIRY', 'shredded cheese': 'DAIRY',
  'sliced cheese': 'DAIRY', 'sour cream': 'DAIRY', 'swiss cheese': 'DAIRY',
  'whipped cream': 'DAIRY', 'whipping cream': 'DAIRY', 'yogurt': 'DAIRY',
  'american cheese': 'DAIRY', 'brie': 'DAIRY', 'buttermilk': 'DAIRY',
  'coffee creamer': 'DAIRY', 'creamer': 'DAIRY', 'eggnog': 'DAIRY',
  'gouda': 'DAIRY', 'gruyere': 'DAIRY', 'jack cheese': 'DAIRY',
  'monterey jack': 'DAIRY', 'oat milk': 'DAIRY', 'almond milk': 'DAIRY',
  'pepper jack': 'DAIRY', 'string cheese': 'DAIRY', 'velveeta': 'DAIRY',

  // FROZEN
  'frozen berries': 'FROZEN', 'frozen fruit': 'FROZEN', 'frozen meals': 'FROZEN',
  'frozen peas': 'FROZEN', 'frozen pizza': 'FROZEN', 'frozen vegetables': 'FROZEN',
  'frozen veggies': 'FROZEN', 'frozen waffles': 'FROZEN', 'ice cream': 'FROZEN',
  'popsicles': 'FROZEN', 'tater tots': 'FROZEN', 'frozen chicken': 'FROZEN',
  'frozen fries': 'FROZEN', 'french fries': 'FROZEN', 'corn dogs': 'FROZEN',
  'frozen burritos': 'FROZEN', 'frozen shrimp': 'FROZEN', 'ice pops': 'FROZEN',
  'lean cuisine': 'FROZEN', 'pizza rolls': 'FROZEN', 'pot pies': 'FROZEN',
  'tv dinners': 'FROZEN', 'waffles': 'FROZEN', 'frozen dinner': 'FROZEN',
  'frozen dinners': 'FROZEN', 'frozen fish': 'FROZEN', 'ice': 'FROZEN',
  'sorbet': 'FROZEN', 'gelato': 'FROZEN',

  // BAKERY
  'bagels': 'BAKERY', 'baguette': 'BAKERY', 'bread': 'BAKERY', 'buns': 'BAKERY',
  'cake': 'BAKERY', 'cinnamon rolls': 'BAKERY', 'croissants': 'BAKERY',
  'donuts': 'BAKERY', 'doughnuts': 'BAKERY', 'english muffins': 'BAKERY',
  'hamburger buns': 'BAKERY', 'hot dog buns': 'BAKERY', 'muffins': 'BAKERY',
  'naan': 'BAKERY', 'pie': 'BAKERY', 'pita': 'BAKERY', 'pita bread': 'BAKERY',
  'rolls': 'BAKERY', 'sourdough': 'BAKERY', 'tortillas': 'BAKERY',
  'wheat bread': 'BAKERY', 'white bread': 'BAKERY', 'wraps': 'BAKERY',
  'cornbread': 'BAKERY', 'crescent rolls': 'BAKERY', 'dinner rolls': 'BAKERY',
  'flatbread': 'BAKERY', 'flour tortillas': 'BAKERY', 'focaccia': 'BAKERY',
  'french bread': 'BAKERY', 'garlic bread': 'BAKERY', 'hoagie rolls': 'BAKERY',
  'kaiser rolls': 'BAKERY', 'pancake mix': 'BAKERY', 'rye bread': 'BAKERY',
  'sub rolls': 'BAKERY', 'texas toast': 'BAKERY', 'corn tortillas': 'BAKERY',

  // PANTRY
  'baking powder': 'PANTRY', 'baking soda': 'PANTRY', 'bbq sauce': 'PANTRY',
  'beans': 'PANTRY', 'black beans': 'PANTRY', 'bouillon': 'PANTRY',
  'bread crumbs': 'PANTRY', 'broth': 'PANTRY', 'brown sugar': 'PANTRY',
  'canned corn': 'PANTRY', 'canned tomatoes': 'PANTRY', 'cereal': 'PANTRY',
  'chicken broth': 'PANTRY', 'coconut milk': 'PANTRY', 'cooking spray': 'PANTRY',
  'cornstarch': 'PANTRY', 'dressing': 'PANTRY', 'flour': 'PANTRY',
  'honey': 'PANTRY', 'hot sauce': 'PANTRY', 'jam': 'PANTRY', 'jelly': 'PANTRY',
  'ketchup': 'PANTRY', 'mac and cheese': 'PANTRY', 'maple syrup': 'PANTRY',
  'marinara': 'PANTRY', 'mayonnaise': 'PANTRY', 'mayo': 'PANTRY', 'mustard': 'PANTRY',
  'oatmeal': 'PANTRY', 'oats': 'PANTRY', 'olive oil': 'PANTRY', 'oil': 'PANTRY',
  'pasta': 'PANTRY', 'pasta sauce': 'PANTRY', 'peanut butter': 'PANTRY',
  'pepper': 'PANTRY', 'pickles': 'PANTRY', 'ranch': 'PANTRY',
  'ranch dressing': 'PANTRY', 'red pepper flakes': 'PANTRY', 'rice': 'PANTRY',
  'salad dressing': 'PANTRY', 'salsa': 'PANTRY', 'salt': 'PANTRY',
  'soy sauce': 'PANTRY', 'spaghetti': 'PANTRY', 'spaghetti sauce': 'PANTRY',
  'spices': 'PANTRY', 'sugar': 'PANTRY', 'tomato paste': 'PANTRY',
  'tomato sauce': 'PANTRY', 'vanilla': 'PANTRY', 'vanilla extract': 'PANTRY',
  'vegetable oil': 'PANTRY', 'vinegar': 'PANTRY', 'worcestershire': 'PANTRY',
  'alfredo sauce': 'PANTRY', 'almond butter': 'PANTRY', 'apple cider vinegar': 'PANTRY',
  'balsamic': 'PANTRY', 'balsamic vinegar': 'PANTRY', 'brownie mix': 'PANTRY',
  'cake mix': 'PANTRY', 'canola oil': 'PANTRY', 'capers': 'PANTRY',
  'chicken stock': 'PANTRY', 'chili powder': 'PANTRY', 'cinnamon': 'PANTRY',
  'cocoa': 'PANTRY', 'coconut oil': 'PANTRY', 'condensed milk': 'PANTRY',
  'corn syrup': 'PANTRY', 'couscous': 'PANTRY', 'croutons': 'PANTRY',
  'cumin': 'PANTRY', 'curry paste': 'PANTRY', 'dijon mustard': 'PANTRY',
  'elbow macaroni': 'PANTRY', 'evaporated milk': 'PANTRY', 'garlic powder': 'PANTRY',
  'gelatin': 'PANTRY', 'gravy': 'PANTRY', 'hoisin sauce': 'PANTRY',
  'italian seasoning': 'PANTRY', 'lentils': 'PANTRY', 'molasses': 'PANTRY',
  'noodles': 'PANTRY', 'nutmeg': 'PANTRY', 'olives': 'PANTRY',
  'onion powder': 'PANTRY', 'oregano': 'PANTRY', 'oyster sauce': 'PANTRY',
  'panko': 'PANTRY', 'paprika': 'PANTRY', 'penne': 'PANTRY',
  'powdered sugar': 'PANTRY', 'quinoa': 'PANTRY', 'ramen': 'PANTRY',
  'refried beans': 'PANTRY', 'relish': 'PANTRY', 'sesame oil': 'PANTRY',
  'sriracha': 'PANTRY', 'steak sauce': 'PANTRY', 'stuffing': 'PANTRY',
  'taco seasoning': 'PANTRY', 'taco shells': 'PANTRY', 'tahini': 'PANTRY',
  'teriyaki sauce': 'PANTRY', 'turmeric': 'PANTRY', 'yeast': 'PANTRY',
  'pinto beans': 'PANTRY', 'kidney beans': 'PANTRY', 'chickpeas': 'PANTRY',
  'canned tuna': 'PANTRY', 'canned chicken': 'PANTRY', 'soup': 'PANTRY',
  'raisins': 'PANTRY', 'dried fruit': 'PANTRY', 'breadcrumbs': 'PANTRY',

  // BEVERAGES
  'beer': 'BEVERAGES', 'coffee': 'BEVERAGES', 'energy drinks': 'BEVERAGES',
  'gatorade': 'BEVERAGES', 'juice': 'BEVERAGES', 'kombucha': 'BEVERAGES',
  'lemonade': 'BEVERAGES', 'orange juice': 'BEVERAGES', 'seltzer': 'BEVERAGES',
  'soda': 'BEVERAGES', 'sparkling water': 'BEVERAGES', 'tea': 'BEVERAGES',
  'water': 'BEVERAGES', 'wine': 'BEVERAGES', 'apple juice': 'BEVERAGES',
  'champagne': 'BEVERAGES', 'cider': 'BEVERAGES', 'coconut water': 'BEVERAGES',
  'coke': 'BEVERAGES', 'cold brew': 'BEVERAGES', 'cranberry juice': 'BEVERAGES',
  'diet coke': 'BEVERAGES', 'dr pepper': 'BEVERAGES', 'espresso': 'BEVERAGES',
  'grape juice': 'BEVERAGES', 'green tea': 'BEVERAGES', 'iced tea': 'BEVERAGES',
  'la croix': 'BEVERAGES', 'lacroix': 'BEVERAGES', 'margarita mix': 'BEVERAGES',
  'mountain dew': 'BEVERAGES', 'pepsi': 'BEVERAGES', 'prosecco': 'BEVERAGES',
  'red bull': 'BEVERAGES', 'sprite': 'BEVERAGES', 'tonic water': 'BEVERAGES',
  'vodka': 'BEVERAGES', 'whiskey': 'BEVERAGES', 'tequila': 'BEVERAGES',
  'rum': 'BEVERAGES', 'gin': 'BEVERAGES', 'bourbon': 'BEVERAGES',

  // SNACKS
  'almonds': 'SNACKS', 'cashews': 'SNACKS', 'cheese crackers': 'SNACKS',
  'cheez its': 'SNACKS', 'chips': 'SNACKS', 'chocolate': 'SNACKS',
  'cookies': 'SNACKS', 'crackers': 'SNACKS', 'dark chocolate': 'SNACKS',
  'doritos': 'SNACKS', 'dried mango': 'SNACKS', 'fruit snacks': 'SNACKS',
  'goldfish': 'SNACKS', 'granola': 'SNACKS', 'granola bars': 'SNACKS',
  'gummy bears': 'SNACKS', 'hummus': 'SNACKS', 'mixed nuts': 'SNACKS',
  'nuts': 'SNACKS', 'peanuts': 'SNACKS', 'pecans': 'SNACKS', 'pistachios': 'SNACKS',
  'popcorn': 'SNACKS', 'potato chips': 'SNACKS', 'pretzels': 'SNACKS',
  'protein bars': 'SNACKS', 'rice cakes': 'SNACKS', 'salted nuts': 'SNACKS',
  'seeds': 'SNACKS', 'snack bars': 'SNACKS', 'tortilla chips': 'SNACKS',
  'trail mix': 'SNACKS', 'walnuts': 'SNACKS', 'candy': 'SNACKS',
  'beef jerky': 'SNACKS', 'brownie': 'SNACKS', 'brownies': 'SNACKS',
  'cheetos': 'SNACKS', 'chex mix': 'SNACKS', 'fritos': 'SNACKS',
  'gummies': 'SNACKS', 'lays': 'SNACKS', 'm&ms': 'SNACKS',
  'oreos': 'SNACKS', 'pringles': 'SNACKS', 'ritz': 'SNACKS',
  'snickers': 'SNACKS', 'sunflower seeds': 'SNACKS', 'tostitos': 'SNACKS',

  // HEALTH
  'advil': 'HEALTH', 'allergy medicine': 'HEALTH', 'aspirin': 'HEALTH',
  'band aids': 'HEALTH', 'bandages': 'HEALTH', 'body wash': 'HEALTH',
  'conditioner': 'HEALTH', 'contact solution': 'HEALTH', 'cotton balls': 'HEALTH',
  'cough drops': 'HEALTH', 'cough syrup': 'HEALTH', 'dayquil': 'HEALTH',
  'deodorant': 'HEALTH', 'face wash': 'HEALTH', 'first aid': 'HEALTH',
  'floss': 'HEALTH', 'ibuprofen': 'HEALTH', 'lip balm': 'HEALTH',
  'lotion': 'HEALTH', 'medicine': 'HEALTH', 'melatonin': 'HEALTH',
  'mouthwash': 'HEALTH', 'multivitamin': 'HEALTH', 'nyquil': 'HEALTH',
  'pain reliever': 'HEALTH', 'q tips': 'HEALTH', 'razors': 'HEALTH',
  'shampoo': 'HEALTH', 'shaving cream': 'HEALTH', 'soap': 'HEALTH',
  'sunscreen': 'HEALTH', 'tampons': 'HEALTH', 'tissues': 'HEALTH',
  'toothbrush': 'HEALTH', 'toothpaste': 'HEALTH', 'tylenol': 'HEALTH',
  'tums': 'HEALTH', 'vitamins': 'HEALTH', 'pepto bismol': 'HEALTH',
  'benadryl': 'HEALTH', 'chapstick': 'HEALTH', 'eye drops': 'HEALTH',
  'hand sanitizer': 'HEALTH', 'hydrogen peroxide': 'HEALTH',
  'neosporin': 'HEALTH', 'rubbing alcohol': 'HEALTH', 'thermometer': 'HEALTH',

  // HOUSEHOLD
  'aluminum foil': 'HOUSEHOLD', 'batteries': 'HOUSEHOLD', 'bleach': 'HOUSEHOLD',
  'broom': 'HOUSEHOLD', 'candles': 'HOUSEHOLD', 'cleaning spray': 'HOUSEHOLD',
  'clorox': 'HOUSEHOLD', 'clorox wipes': 'HOUSEHOLD', 'dish soap': 'HOUSEHOLD',
  'dishwasher pods': 'HOUSEHOLD', 'dryer sheets': 'HOUSEHOLD',
  'fabric softener': 'HOUSEHOLD', 'garbage bags': 'HOUSEHOLD',
  'glad bags': 'HOUSEHOLD', 'hand soap': 'HOUSEHOLD', 'kitchen towels': 'HOUSEHOLD',
  'laundry detergent': 'HOUSEHOLD', 'light bulbs': 'HOUSEHOLD',
  'lysol': 'HOUSEHOLD', 'napkins': 'HOUSEHOLD', 'paper plates': 'HOUSEHOLD',
  'paper towels': 'HOUSEHOLD', 'parchment paper': 'HOUSEHOLD',
  'plastic bags': 'HOUSEHOLD', 'plastic cups': 'HOUSEHOLD',
  'plastic wrap': 'HOUSEHOLD', 'sandwich bags': 'HOUSEHOLD',
  'saran wrap': 'HOUSEHOLD', 'sponges': 'HOUSEHOLD', 'sponge': 'HOUSEHOLD',
  'straw': 'HOUSEHOLD', 'straws': 'HOUSEHOLD', 'toilet paper': 'HOUSEHOLD',
  'tp': 'HOUSEHOLD', 'trash bags': 'HOUSEHOLD', 'windex': 'HOUSEHOLD',
  'wipes': 'HOUSEHOLD', 'ziploc bags': 'HOUSEHOLD', 'ziplock bags': 'HOUSEHOLD',
  'air freshener': 'HOUSEHOLD', 'baking sheet': 'HOUSEHOLD',
  'clothespins': 'HOUSEHOLD', 'detergent': 'HOUSEHOLD',
  'dishwasher detergent': 'HOUSEHOLD', 'duster': 'HOUSEHOLD',
  'freezer bags': 'HOUSEHOLD', 'gloves': 'HOUSEHOLD', 'lint roller': 'HOUSEHOLD',
  'mop': 'HOUSEHOLD', 'oven cleaner': 'HOUSEHOLD', 'pine sol': 'HOUSEHOLD',
  'pledge': 'HOUSEHOLD', 'steel wool': 'HOUSEHOLD', 'tide': 'HOUSEHOLD',
  'tide pods': 'HOUSEHOLD', 'tin foil': 'HOUSEHOLD',

  // OTHER
  'cat food': 'OTHER', 'cat litter': 'OTHER', 'dog food': 'OTHER',
  'dog treats': 'OTHER', 'pet food': 'OTHER', 'charcoal': 'OTHER',
  'diapers': 'OTHER', 'baby food': 'OTHER', 'baby wipes': 'OTHER',
  'formula': 'OTHER', 'flowers': 'OTHER', 'gift card': 'OTHER',
  'greeting card': 'OTHER', 'ice pack': 'OTHER', 'lighter': 'OTHER',
  'matches': 'OTHER', 'newspaper': 'OTHER', 'stamps': 'OTHER',
};

/** Look up an item name in the common items table. Returns category or null. */
function lookupCategory(name) {
  const key = name.toLowerCase().trim();
  if (COMMON_ITEMS[key]) return COMMON_ITEMS[key];
  // Try without trailing 's' for simple plurals
  if (key.endsWith('s') && COMMON_ITEMS[key.slice(0, -1)]) return COMMON_ITEMS[key.slice(0, -1)];
  return null;
}

function parseItem(summary) {
  const match = summary.match(/^\[([A-Z]+)\]\s*(.*)$/);
  if (match) {
    return { category: match[1], name: match[2] };
  }
  return { category: null, name: summary };
}

class GroupedShoppingListCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._config = {};
    this._hass = null;
    this._items = [];
    this._completedCollapsed = true;
    this._debounceTimer = null;
    this._lastEntityState = null;
    this._shellBuilt = false;
    this._initialFetchDone = false;
    this._inputFocused = false;
    this._pendingRender = false;
    this._sortBtn = null;
    this._autoSortBtn = null;
    this._isSorting = false;
    // Persistent DOM references
    this._countBadge = null;
    this._addInput = null;
    this._itemsContainer = null;
  }

  static getConfigElement() {
    return document.createElement('grouped-shopping-list-card-editor');
  }

  static getStubConfig() {
    return { entity: 'todo.shopping_list', title: 'Shopping List' };
  }

  setConfig(config) {
    if (!config.entity) {
      throw new Error('Please define an entity (e.g. todo.shopping_list)');
    }
    this._config = {
      title: 'Shopping List',
      sort_button_entity: 'input_button.sort_shopping_list_button',
      auto_sort_entity: 'input_boolean.auto_sort_shopping_list',
      category_order: [...CATEGORY_ORDER],
      ...config,
    };
    // Rebuild shell if config changes (e.g. title)
    this._shellBuilt = false;
    this._initialFetchDone = false;
  }

  _getCategoryOrder() {
    const order = this._config.category_order;
    if (Array.isArray(order) && order.length > 0) return order;
    return CATEGORY_ORDER;
  }

  set hass(hass) {
    this._hass = hass;

    const entityId = this._config.entity;
    if (!entityId) return;

    // Initial fetch on first hass set
    if (!this._initialFetchDone) {
      this._initialFetchDone = true;
      this._fetchItems();
      return;
    }

    // Only re-fetch when our entity's state actually changes
    const stateObj = hass.states[entityId];
    const newState = stateObj ? stateObj.last_changed : null;
    if (newState !== this._lastEntityState) {
      this._lastEntityState = newState;
      this._debouncedFetch();
    }

    // Track auto-sort toggle state
    const autoSortEntity = this._config.auto_sort_entity;
    if (autoSortEntity && hass.states[autoSortEntity]) {
      const aState = hass.states[autoSortEntity].state;
      if (this._autoSortBtn && this._autoSortBtn._lastState !== aState) {
        this._autoSortBtn._lastState = aState;
        this._autoSortBtn.classList.toggle('active', aState === 'on');
        this._autoSortBtn.title = aState === 'on' ? 'Auto-categorize: ON' : 'Auto-categorize: OFF';
      }
    }
  }

  _debouncedFetch() {
    clearTimeout(this._debounceTimer);
    this._debounceTimer = setTimeout(() => this._fetchItems(), 200);
  }

  async _fetchItems() {
    if (!this._hass || !this._config.entity) return;
    try {
      const result = await this._hass.callWS({
        type: 'todo/item/list',
        entity_id: this._config.entity,
      });
      this._items = result.items || [];
      this._renderItems();
    } catch (e) {
      console.error('grouped-shopping-list-card: Failed to fetch items', e);
    }
  }

  async _addItem(name) {
    if (!name.trim()) return;
    const trimmed = name.trim();
    try {
      await this._hass.callService('todo', 'add_item', { item: trimmed },
        { entity_id: this._config.entity });
      this._debouncedFetch();
    } catch (e) {
      console.error('grouped-shopping-list-card: Failed to add item', e);
      return;
    }

    // If auto-sort is ON and item isn't already categorized, categorize in background
    if (!parseItem(trimmed).category) {
      const autoSortEntity = this._config.auto_sort_entity;
      const isAutoSort = this._hass.states[autoSortEntity]?.state === 'on';
      if (isAutoSort) {
        this._categorizeInBackground(trimmed);
      }
    }
  }

  async _categorizeInBackground(itemName) {
    const addRow = this._addInput?.parentElement;

    // Try local lookup first — instant, no AI call needed
    const localCat = lookupCategory(itemName);
    if (localCat) {
      const properName = itemName.trim().replace(/^\w/, c => c.toUpperCase());
      const categorized = `[${localCat}] ${properName}`;
      try {
        await this._fetchItems();
        const target = this._items.find(i =>
          i.status !== 'completed' && i.summary.toLowerCase() === itemName.toLowerCase());
        if (target) {
          await this._hass.callService('todo', 'update_item',
            { item: target.uid, rename: categorized },
            { entity_id: this._config.entity });
          this._debouncedFetch();
        }
      } catch (e) {
        console.error('grouped-shopping-list-card: Local categorize failed', e);
      }
      return;
    }

    // Fall through to AI for unknown items
    addRow?.classList.add('categorizing');
    try {
      const response = await this._hass.callWS({
        type: 'call_service',
        domain: 'ai_task',
        service: 'generate_data',
        service_data: {
          task_name: 'categorize_item',
          instructions: `Categorize this shopping item into exactly one category.\nCategories: ${this._getCategoryOrder().join(', ')}\nItem: ${itemName}\nRespond with ONLY: [CATEGORY] Item Name\nExample: [DAIRY] Milk`,
        },
        return_response: true,
      });

      const text = response?.response?.data;
      const categorized = typeof text === 'string' ? text.trim().split('\n')[0]?.trim() : '';

      if (categorized && parseItem(categorized).category) {
        await this._fetchItems();
        const target = this._items.find(i =>
          i.status !== 'completed' && i.summary.toLowerCase() === itemName.toLowerCase());
        if (target) {
          await this._hass.callService('todo', 'update_item',
            { item: target.uid, rename: categorized },
            { entity_id: this._config.entity });
          this._debouncedFetch();
        }
      }
    } catch (e) {
      console.error('grouped-shopping-list-card: AI categorize failed (item added uncategorized)', e);
    } finally {
      addRow?.classList.remove('categorizing');
    }
  }

  async _triggerSort() {
    if (this._isSorting) return;
    this._isSorting = true;
    this._sortBtn.classList.add('sorting');
    try {
      await this._hass.callService('input_button', 'press', {},
        { entity_id: this._config.sort_button_entity });
      // Automation clears list and re-adds. Poll until items come back categorized.
      const start = Date.now();
      let sawEmpty = false;
      while (Date.now() - start < 15000) {
        await new Promise(r => setTimeout(r, 500));
        await this._fetchItems();
        const active = this._items.filter(i => i.status !== 'completed');
        if (active.length === 0) { sawEmpty = true; continue; }
        if (sawEmpty) { await new Promise(r => setTimeout(r, 500)); await this._fetchItems(); break; }
        if (active.every(i => parseItem(i.summary).category !== null)) break;
      }
    } catch (e) {
      console.error('grouped-shopping-list-card: Sort failed', e);
    } finally {
      this._isSorting = false;
      this._sortBtn.classList.remove('sorting');
    }
  }

  async _toggleAutoSort() {
    try {
      await this._hass.callService('input_boolean', 'toggle', {},
        { entity_id: this._config.auto_sort_entity });
    } catch (e) {
      console.error('grouped-shopping-list-card: Toggle auto-sort failed', e);
    }
  }

  async _categorizeUncategorized(btn) {
    if (btn.classList.contains('working')) return;
    btn.classList.add('working');
    try {
      const uncategorized = this._items.filter(i =>
        i.status !== 'completed' && parseItem(i.summary).category === null);
      if (!uncategorized.length) return;

      // First pass: categorize locally what we can
      const needsAI = [];
      for (const item of uncategorized) {
        const localCat = lookupCategory(item.summary);
        if (localCat) {
          const properName = item.summary.trim().replace(/^\w/, c => c.toUpperCase());
          await this._hass.callService('todo', 'update_item',
            { item: item.uid, rename: `[${localCat}] ${properName}` },
            { entity_id: this._config.entity });
        } else {
          needsAI.push(item);
        }
      }

      // Second pass: send remaining unknowns to AI (if any)
      if (needsAI.length > 0) {
        const names = needsAI.map(i => i.summary);
        const response = await this._hass.callWS({
          type: 'call_service',
          domain: 'ai_task',
          service: 'generate_data',
          service_data: {
            task_name: 'categorize_items',
            instructions: `Categorize these shopping items.\nCategories: ${this._getCategoryOrder().join(', ')}\n\nItems:\n${names.map((n, i) => `${i + 1}. ${n}`).join('\n')}\n\nRespond with ONLY the categorized items, one per line:\n[CATEGORY] Item Name`,
          },
          return_response: true,
        });

        const text = response?.response?.data;
        const lines = typeof text === 'string' ? text.trim().split('\n').filter(l => l.trim()) : [];

        for (let i = 0; i < Math.min(lines.length, needsAI.length); i++) {
          const categorized = lines[i].trim();
          if (parseItem(categorized).category) {
            await this._hass.callService('todo', 'update_item',
              { item: needsAI[i].uid, rename: categorized },
              { entity_id: this._config.entity });
          }
        }
      }
      this._debouncedFetch();
    } catch (e) {
      console.error('grouped-shopping-list-card: Categorize uncategorized failed', e);
    } finally {
      btn.classList.remove('working');
    }
  }

  async _toggleItem(uid, currentStatus) {
    const newStatus = currentStatus === 'completed' ? 'needs_action' : 'completed';
    try {
      await this._hass.callService('todo', 'update_item',
        { item: uid, status: newStatus },
        { entity_id: this._config.entity }
      );
      this._debouncedFetch();
    } catch (e) {
      console.error('grouped-shopping-list-card: Failed to toggle item', e);
    }
  }

  async _deleteItem(uid) {
    try {
      await this._hass.callService('todo', 'remove_item',
        { item: [uid] },
        { entity_id: this._config.entity }
      );
      this._debouncedFetch();
    } catch (e) {
      console.error('grouped-shopping-list-card: Failed to delete item', e);
    }
  }

  async _clearCompleted() {
    const completedUids = this._items
      .filter(i => i.status === 'completed')
      .map(i => i.uid);
    if (!completedUids.length) return;
    try {
      await this._hass.callService('todo', 'remove_item',
        { item: completedUids },
        { entity_id: this._config.entity }
      );
      this._debouncedFetch();
    } catch (e) {
      console.error('grouped-shopping-list-card: Failed to clear completed items', e);
    }
  }

  /**
   * Build the static shell once: styles, ha-card, header, input, items container.
   * This is only called once (or when config changes). The input element persists
   * across item updates so the keyboard never gets yanked away.
   */
  _buildShell() {
    const shadow = this.shadowRoot;
    shadow.innerHTML = '';

    const style = document.createElement('style');
    style.textContent = `
      :host {
        --card-padding: 16px;
      }
      ha-card {
        padding: 0;
        overflow: hidden;
      }
      .card-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 16px 16px 8px;
        font-size: 18px;
        font-weight: 500;
        color: var(--primary-text-color);
      }
      .card-header .count {
        font-size: 14px;
        color: var(--secondary-text-color);
        font-weight: 400;
        background: var(--divider-color, rgba(0,0,0,0.12));
        border-radius: 12px;
        padding: 2px 10px;
        min-width: 20px;
        text-align: center;
      }
      .add-item-row {
        padding: 4px 16px 12px;
      }
      .add-item-row ha-textfield {
        display: block;
        width: 100%;
        --mdc-text-field-fill-color: var(--input-fill-color, var(--secondary-background-color, rgba(0,0,0,0.04)));
        --mdc-text-field-idle-line-color: var(--divider-color, rgba(0,0,0,0.12));
        --mdc-text-field-hover-line-color: var(--primary-color);
        --mdc-text-field-ink-color: var(--primary-text-color);
        --mdc-text-field-label-ink-color: var(--secondary-text-color);
        --mdc-shape-small: 10px;
        --mdc-typography-subtitle1-font-size: 14px;
        --mdc-typography-subtitle1-font-family: inherit;
      }
      .category-header {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 12px 16px 4px;
        font-size: 12px;
        font-weight: 600;
        letter-spacing: 0.08em;
        color: var(--secondary-text-color);
        text-transform: uppercase;
      }
      .category-header .line {
        flex: 1;
        height: 1px;
        background: var(--divider-color, rgba(0,0,0,0.12));
      }
      @keyframes fadeSlideIn {
        from { opacity: 0; transform: translateY(-8px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      @keyframes fadeSlideOut {
        from { opacity: 1; max-height: 50px; }
        to   { opacity: 0; max-height: 0; padding-top: 0; padding-bottom: 0; }
      }
      .item-row {
        display: flex;
        align-items: center;
        padding: 6px 8px 6px 16px;
        gap: 8px;
        transition: background-color 0.15s;
        animation: fadeSlideIn 0.25s ease-out;
      }
      .item-row.removing {
        animation: fadeSlideOut 0.25s ease-in forwards;
        pointer-events: none;
        overflow: hidden;
      }
      .item-row:hover {
        background: var(--secondary-background-color, rgba(0,0,0,0.04));
      }
      .item-row .checkbox {
        flex-shrink: 0;
        width: 20px;
        height: 20px;
        border: 2px solid var(--divider-color, rgba(0,0,0,0.25));
        border-radius: 4px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.15s;
        background: transparent;
        padding: 0;
        color: transparent;
      }
      .item-row .checkbox:hover {
        border-color: var(--primary-color);
      }
      .item-row .checkbox.checked {
        background: var(--primary-color);
        border-color: var(--primary-color);
        color: var(--text-primary-color, #fff);
      }
      .item-row .checkbox svg {
        width: 14px;
        height: 14px;
        fill: currentColor;
      }
      .item-row .name {
        flex: 1;
        font-size: 14px;
        color: var(--primary-text-color);
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .item-row .name.completed {
        text-decoration: line-through;
        color: var(--secondary-text-color);
        opacity: 0.7;
      }
      .item-row .delete-btn {
        flex-shrink: 0;
        width: 32px;
        height: 32px;
        border: none;
        background: transparent;
        cursor: pointer;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        transition: opacity 0.15s, background-color 0.15s;
        color: var(--secondary-text-color);
        padding: 0;
      }
      .item-row:hover .delete-btn {
        opacity: 0.7;
      }
      .item-row .delete-btn:hover {
        opacity: 1;
        background: var(--divider-color, rgba(0,0,0,0.08));
        color: var(--error-color, #db4437);
      }
      .item-row .delete-btn svg {
        width: 18px;
        height: 18px;
        fill: currentColor;
      }
      .completed-header {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 16px 16px 4px;
        cursor: pointer;
        user-select: none;
        font-size: 12px;
        font-weight: 600;
        letter-spacing: 0.08em;
        color: var(--secondary-text-color);
        text-transform: uppercase;
      }
      .completed-header .line {
        flex: 1;
        height: 1px;
        background: var(--divider-color, rgba(0,0,0,0.12));
      }
      .completed-header .chevron {
        transition: transform 0.2s;
        display: flex;
      }
      .completed-header .chevron.collapsed {
        transform: rotate(-90deg);
      }
      .completed-header .chevron svg {
        width: 18px;
        height: 18px;
        fill: var(--secondary-text-color);
      }
      .completed-section {
        overflow: hidden;
        transition: max-height 0.3s ease;
      }
      .completed-section.collapsed {
        max-height: 0 !important;
      }
      .bottom-pad {
        height: 8px;
      }
      .empty-state {
        padding: 24px 16px;
        text-align: center;
        color: var(--secondary-text-color);
        font-size: 14px;
      }
      @media (hover: none) {
        .item-row .delete-btn {
          opacity: 0.5;
        }
      }
      /* Header action buttons */
      .header-actions {
        display: flex;
        align-items: center;
        gap: 4px;
      }
      .header-btn {
        width: 32px;
        height: 32px;
        border: none;
        background: transparent;
        cursor: pointer;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--secondary-text-color);
        padding: 0;
        transition: background-color 0.15s, color 0.15s;
        opacity: 0.5;
      }
      .header-btn:hover {
        background: var(--divider-color, rgba(0,0,0,0.08));
        color: var(--primary-color);
        opacity: 1;
      }
      .header-btn.active {
        color: var(--primary-color);
        opacity: 1;
      }
      .header-btn svg {
        width: 20px;
        height: 20px;
        fill: currentColor;
      }
      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      .header-btn.sorting svg {
        animation: spin 1s linear infinite;
      }
      /* Categorize button on uncategorized header */
      .category-header .categorize-btn {
        width: 24px;
        height: 24px;
        border: none;
        background: transparent;
        cursor: pointer;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--secondary-text-color);
        padding: 0;
        opacity: 0.5;
        transition: opacity 0.15s, color 0.15s, background-color 0.15s;
      }
      .category-header .categorize-btn:hover {
        opacity: 1;
        color: var(--primary-color);
        background: var(--divider-color, rgba(0,0,0,0.08));
      }
      .category-header .categorize-btn.working svg {
        animation: spin 1s linear infinite;
      }
      .category-header .categorize-btn svg {
        width: 16px;
        height: 16px;
        fill: currentColor;
      }
      .completed-header .clear-completed-btn {
        width: 24px;
        height: 24px;
        border: none;
        background: transparent;
        cursor: pointer;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--secondary-text-color);
        padding: 0;
        opacity: 0.5;
        transition: opacity 0.15s, color 0.15s, background-color 0.15s;
      }
      .completed-header .clear-completed-btn:hover {
        opacity: 1;
        color: var(--error-color, #db4437);
        background: var(--divider-color, rgba(0,0,0,0.08));
      }
      .completed-header .clear-completed-btn svg {
        width: 16px;
        height: 16px;
        fill: currentColor;
      }
      /* Categorizing indicator under input */
      .add-item-row .categorizing-indicator {
        display: none;
        font-size: 11px;
        color: var(--secondary-text-color);
        padding: 2px 0 0 4px;
        font-style: italic;
      }
      .add-item-row.categorizing .categorizing-indicator {
        display: block;
      }
    `;
    shadow.appendChild(style);

    const card = document.createElement('ha-card');

    // Header
    const header = document.createElement('div');
    header.className = 'card-header';
    const titleSpan = document.createElement('span');
    titleSpan.textContent = this._config.title || 'Shopping List';
    header.appendChild(titleSpan);

    const actions = document.createElement('div');
    actions.className = 'header-actions';

    // Sort button (Feature 1)
    this._sortBtn = document.createElement('button');
    this._sortBtn.className = 'header-btn';
    this._sortBtn.title = 'Sort & categorize all items';
    this._sortBtn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M3 18h6v-2H3v2zM3 6v2h18V6H3zm0 7h12v-2H3v2z"/></svg>';
    this._sortBtn.addEventListener('click', (e) => { e.stopPropagation(); this._triggerSort(); });
    actions.appendChild(this._sortBtn);

    // Auto-sort toggle (Feature 4)
    this._autoSortBtn = document.createElement('button');
    this._autoSortBtn.className = 'header-btn';
    this._autoSortBtn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M19.89 10.75c.07.41.11.82.11 1.25 0 4.41-3.59 8-8 8s-8-3.59-8-8 3.59-8 8-8c1.62 0 3.13.49 4.39 1.32l-1.68 1.68A5.945 5.945 0 0 0 12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6c0-.34-.04-.67-.09-1h2.02zM19 2h2v3h3v2h-3v3h-2V7h-3V5h3V2z"/></svg>';
    const autoSortEntity = this._config.auto_sort_entity;
    if (this._hass && this._hass.states[autoSortEntity]) {
      const isOn = this._hass.states[autoSortEntity].state === 'on';
      this._autoSortBtn.classList.toggle('active', isOn);
      this._autoSortBtn._lastState = this._hass.states[autoSortEntity].state;
      this._autoSortBtn.title = isOn ? 'Auto-categorize: ON' : 'Auto-categorize: OFF';
    } else {
      this._autoSortBtn.title = 'Auto-categorize';
    }
    this._autoSortBtn.addEventListener('click', (e) => { e.stopPropagation(); this._toggleAutoSort(); });
    actions.appendChild(this._autoSortBtn);

    this._countBadge = document.createElement('span');
    this._countBadge.className = 'count';
    this._countBadge.textContent = '0';
    actions.appendChild(this._countBadge);
    header.appendChild(actions);
    card.appendChild(header);

    // Add item input — persists across renders, never destroyed
    const addRow = document.createElement('div');
    addRow.className = 'add-item-row';

    // Prevent HA card action system from intercepting touch/click on input area
    addRow.addEventListener('touchstart', (e) => { e.stopPropagation(); }, { passive: true });
    addRow.addEventListener('mousedown', (e) => { e.stopPropagation(); });
    addRow.addEventListener('click', (e) => { e.stopPropagation(); });
    addRow.addEventListener('pointerdown', (e) => { e.stopPropagation(); });

    this._addInput = document.createElement('ha-textfield');
    this._addInput.placeholder = '+ Add an item...';

    this._addInput.addEventListener('focus', () => { this._inputFocused = true; });
    this._addInput.addEventListener('blur', () => {
      this._inputFocused = false;
      if (this._pendingRender) {
        this._pendingRender = false;
        this._renderItems();
      }
    });

    this._addInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const val = this._addInput.value;
        this._addItem(val);
        this._addInput.value = '';
        this._addInput.focus();
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        this._addInput.value = '';
        this._addInput.blur();
      }
    });
    addRow.appendChild(this._addInput);
    const catIndicator = document.createElement('div');
    catIndicator.className = 'categorizing-indicator';
    catIndicator.textContent = 'Categorizing...';
    addRow.appendChild(catIndicator);
    card.appendChild(addRow);

    // Items container — diffed on updates, never torn down
    this._itemsContainer = document.createElement('div');
    card.appendChild(this._itemsContainer);

    shadow.appendChild(card);
    this._shellBuilt = true;
  }

  /**
   * Diff-update the items container. Only adds/removes/reorders the DOM nodes
   * that actually changed, so the input and its keyboard state are untouched.
   */
  _renderItems() {
    if (!this._shellBuilt) {
      this._buildShell();
    }

    if (this._inputFocused) {
      this._pendingRender = true;
      return;
    }

    const active = [];
    const completed = [];

    for (const item of this._items) {
      if (item.status === 'completed') {
        completed.push(item);
      } else {
        active.push(item);
      }
    }

    // Update count badge (outside items container — always safe)
    this._countBadge.textContent = active.length;

    // Group active items by category
    const groups = {};
    const uncategorized = [];
    for (const item of active) {
      const parsed = parseItem(item.summary);
      if (parsed.category) {
        if (!groups[parsed.category]) groups[parsed.category] = [];
        groups[parsed.category].push({ ...item, displayName: parsed.name });
      } else {
        uncategorized.push({ ...item, displayName: parsed.name });
      }
    }

    // Build ordered category list
    const orderedCategories = [];
    for (const cat of this._getCategoryOrder()) {
      if (groups[cat]) orderedCategories.push(cat);
    }
    for (const cat of Object.keys(groups)) {
      if (!this._getCategoryOrder().includes(cat)) orderedCategories.push(cat);
    }

    // Build desired element descriptors (keyed for diffing)
    const desired = [];

    if (active.length === 0 && completed.length === 0) {
      desired.push({ key: 'empty', type: 'empty' });
    }

    // Uncategorized first
    if (uncategorized.length > 0) {
      desired.push({ key: 'cat:UNCATEGORIZED', type: 'category', emoji: UNCATEGORIZED_EMOJI, label: UNCATEGORIZED_LABEL, showCategorizeBtn: true });
      for (const item of uncategorized) {
        desired.push({ key: `item:${item.uid}`, type: 'item', item, completed: false });
      }
    }

    // Categorized groups
    for (const cat of orderedCategories) {
      const emoji = CATEGORY_EMOJI[cat] || '📦';
      desired.push({ key: `cat:${cat}`, type: 'category', emoji, label: cat });
      for (const item of groups[cat]) {
        desired.push({ key: `item:${item.uid}`, type: 'item', item, completed: false });
      }
    }

    // Completed section
    if (completed.length > 0) {
      desired.push({ key: 'completed-header', type: 'completed-header', count: completed.length });
      desired.push({ key: 'completed-section', type: 'completed-section', items: completed });
    }

    // Bottom padding
    desired.push({ key: 'bottom-pad', type: 'bottom-pad' });

    this._diffChildren(this._itemsContainer, desired);
  }

  /**
   * Diff a container's children against a desired list of descriptors.
   * Reuses existing nodes by data-key, only adding/removing/reordering what changed.
   */
  _diffChildren(container, desired) {
    // Index existing children by data-key
    const existingByKey = new Map();
    for (const child of Array.from(container.children)) {
      const key = child.dataset.key;
      if (key) existingByKey.set(key, child);
    }

    const desiredKeys = new Set(desired.map(d => d.key));

    // Remove children no longer in the desired list
    for (const [key, child] of existingByKey) {
      if (!desiredKeys.has(key)) {
        if (child.classList?.contains('item-row')) {
          child.classList.add('removing');
          child.dataset.key = ''; // Unkey so future diffs ignore it
          child.addEventListener('animationend', () => child.remove(), { once: true });
          setTimeout(() => { if (child.parentNode) child.remove(); }, 300); // safety fallback
        } else {
          child.remove();
        }
        existingByKey.delete(key);
      }
    }

    // Walk desired list: reuse or create each node, ensure correct position
    for (let i = 0; i < desired.length; i++) {
      const desc = desired[i];
      let node = existingByKey.get(desc.key);
      if (node) {
        this._updateNode(node, desc);
      } else {
        node = this._createNode(desc);
      }
      // Ensure node is at position i
      const current = container.children[i];
      if (current !== node) {
        container.insertBefore(node, current || null);
      }
    }
  }

  /** Create a new DOM node from a descriptor. */
  _createNode(desc) {
    let node;
    switch (desc.type) {
      case 'empty':
        node = document.createElement('div');
        node.className = 'empty-state';
        node.textContent = 'Your shopping list is empty';
        break;
      case 'category':
        node = this._createCategoryHeader(desc.emoji, desc.label, desc.showCategorizeBtn);
        break;
      case 'item':
        node = this._createItemRow(desc.item, desc.completed);
        break;
      case 'completed-header':
        node = this._createCompletedHeader(desc.count);
        break;
      case 'completed-section':
        node = this._createCompletedSection(desc.items);
        break;
      case 'bottom-pad':
        node = document.createElement('div');
        node.className = 'bottom-pad';
        break;
    }
    node.dataset.key = desc.key;
    return node;
  }

  /** Patch an existing DOM node to match an updated descriptor. */
  _updateNode(node, desc) {
    switch (desc.type) {
      case 'item':
        this._updateItemRow(node, desc.item, desc.completed);
        break;
      case 'completed-header':
        this._updateCompletedHeader(node, desc.count);
        break;
      case 'completed-section':
        this._updateCompletedSection(node, desc.items);
        break;
      // category, empty, bottom-pad are static — no update needed
    }
  }

  _createCategoryHeader(emoji, label, showCategorizeBtn = false) {
    const div = document.createElement('div');
    div.className = 'category-header';
    const emojiSpan = document.createElement('span');
    emojiSpan.textContent = emoji;
    div.appendChild(emojiSpan);
    const labelSpan = document.createElement('span');
    labelSpan.textContent = label;
    div.appendChild(labelSpan);
    if (showCategorizeBtn) {
      const btn = document.createElement('button');
      btn.className = 'categorize-btn';
      btn.title = 'Categorize with AI';
      btn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M7.5 5.6L10 7 8.6 4.5 10 2 7.5 3.4 5 2l1.4 2.5L5 7zm12 9.8L17 14l1.4 2.5L17 19l2.5-1.4L22 19l-1.4-2.5L22 14zM22 2l-2.5 1.4L17 2l1.4 2.5L17 7l2.5-1.4L22 7l-1.4-2.5zm-7.63 5.29a.996.996 0 0 0-1.41 0L1.29 18.96a.996.996 0 0 0 0 1.41l2.34 2.34c.39.39 1.02.39 1.41 0L16.7 11.05a.996.996 0 0 0 0-1.41l-2.33-2.35z"/></svg>';
      btn.addEventListener('click', (e) => { e.stopPropagation(); this._categorizeUncategorized(btn); });
      div.appendChild(btn);
    }
    const line = document.createElement('span');
    line.className = 'line';
    div.appendChild(line);
    return div;
  }

  _createItemRow(item, isCompleted) {
    const row = document.createElement('div');
    row.className = 'item-row';
    // Store item data on the element so event handlers always read current values
    row._itemUid = item.uid;
    row._itemStatus = item.status;

    const checkbox = document.createElement('button');
    checkbox.className = 'checkbox' + (isCompleted ? ' checked' : '');
    checkbox.innerHTML = '<svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>';
    checkbox.addEventListener('click', () => this._toggleItem(row._itemUid, row._itemStatus));
    row.appendChild(checkbox);

    const name = document.createElement('span');
    name.className = 'name' + (isCompleted ? ' completed' : '');
    name.textContent = item.displayName;
    row.appendChild(name);

    const delBtn = document.createElement('button');
    delBtn.className = 'delete-btn';
    delBtn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>';
    delBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this._deleteItem(row._itemUid);
    });
    row.appendChild(delBtn);

    return row;
  }

  /** Patch an existing item row's text, checkbox, and stored data without recreating it. */
  _updateItemRow(row, item, isCompleted) {
    row._itemUid = item.uid;
    row._itemStatus = item.status;

    const checkbox = row.querySelector('.checkbox');
    if (checkbox) checkbox.classList.toggle('checked', isCompleted);

    const name = row.querySelector('.name');
    if (name) {
      name.textContent = item.displayName;
      name.classList.toggle('completed', isCompleted);
    }
  }

  _createCompletedHeader(count) {
    const header = document.createElement('div');
    header.className = 'completed-header';

    const leftLine = document.createElement('span');
    leftLine.className = 'line';
    header.appendChild(leftLine);

    const label = document.createElement('span');
    label.className = 'comp-label';
    label.textContent = `Completed (${count})`;
    header.appendChild(label);

    const rightLine = document.createElement('span');
    rightLine.className = 'line';
    header.appendChild(rightLine);

    const clearBtn = document.createElement('button');
    clearBtn.className = 'clear-completed-btn';
    clearBtn.title = 'Clear all completed items';
    clearBtn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>';
    clearBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this._clearCompleted();
    });
    header.appendChild(clearBtn);

    const chevron = document.createElement('span');
    chevron.className = 'chevron' + (this._completedCollapsed ? ' collapsed' : '');
    chevron.innerHTML = '<svg viewBox="0 0 24 24"><path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6z"/></svg>';
    header.appendChild(chevron);

    // Click handler looks up section dynamically so it works even if the
    // section DOM node was removed and recreated between renders.
    header.addEventListener('click', () => {
      this._completedCollapsed = !this._completedCollapsed;
      const chev = header.querySelector('.chevron');
      const section = this._itemsContainer.querySelector('[data-key="completed-section"]');
      if (chev) chev.classList.toggle('collapsed', this._completedCollapsed);
      if (section) {
        section.classList.toggle('collapsed', this._completedCollapsed);
        if (!this._completedCollapsed) {
          section.style.maxHeight = (section.children.length * 44 + 20) + 'px';
        }
      }
    });

    return header;
  }

  _updateCompletedHeader(node, count) {
    const label = node.querySelector('.comp-label');
    if (label) label.textContent = `Completed (${count})`;
    const chevron = node.querySelector('.chevron');
    if (chevron) chevron.classList.toggle('collapsed', this._completedCollapsed);
  }

  _createCompletedSection(items) {
    const section = document.createElement('div');
    section.className = 'completed-section' + (this._completedCollapsed ? ' collapsed' : '');

    for (const item of items) {
      const parsed = parseItem(item.summary);
      const row = this._createItemRow({ ...item, displayName: parsed.name }, true);
      row.dataset.key = `item:${item.uid}`;
      section.appendChild(row);
    }

    if (!this._completedCollapsed) {
      section.style.maxHeight = (items.length * 44 + 20) + 'px';
    }

    return section;
  }

  _updateCompletedSection(node, items) {
    // Diff completed item rows within the section
    const desired = items.map(item => {
      const parsed = parseItem(item.summary);
      return {
        key: `item:${item.uid}`,
        type: 'item',
        item: { ...item, displayName: parsed.name },
        completed: true,
      };
    });

    this._diffChildren(node, desired);

    // Update collapse state and max-height
    node.classList.toggle('collapsed', this._completedCollapsed);
    if (!this._completedCollapsed) {
      node.style.maxHeight = (items.length * 44 + 20) + 'px';
    }
  }

  disconnectedCallback() {
    clearTimeout(this._debounceTimer);
  }

  getCardSize() {
    return 3;
  }
}

class GroupedShoppingListCardEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._config = {};
  }

  setConfig(config) {
    this._config = config;
    this._render();
  }

  _render() {
    this.shadowRoot.innerHTML = `
      <style>
        .editor {
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        label {
          display: block;
          font-size: 12px;
          font-weight: 500;
          color: var(--secondary-text-color);
          margin-bottom: 4px;
        }
        input {
          width: 100%;
          box-sizing: border-box;
          padding: 8px 12px;
          border: 1px solid var(--divider-color, rgba(0,0,0,0.12));
          border-radius: 8px;
          background: var(--input-fill-color, var(--secondary-background-color));
          color: var(--primary-text-color);
          font-size: 14px;
          font-family: inherit;
        }
        .cat-order-list { list-style: none; padding: 0; margin: 4px 0 0; }
        .cat-order-item {
          display: flex; align-items: center; gap: 8px;
          padding: 4px 8px; border-radius: 6px;
          font-size: 13px; color: var(--primary-text-color);
        }
        .cat-order-item:hover { background: var(--divider-color, rgba(0,0,0,0.04)); }
        .cat-order-item .emoji { width: 20px; text-align: center; }
        .cat-order-item .label { flex: 1; }
        .cat-order-btn {
          width: 24px; height: 24px; border: none; background: transparent;
          cursor: pointer; border-radius: 50%; display: flex;
          align-items: center; justify-content: center;
          color: var(--secondary-text-color); padding: 0;
        }
        .cat-order-btn:hover { background: var(--divider-color, rgba(0,0,0,0.08)); color: var(--primary-color); }
        .cat-order-btn:disabled { opacity: 0.2; cursor: default; }
        .cat-order-btn:disabled:hover { background: transparent; color: var(--secondary-text-color); }
        .cat-order-btn svg { width: 16px; height: 16px; fill: currentColor; }
        .cat-order-reset {
          font-size: 12px; color: var(--primary-color); background: none;
          border: none; cursor: pointer; padding: 4px 0; margin-top: 4px;
        }
        .cat-order-reset:hover { text-decoration: underline; }
      </style>
      <div class="editor">
        <div>
          <label>Entity</label>
          <input id="entity" value="${this._config.entity || ''}">
        </div>
        <div>
          <label>Title (optional)</label>
          <input id="title" value="${this._config.title || ''}" placeholder="Shopping List">
        </div>
        <div>
          <label>Sort Button Entity (optional)</label>
          <input id="sort_button_entity" value="${this._config.sort_button_entity || ''}" placeholder="input_button.sort_shopping_list_button">
        </div>
        <div>
          <label>Auto-Sort Toggle Entity (optional)</label>
          <input id="auto_sort_entity" value="${this._config.auto_sort_entity || ''}" placeholder="input_boolean.auto_sort_shopping_list">
        </div>
        <div id="cat-order-container">
          <label>Category Order</label>
        </div>
      </div>
    `;

    this.shadowRoot.getElementById('entity').addEventListener('input', (e) => {
      this._config = { ...this._config, entity: e.target.value };
      this._fireChanged();
    });
    this.shadowRoot.getElementById('title').addEventListener('input', (e) => {
      this._config = { ...this._config, title: e.target.value };
      this._fireChanged();
    });
    this.shadowRoot.getElementById('sort_button_entity').addEventListener('input', (e) => {
      this._config = { ...this._config, sort_button_entity: e.target.value };
      this._fireChanged();
    });
    this.shadowRoot.getElementById('auto_sort_entity').addEventListener('input', (e) => {
      this._config = { ...this._config, auto_sort_entity: e.target.value };
      this._fireChanged();
    });

    this._renderCategoryOrder();
  }

  _renderCategoryOrder() {
    const container = this.shadowRoot.getElementById('cat-order-container');
    if (!container) return;

    // Remove old list and reset button if present
    const oldList = container.querySelector('.cat-order-list');
    if (oldList) oldList.remove();
    const oldReset = container.querySelector('.cat-order-reset');
    if (oldReset) oldReset.remove();

    const order = Array.isArray(this._config.category_order) && this._config.category_order.length > 0
      ? this._config.category_order
      : [...CATEGORY_ORDER];

    const ul = document.createElement('ul');
    ul.className = 'cat-order-list';

    order.forEach((cat, idx) => {
      const li = document.createElement('li');
      li.className = 'cat-order-item';

      const emojiSpan = document.createElement('span');
      emojiSpan.className = 'emoji';
      emojiSpan.textContent = CATEGORY_EMOJI[cat] || '📦';
      li.appendChild(emojiSpan);

      const labelSpan = document.createElement('span');
      labelSpan.className = 'label';
      labelSpan.textContent = cat;
      li.appendChild(labelSpan);

      // Up button
      const upBtn = document.createElement('button');
      upBtn.className = 'cat-order-btn';
      upBtn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z"/></svg>';
      upBtn.disabled = idx === 0;
      upBtn.addEventListener('click', () => {
        const newOrder = [...order];
        [newOrder[idx - 1], newOrder[idx]] = [newOrder[idx], newOrder[idx - 1]];
        this._config = { ...this._config, category_order: newOrder };
        this._fireChanged();
        this._renderCategoryOrder();
      });
      li.appendChild(upBtn);

      // Down button
      const downBtn = document.createElement('button');
      downBtn.className = 'cat-order-btn';
      downBtn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6z"/></svg>';
      downBtn.disabled = idx === order.length - 1;
      downBtn.addEventListener('click', () => {
        const newOrder = [...order];
        [newOrder[idx], newOrder[idx + 1]] = [newOrder[idx + 1], newOrder[idx]];
        this._config = { ...this._config, category_order: newOrder };
        this._fireChanged();
        this._renderCategoryOrder();
      });
      li.appendChild(downBtn);

      ul.appendChild(li);
    });

    container.appendChild(ul);

    // Reset button
    const resetBtn = document.createElement('button');
    resetBtn.className = 'cat-order-reset';
    resetBtn.textContent = 'Reset to default';
    resetBtn.addEventListener('click', () => {
      this._config = { ...this._config, category_order: [...CATEGORY_ORDER] };
      this._fireChanged();
      this._renderCategoryOrder();
    });
    container.appendChild(resetBtn);
  }

  _fireChanged() {
    this.dispatchEvent(new CustomEvent('config-changed', {
      detail: { config: this._config },
      bubbles: true,
      composed: true,
    }));
  }
}

customElements.define('grouped-shopping-list-card', GroupedShoppingListCard);
customElements.define('grouped-shopping-list-card-editor', GroupedShoppingListCardEditor);

window.customCards = window.customCards || [];
window.customCards.push({
  type: 'grouped-shopping-list-card',
  name: 'Grouped Shopping List',
  description: 'Shopping list grouped by [CATEGORY] bracket prefixes with emoji headers.',
  preview: true,
});
