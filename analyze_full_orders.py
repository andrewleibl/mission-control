#!/usr/bin/env python3
"""
Analyze FULL Shopify order history to find commonly bought together product pairs
"""
import csv
from collections import defaultdict, Counter

def analyze_orders(filename):
    # Group line items by order ID
    orders = defaultdict(list)
    current_order_id = None
    
    with open(filename, 'r') as f:
        reader = csv.DictReader(f)
        for row in reader:
            # Check if this row has an order ID (new order) or continues previous
            order_id = row.get('Name', '').strip()  # 'Name' column has order # like '# 3987'
            if order_id and order_id.startswith('#'):
                current_order_id = order_id
            
            product_name = row.get('Lineitem name', '').strip()
            lineitem_price = row.get('Lineitem price', '').strip()
            
            if current_order_id and product_name and product_name not in [p['name'] for p in orders[current_order_id]]:
                orders[current_order_id].append({
                    'name': product_name,
                    'price': float(lineitem_price) if lineitem_price else 0
                })
    
    # Find all product pairs within each order
    pair_counts = Counter()
    product_counts = Counter()
    product_prices = {}
    
    for order_id, items in orders.items():
        if len(items) < 2:
            continue  # Skip single-item orders
            
        product_names = [item['name'] for item in items]
        
        for item in items:
            product_counts[item['name']] += 1
            if item['name'] not in product_prices:
                product_prices[item['name']] = item['price']
        
        # Generate all pairs from this order
        for i in range(len(product_names)):
            for j in range(i + 1, len(product_names)):
                pair = tuple(sorted([product_names[i], product_names[j]]))
                pair_counts[pair] += 1
    
    return pair_counts, product_counts, product_prices, orders

def extract_brand(product_name):
    """Extract brand from product name"""
    words = product_name.split()
    if not words:
        return "Unknown"
    
    # Common brands
    brands = ['Andis', 'Wahl', 'JRL', 'Gamma', 'Stylecraft', 'BaByliss', 'Babyliss', 
              'TPOB', 'Cocco', 'COCCO', 'L3vel', 'L3VEL', 'Level', 'LEVEL', 'Morono', 'Tomb', 'TOMB',
              'Supreme', 'Clutch', 'NoClogg', 'SC', 'OG', 'Vincent', 'Smash', 'Rolda',
              'Dorco', 'Oster', 'Johnny B', 'Gamechanger', 'My Favorite Barber',
              'Gamma+', 'Style Craft', 'Gamma|Style Craft']
    
    name_upper = product_name.upper()
    for brand in brands:
        if brand.upper() in name_upper:
            return brand
    
    return words[0] if words else "Unknown"

def categorize_product(product_name):
    """Categorize product by type"""
    name_lower = product_name.lower()
    
    if 'clipper' in name_lower:
        return 'Clipper'
    elif 'trimmer' in name_lower:
        return 'Trimmer'
    elif 'shaver' in name_lower:
        return 'Shaver'
    elif 'blade' in name_lower:
        return 'Blade'
    elif 'comb' in name_lower:
        return 'Comb'
    elif 'cape' in name_lower:
        return 'Cape'
    elif 'razor' in name_lower:
        return 'Razor'
    elif 'gel' in name_lower or 'oil' in name_lower or 'cologne' in name_lower:
        return 'Grooming'
    elif 'airbrush' in name_lower:
        return 'Airbrush'
    elif 'class' in name_lower or 'certificate' in name_lower:
        return 'Class'
    elif 'chair' in name_lower:
        return 'Chair'
    elif 'light' in name_lower:
        return 'Light'
    elif 'bag' in name_lower or 'case' in name_lower:
        return 'Bag/Case'
    else:
        return 'Accessory'

def simplify_name(product_name):
    """Create a simplified product name for display"""
    brand = extract_brand(product_name)
    category = categorize_product(product_name)
    
    # Extract model if present
    words = product_name.split()
    model = []
    for word in words[1:4]:  # Check next few words after brand
        if word in ['Master', 'Senior', 'Magic', 'Clipper', 'Trimmer', 'Shaver', 'Onyx', 'Boosted', 'Flex', 'Rebel', 'X-Ergo', 'Pro', 'Mini']:
            model.append(word)
    
    if model:
        return f"{brand} {' '.join(model)}"
    return f"{brand} {category}"

