#!/usr/bin/env python3
"""
Analyze Shopify order data to find commonly bought together product pairs
Shopify exports have repeating order IDs with different line items
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
            if current_order_id and product_name and product_name not in orders[current_order_id]:
                orders[current_order_id].append(product_name)
    
    # Find all product pairs within each order
    pair_counts = Counter()
    product_counts = Counter()
    
    for order_id, products in orders.items():
        if len(products) < 2:
            continue  # Skip single-item orders
            
        for product in products:
            product_counts[product] += 1
        
        # Generate all pairs from this order
        for i in range(len(products)):
            for j in range(i + 1, len(products)):
                pair = tuple(sorted([products[i], products[j]]))
                pair_counts[pair] += 1
    
    return pair_counts, product_counts, orders

def extract_brand(product_name):
    """Extract brand from product name"""
    words = product_name.split()
    if not words:
        return "Unknown"
    
    # Common brands in the data
    brands = ['Andis', 'Wahl', 'JRL', 'Gamma', 'Stylecraft', 'BaByliss', 'Babyliss', 
              'TPOB', 'Cocco', 'L3vel', 'L3VEL', 'Morono', 'Tomb', 'Supreme',
              'Clutch', 'NoClogg', 'SC', 'OG', 'Vincent', 'Smash', 'Rolda',
              'Dorco', 'Oster', 'Johnny B', 'Gamechanger', 'My Favorite Barber']
    
    for word in words:
        for brand in brands:
            if brand.lower() in word.lower():
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
    elif 'gel' in name_lower or 'oil' in name_lower:
        return 'Grooming Product'
    elif 'airbrush' in name_lower:
        return 'Airbrush'
    elif 'class' in name_lower or 'certificate' in name_lower:
        return 'Class'
    else:
        return 'Accessory'

def main():
    filename = '/Users/poseidon/Downloads/orders_export_1 (2).csv'
    
    print("=" * 80)
    print("CLUTCH BARBER SUPPLY - PRODUCT PAIR ANALYSIS")
    print("=" * 80)
    
    pair_counts, product_counts, orders = analyze_orders(filename)
    
    # Summary stats
    total_orders = len(orders)
    multi_item_orders = sum(1 for products in orders.values() if len(products) >= 2)
    
    print(f"\n📊 ANALYSIS SUMMARY:")
    print(f"   Total Orders: {total_orders}")
    print(f"   Multi-item Orders: {multi_item_orders} ({multi_item_orders/total_orders*100:.1f}%)")
    print(f"   Unique Products: {len(product_counts)}")
    print(f"   Unique Pairs Found: {len(pair_counts)}")
    
    # Top products by volume
    print("\n\n📈 TOP 15 PRODUCTS BY ORDER VOLUME:")
    print("-" * 80)
    for product, count in product_counts.most_common(15):
        brand = extract_brand(product)
        category = categorize_product(product)
        print(f"  {count:3d} orders | {brand:12s} | {category:15s} | {product[:45]}")
    
    # Top pairs
    print("\n\n🔗 TOP 15 PRODUCT PAIRS (by co-purchase count):")
    print("-" * 80)
    
    for i, ((product_a, product_b), count) in enumerate(pair_counts.most_common(15), 1):
        brand_a = extract_brand(product_a)
        brand_b = extract_brand(product_b)
        cat_a = categorize_product(product_a)
        cat_b = categorize_product(product_b)
        
        print(f"\n{i}. Bought together {count} times:")
        print(f"   A: [{brand_a:10s}] {product_a[:50]}")
        print(f"   B: [{brand_b:10s}] {product_b[:50]}")
        print(f"   Category: {cat_a} + {cat_b}")
        
        # Calculate affinity
        if product_a in product_counts and product_b in product_counts:
            affinity_a = count / product_counts[product_a] * 100
            affinity_b = count / product_counts[product_b] * 100
            print(f"   Affinity: {affinity_a:.1f}% of {brand_a} buyers also buy {brand_b}")
    
    # Generate recommendations for metafields
    print("\n\n💾 RECOMMENDED METAFIELD SETUP:")
    print("=" * 80)
    print("\nFor each top product, here's the recommended 'Common Pair':\n")
    
    recommendations = []
    for product, count in product_counts.most_common(25):
        # Find best pair for this product
        best_pair = None
        best_count = 0
        
        for (a, b), c in pair_counts.items():
            if a == product or b == product:
                if c > best_count:
                    best_count = c
                    best_pair = b if a == product else a
        
        if best_pair:
            # Calculate upsell gap (rough estimate based on product type)
            # This would be actual price in production
            recommendations.append({
                'product': product,
                'common_pair': best_pair,
                'times_together': best_count,
                'upsell_gap': 'Auto-calculated'  # Would be $300 - product.price
            })
    
    # Print as table
    print(f"{'Product':<40} | {'Common Pair':<40} | {'Together':<10}")
    print("-" * 100)
    for rec in recommendations[:20]:
        product_short = rec['product'][:38]
        pair_short = rec['common_pair'][:38]
        print(f"{product_short:<40} | {pair_short:<40} | {rec['times_together']:<10}")
    
    # Category-based insights
    print("\n\n📊 CATEGORY PAIRING INSIGHTS:")
    print("-" * 80)
    
    category_pairs = Counter()
    for (a, b), count in pair_counts.items():
        cat_a = categorize_product(a)
        cat_b = categorize_product(b)
        pair = tuple(sorted([cat_a, cat_b]))
        category_pairs[pair] += count
    
    for (cat_a, cat_b), count in category_pairs.most_common(10):
        print(f"  {count:3d} orders | {cat_a} + {cat_b}")
    
    print("\n" + "=" * 80)
    print("NEXT STEPS:")
    print("=" * 80)
    print("1. Review the top pairs above")
    print("2. Set up metafields in Shopify Admin for top 20 products")
    print("3. Use 'Common Pair' column for the 'Commonly Bought Together' section")
    print("4. Calculate upsell gap: $300 - current product price")
    print("\nFor products without strong pairings, use category defaults:")
    print("  - Clippers → suggest Trimmers")
    print("  - Trimmers → suggest Blades or Guards")
    print("  - Shavers → suggest Trimmers")
    print("  - Large items → suggest small accessories (combs, oils)")

if __name__ == '__main__':
    main()
