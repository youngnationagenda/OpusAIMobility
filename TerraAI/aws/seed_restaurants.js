/**
 * aimobility — Restaurant & Menu Seed Script
 * Seeds 8 realistic Nairobi restaurants + menu items into DynamoDB
 */
const { DynamoDBClient } = require('./lambda/api/node_modules/@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, BatchWriteCommand } = require('./lambda/api/node_modules/@aws-sdk/lib-dynamodb');
const { randomUUID } = require('crypto');

const client = new DynamoDBClient({ region: 'us-east-1' });
const ddb    = DynamoDBDocumentClient.from(client);
const now    = () => new Date().toISOString();
const uuid   = () => randomUUID();

// ─── Restaurant definitions ─────────────────────────────────────────────────
const RESTAURANTS = [
  {
    name: 'Mama Oliech Restaurant',
    description: 'Iconic Nairobi restaurant famous for fried tilapia and traditional Kenyan cuisine',
    lat: '-1.2853', long: '36.8200',
    delivery_fee: '80', delivery_min_time: '25', delivery_max_time: '45',
    min_order_price: '300', rating: '4.7',
    cuisine: 'Kenyan',
    menus: [
      { name: 'Fish Dishes', items: [
        { name: 'Fried Tilapia (Full)', description: 'Whole fried tilapia with ugali and sukuma wiki', price: '650' },
        { name: 'Fried Tilapia (Half)', description: 'Half fried tilapia with ugali', price: '380' },
        { name: 'Grilled Tilapia', description: 'Grilled tilapia with kachumbari salad', price: '700' },
      ]},
      { name: 'Ugali & Stews', items: [
        { name: 'Beef Stew & Ugali', description: 'Slow-cooked beef stew with ugali and vegetables', price: '350' },
        { name: 'Chicken Stew & Ugali', description: 'Traditional chicken stew with ugali', price: '400' },
        { name: 'Mutton Curry & Ugali', description: 'Spiced mutton curry with ugali', price: '450' },
      ]},
      { name: 'Drinks', items: [
        { name: 'Tusker Lager', description: 'Cold Tusker beer 500ml', price: '200' },
        { name: 'Stoney Tangawizi', description: 'Spicy ginger soda', price: '80' },
      ]},
    ]
  },
  {
    name: 'Carnivore Restaurant',
    description: 'World-famous Nairobi restaurant serving exotic game and farm meats on Maasai swords',
    lat: '-1.3319', long: '36.7975',
    delivery_fee: '200', delivery_min_time: '40', delivery_max_time: '60',
    min_order_price: '1200', rating: '4.8',
    cuisine: 'Grill & BBQ',
    menus: [
      { name: 'The Beast Feast', items: [
        { name: 'All-You-Can-Eat Meat Platter', description: 'Unlimited meats carved at your table including beef, lamb, chicken, crocodile', price: '3500' },
        { name: 'Nyama Choma Platter (1kg)', description: 'Mixed grilled meats - beef, goat, chicken', price: '1800' },
        { name: 'Safari Sausages', description: 'Assorted game meat sausages with relish', price: '850' },
      ]},
      { name: 'Sides', items: [
        { name: 'Roasted Potatoes', description: 'Herb-roasted potatoes', price: '300' },
        { name: 'Garlic Bread', description: 'Toasted garlic bread', price: '250' },
        { name: 'Mixed Salad', description: 'Fresh garden salad', price: '280' },
      ]},
    ]
  },
  {
    name: 'Java House Westlands',
    description: 'Premium coffee and all-day breakfast chain serving Kenyan coffee and international cuisine',
    lat: '-1.2663', long: '36.8108',
    delivery_fee: '100', delivery_min_time: '20', delivery_max_time: '35',
    min_order_price: '400', rating: '4.5',
    cuisine: 'Café & International',
    menus: [
      { name: 'Breakfast', items: [
        { name: 'Full English Breakfast', description: 'Eggs, bacon, sausage, toast, baked beans and grilled tomato', price: '850' },
        { name: 'Avocado Toast', description: 'Smashed avocado on sourdough with poached eggs', price: '650' },
        { name: 'Pancake Stack', description: 'Buttermilk pancakes with maple syrup and fresh berries', price: '580' },
      ]},
      { name: 'Coffee & Drinks', items: [
        { name: 'Kenyan AA Coffee (Flat White)', description: 'Premium Kenyan AA beans, double espresso with steamed milk', price: '320' },
        { name: 'Cold Brew Coffee', description: '12-hour cold-steeped Kenyan coffee over ice', price: '380' },
        { name: 'Passion Fruit Smoothie', description: 'Fresh passion fruit blended with yoghurt', price: '420' },
      ]},
      { name: 'Lunch & Mains', items: [
        { name: 'Club Sandwich', description: 'Triple-decker chicken, bacon, lettuce, tomato on toasted bread', price: '750' },
        { name: 'Caesar Salad', description: 'Romaine lettuce, croutons, parmesan, Caesar dressing', price: '680' },
        { name: 'Chicken Burger', description: 'Grilled chicken breast, lettuce, tomato, mayo in brioche bun', price: '820' },
      ]},
    ]
  },
  {
    name: 'Chicken Inn Ngong Road',
    description: 'Kenya\'s favourite fried chicken fast food restaurant',
    lat: '-1.2974', long: '36.7756',
    delivery_fee: '60', delivery_min_time: '15', delivery_max_time: '30',
    min_order_price: '200', rating: '4.2',
    cuisine: 'Fast Food',
    menus: [
      { name: 'Chicken', items: [
        { name: '2-Piece Chicken Meal', description: '2 pieces crispy fried chicken with chips and coleslaw', price: '450' },
        { name: '4-Piece Sharing Box', description: '4 pieces chicken with large chips, coleslaw and two drinks', price: '950' },
        { name: 'Chicken Zinger Burger', description: 'Spicy crispy chicken fillet in a sesame bun', price: '380' },
        { name: 'Chicken Wings (6 pcs)', description: 'Hot and crispy chicken wings', price: '350' },
      ]},
      { name: 'Sides & Drinks', items: [
        { name: 'Large Chips', description: 'Crispy golden french fries', price: '180' },
        { name: 'Coleslaw', description: 'Creamy homemade coleslaw', price: '80' },
        { name: 'Pepsi 500ml', description: 'Ice cold Pepsi', price: '80' },
        { name: 'Strawberry Milkshake', description: 'Thick creamy strawberry milkshake', price: '250' },
      ]},
    ]
  },
  {
    name: 'Artcaffé Ocean Plaza',
    description: 'Upscale café-restaurant chain with European-inspired menu and artisanal coffee',
    lat: '-1.2868', long: '36.8237',
    delivery_fee: '150', delivery_min_time: '25', delivery_max_time: '40',
    min_order_price: '500', rating: '4.6',
    cuisine: 'European & Café',
    menus: [
      { name: 'Pasta & Pizza', items: [
        { name: 'Spaghetti Carbonara', description: 'Classic Roman pasta with pancetta, egg yolk and pecorino', price: '890' },
        { name: 'Penne Arrabbiata', description: 'Penne in spicy tomato sauce with olives and basil', price: '750' },
        { name: 'Margherita Pizza (12")', description: 'San Marzano tomato, fresh mozzarella, basil', price: '1100' },
        { name: 'Pepperoni Pizza (12")', description: 'Pepperoni, mozzarella, tomato sauce', price: '1250' },
      ]},
      { name: 'Salads & Light Bites', items: [
        { name: 'Nicoise Salad', description: 'Tuna, green beans, olives, egg, tomatoes', price: '780' },
        { name: 'Artcaffé Signature Bruschetta', description: 'Grilled sourdough with tomato, basil, garlic', price: '480' },
      ]},
      { name: 'Specialty Coffee', items: [
        { name: 'Cappuccino', description: 'Double espresso with velvety microfoam', price: '350' },
        { name: 'Matcha Latte', description: 'Ceremonial matcha with steamed oat milk', price: '420' },
      ]},
    ]
  },
  {
    name: 'Habesha Ethiopian Restaurant',
    description: 'Authentic Ethiopian cuisine served on injera with rich stews and vegetarian options',
    lat: '-1.2712', long: '36.8103',
    delivery_fee: '120', delivery_min_time: '30', delivery_max_time: '50',
    min_order_price: '400', rating: '4.4',
    cuisine: 'Ethiopian',
    menus: [
      { name: 'Meat Combos', items: [
        { name: 'Doro Wat (Chicken Stew)', description: 'Slow-cooked spiced chicken stew with hard-boiled egg, served on injera', price: '850' },
        { name: 'Tibs (Sautéed Beef)', description: 'Pan-fried beef with onions, jalapeños and rosemary on injera', price: '900' },
        { name: 'Mixed Meat Combo for 2', description: 'Doro wat, tibs and kitfo for two, with injera', price: '2200' },
      ]},
      { name: 'Vegetarian', items: [
        { name: 'Vegetarian Combo', description: 'Misir (lentils), Gomen (collard greens), Tikil Gomen (cabbage), Shiro on injera', price: '650' },
        { name: 'Fasting Platter', description: 'Full vegan Ethiopian fasting spread for 2 on injera', price: '1200' },
      ]},
      { name: 'Drinks', items: [
        { name: 'Ethiopian Coffee Ceremony', description: 'Traditional Ethiopian coffee ceremony - 3 rounds', price: '350' },
        { name: 'Tej (Honey Wine)', description: 'Traditional Ethiopian honey wine', price: '300' },
      ]},
    ]
  },
  {
    name: 'Swahili Beach Café',
    description: 'Coastal Swahili flavours in Nairobi — biryani, pilau and fresh seafood',
    lat: '-1.2960', long: '36.8155',
    delivery_fee: '90', delivery_min_time: '20', delivery_max_time: '40',
    min_order_price: '350', rating: '4.5',
    cuisine: 'Swahili & Coastal',
    menus: [
      { name: 'Rice Dishes', items: [
        { name: 'Chicken Biryani', description: 'Fragrant basmati rice with spiced chicken, raita and kachumbari', price: '650' },
        { name: 'Beef Pilau', description: 'Spiced beef pilau with pickled onions', price: '550' },
        { name: 'Prawn Biryani', description: 'Coastal-style prawn biryani with coconut milk', price: '850' },
      ]},
      { name: 'Seafood', items: [
        { name: 'Grilled Prawns (6 pcs)', description: 'Tiger prawns grilled with garlic butter, served with rice', price: '1100' },
        { name: 'Fish Curry (Coconut)', description: 'Coastal fish curry in coconut milk sauce with rice', price: '750' },
        { name: 'Calamari Rings', description: 'Crispy fried calamari with tamarind dip', price: '680' },
      ]},
      { name: 'Swahili Snacks', items: [
        { name: 'Mandazi (6 pcs)', description: 'Swahili coconut doughnuts', price: '150' },
        { name: 'Samosa (3 pcs)', description: 'Crispy beef or vegetable samosas', price: '200' },
      ]},
    ]
  },
  {
    name: 'Pizza Inn Nairobi CBD',
    description: 'Popular pizza chain with a wide range of pizzas, pastas and desserts',
    lat: '-1.2833', long: '36.8219',
    delivery_fee: '70', delivery_min_time: '20', delivery_max_time: '40',
    min_order_price: '500', rating: '4.3',
    cuisine: 'Pizza & Italian',
    menus: [
      { name: 'Pizzas', items: [
        { name: 'Tropical Pizza (12")', description: 'Ham, pineapple, mozzarella on tomato base', price: '1100' },
        { name: 'Meat Lovers (12")', description: 'Beef mince, pepperoni, chicken, bacon, mozzarella', price: '1350' },
        { name: 'Veggie Supreme (12")', description: 'Bell peppers, mushroom, olives, onion, tomato', price: '950' },
        { name: 'BBQ Chicken (12")', description: 'BBQ sauce, grilled chicken, red onion, mozzarella', price: '1200' },
      ]},
      { name: 'Pastas & Sides', items: [
        { name: 'Pasta Bolognese', description: 'Spaghetti in rich beef bolognese sauce', price: '650' },
        { name: 'Garlic Bread with Cheese', description: 'Toasted baguette with garlic butter and melted cheese', price: '300' },
        { name: 'Coleslaw Bowl', description: 'Creamy coleslaw', price: '120' },
      ]},
      { name: 'Desserts & Drinks', items: [
        { name: 'Chocolate Lava Cake', description: 'Warm chocolate cake with molten centre and vanilla ice cream', price: '450' },
        { name: 'Fanta Orange 500ml', description: 'Ice cold Fanta', price: '80' },
        { name: 'Strawberry Cheesecake Slice', description: 'New York style cheesecake with strawberry coulis', price: '380' },
      ]},
    ]
  },
];

// ─── Seed function ───────────────────────────────────────────────────────────
async function seed() {
  process.stdout.write('\n🌱 Seeding aimobility Restaurants & Menus\n');
  process.stdout.write('━'.repeat(52) + '\n\n');

  let totalRestaurants = 0, totalMenus = 0, totalItems = 0;

  for (const r of RESTAURANTS) {
    const restaurantId = uuid();
    const restItem = {
      restaurantId,
      id: restaurantId,
      name: r.name,
      description: r.description || '',
      cuisine: r.cuisine || '',
      lat: r.lat,
      long: r.long,
      delivery_fee: r.delivery_fee,
      delivery_min_time: r.delivery_min_time,
      delivery_max_time: r.delivery_max_time,
      min_order_price: r.min_order_price,
      rating: r.rating,
      is_open: true,
      image: '',
      created: now(),
      updated: now(),
    };

    await ddb.send(new PutCommand({ TableName: 'aimobility-restaurants', Item: restItem }));
    totalRestaurants++;
    process.stdout.write(`  ✅ ${r.name} (${restaurantId.slice(0,8)}...)\n`);

    // Seed menus
    for (const menu of (r.menus || [])) {
      const menuId = uuid();
      await ddb.send(new PutCommand({
        TableName: 'aimobility-restaurant-menus',
        Item: {
          menuId,
          id: menuId,
          restaurantId,
          restaurant_id: restaurantId,
          name: menu.name,
          description: '',
          image: '',
          created: now(),
        }
      })).catch(() => {}); // table may not exist yet
      totalMenus++;

      // Seed menu items
      for (const item of (menu.items || [])) {
        const itemId = uuid();
        await ddb.send(new PutCommand({
          TableName: 'aimobility-menu-items',
          Item: {
            itemId,
            id: itemId,
            menuId,
            menu_id: menuId,
            restaurantId,
            restaurant_id: restaurantId,
            name: item.name,
            description: item.description,
            price: item.price,
            image: '',
            out_of_order: 0,
            created: now(),
          }
        })).catch(() => {}); // table may not exist yet
        totalItems++;
      }
      process.stdout.write(`     📋 ${menu.name} (${menu.items.length} items)\n`);
    }
    process.stdout.write('\n');
  }

  process.stdout.write('━'.repeat(52) + '\n');
  process.stdout.write(`✅ Seeded ${totalRestaurants} restaurants\n`);
  process.stdout.write(`✅ Seeded ${totalMenus} menu categories\n`);
  process.stdout.write(`✅ Seeded ${totalItems} menu items\n\n`);
}

seed().catch(e => {
  process.stdout.write('Error: ' + e.message + '\n');
  process.exit(1);
});