def main():
    filename = '/Users/poseidon/Downloads/orders_export_1.csv'
    
    print("=" * 80)
    print("CLUTCH BARBER SUPPLY - FULL ORDER HISTORY ANALYSIS")
    print("=" * 80)
    
    pair_counts, product_counts, product_prices, orders = analyze_orders(filename)
    
    # Summary stats
    total_orders = len(orders)
    multi_item_orders = sum(1 for items in orders.values() if len(items) >= 2)
    
    print(f"\n📊 ANALYSIS SUMMARY:")
    print(f"   Total Orders: {total_orders}")
    print(f"   Multi-item Orders: {multi_item_orders} ({multi_item_orders/total_orders*100:.1f}%)")
    print(f"   Unique Products: {len(product_counts)}")
    print(f"   Unique Pairs Found: {len(pair_counts)}")
    
    # Top products by volume
    print("\n\n📈 TOP 25 PRODUCTS BY ORDER VOLUME:")
    print("-" * 80)
    print(f"{'Orders':<8} | {'Brand':<12} | {'Category':<12} | {'Product':<40}")
    print("-" * 80)
    for product, count in product_counts.most_common(25):
        brand = extract_brand(product)
        category = categorize_product(product)
        simple = simplify_name(product)
        print(f"{count:<8} | {brand:<12} | {category:<12} | {simple[:40]}")
    
    # Top pairs with minimum threshold
    print("\n\n🔗 TOP PRODUCT PAIRS (2+ co-purchases):")
    print("-" * 80)
    
    significant_pairs = [(pair, count) for pair, count in pair_counts.most_common() if count >= 2]
    
    if not significant_pairs:
        print("No pairs with 2+ co-purchases found. Showing all pairs:")
        significant_pairs = pair_counts.most_common(20)
    
    for i, ((product_a, product_b), count) in enumerate(significant_pairs[:25], 1):
        brand_a = extract_brand(product_a)
        brand_b = extract_brand(product_b)
        cat_a = categorize_product(product_a)
        cat_b = categorize_product(product_b)
        
        # Calculate prices
        price_a = product_prices.get(product_a, 0)
        price_b = product_prices.get(product_b, 0)
        
        print(f"\n{i}. Bought together {count} times:")
        print(f"   A: [{brand_a:10s}] {simplify_name(product_a)[:45]} (${price_a:.2f})")
        print(f"   B: [{brand_b:10s}] {simplify_name(product_b)[:45]} (${price_b:.2f})")
        print(f"   Combined: ${price_a + price_b:.2f}")
        
        # Calculate affinity
        if product_a in product_counts and product_b in product_counts:
            affinity_a = count / product_counts[product_a] * 100
            affinity_b = count / product_counts[product_b] * 100
            print(f"   Affinity: {affinity_a:.1f}% of {brand_a} buyers also buy {brand_b}")
    
    # Generate metafield recommendations
    print("\n\n💾 RECOMMENDED METAFIELDS FOR TOP 30 PRODUCTS:")
    print("=" * 100)
    print(f"{'Product':<35} | {'Price':<8} | {'Common Pair':<35} | {'Gap to $300':<12}")
    print("-" * 100)
    
    recommendations = []
    for product, count in product_counts.most_common(30):
        # Find best pair for this product
        best_pair = None
        best_count = 0
        
        for (a, b), c in pair_counts.items():
            if a == product or b == product:
                if c > best_count:
                    best_count = c
                    best_pair = b if a == product else a
        
        # Calculate upsell gap
        price = product_prices.get(product, 0)
        gap = max(0, 300 - price)
        
        if best_pair:
            pair_price = product_prices.get(best_pair, 0)
            new_total = price + pair_price
            new_gap = max(0, 300 - new_total)
        else:
            best_pair = "N/A"
            new_gap = gap
        
        recommendations.append({
            'product': simplify_name(product),
            'full_product': product,
            'price': price,
            'common_pair': simplify_name(best_pair) if best_pair != "N/A" else best_pair,
            'full_pair': best_pair if best_pair != "N/A" else "",
            'gap': gap,
            'new_gap': new_gap if best_pair != "N/A" else gap,
            'times_together': best_count
        })
    
    for rec in recommendations[:30]:
        product_short = rec['product'][:34]
        pair_short = rec['common_pair'][:34]
        print(f"{product_short:<35} | ${rec['price']:<7.0f} | {pair_short:<35} | ${rec['gap']:<11.0f}")
    
    # Category insights
    print("\n\n📊 CATEGORY PAIRING INSIGHTS:")
    print("-" * 80)
    
    category_pairs = Counter()
    for (a, b), count in pair_counts.items():
        cat_a = categorize_product(a)
        cat_b = categorize_product(b)
        pair = tuple(sorted([cat_a, cat_b]))
        category_pairs[pair] += count
    
    for (cat_a, cat_b), count in category_pairs.most_common(15):
        print(f"  {count:3d} orders | {cat_a} + {cat_b}")
    
    # High-value orders (for free shipping analysis)
    print("\n\n💰 HIGH-VALUE ORDERS (Near $300 Free Shipping):")
    print("-" * 80)
    
    high_value = []
    for order_id, items in orders.items():
        total = sum(item['price'] for item in items)
        if 200 <= total <= 350:
            product_list = ", ".join([simplify_name(item['name']) for item in items[:3]])
            high_value.append((total, product_list))
    
    high_value.sort(reverse=True)
    for total, products in high_value[:15]:
        print(f"  ${total:6.2f} | {products[:60]}")
    
    # Export CSV for import
    print("\n\n📤 CSV IMPORT TEMPLATE (first 20 products):")
    print("=" * 80)
    print("product_name,common_pair,upsell_gap")
    for rec in recommendations[:20]:
        pair_name = rec['full_pair'] if rec['full_pair'] else ""
        print(f'"{rec["full_product"]}","{pair_name}",{rec["gap"]:.0f}')
    
    print("\n" + "=" * 80)
    print("SUMMARY:")
    print("=" * 80)
    print(f"• Total orders analyzed: {total_orders}")
    print(f"• Multi-item orders: {multi_item_orders} ({multi_item_orders/total_orders*100:.1f}%)")
    print(f"• Products with pairs: {len([r for r in recommendations if r['times_together'] > 0])}")
    print(f"• Use category fallbacks for products without strong pairings")
    print("\nNext: Populate metafields using the CSV above or Shopify bulk editor")

if __name__ == '__main__':
    main()
