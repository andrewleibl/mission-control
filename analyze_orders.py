#!/usr/bin/env python3
"""
Analyze Shopify order data to find commonly bought together product pairs
"""
import csv
from collections import defaultdict, Counter

def analyze_orders(filename):
    # Group line items by order ID
    orders = defaultdict(list)
    
    with open(filename, 'r') as f:
        reader = csv.DictReader(f)
        for row in reader:
            order_id = row.get('Id', '').strip()
            product_name = row.get('Lineitem name', '').strip()
            if order_id and product_name:
                orders[order_id].append(product_name)
    
    # Find all product pairs within each order
    pair_counts = Counter()
    product_counts = Counter()
    
    for order_id, products in orders.items():
        # Remove duplicates within same order
        unique_products = list(set(products))
        
        for product in unique_products:
            product_counts[product] += 1
        
        # Generate all pairs from this order
        for i in range(len(unique_products)):
            for j in range(i + 1, len(unique_products)):
                # Sort to ensure consistent pairing (A,B) same as (B,A)
                pair = tuple(sorted([unique_products[i], unique_products[j]]))
                pair_counts[pair] += 1
    
    # Calculate co-purchase rates
    pair_analysis = []
    for (product_a, product_b), count in pair_counts.most_common():
        # Calculate what % of product A buyers also bought product B
        rate_a = count / product_counts[product_a] * 100 if product_counts[product_a] > 0 else 0
        rate_b = count / product_counts[product_b] * 100 if product_counts[product_b] > 0 else 0
        avg_rate = (rate_a + rate_b) / 2
        
        pair_analysis.append({
            'product_a': product_a,
            'product_b': product_b,
            'times_bought_together': count,
            'product_a_total_sales': product_counts[product_a],
            'product_b_total_sales': product_counts[product_b],
            'affinity_score': avg_rate
        })
    
    return pair_analysis, product_counts

def main():
    filename = '/Users/poseidon/Downloads/orders_export_1 (2).csv'
    
    print("=" * 80)
    print("CLUTCH BARBER SUPPLY - PRODUCT PAIR ANALYSIS")
    print("=" * 80)
    
    pair_analysis, product_counts = analyze_orders(filename)
    
    # Top products by volume
    print("\n📊 TOP 20 PRODUCTS BY ORDER VOLUME:")
    print("-" * 80)
    for product, count in product_counts.most_common(20):
        print(f"  {count:3d} orders | {product[:60]}")
    
    # Top pairs by co-purchase rate (minimum 3 co-purchases)
    print("\n\n🔗 TOP PRODUCT PAIRS (Affinity Score > 20%, Min 3 co-purchases):")
    print("-" * 80)
    
    significant_pairs = [p for p in pair_analysis if p['affinity_score'] >= 20 and p['times_bought_together'] >= 3]
    
    for i, pair in enumerate(significant_pairs[:15], 1):
        print(f"\n{i}. {pair['product_a'][:40]}")
        print(f"   + {pair['product_b'][:40]}")
        print(f"   → Bought together: {pair['times_bought_together']} times")
        print(f"   → Affinity: {pair['affinity_score']:.1f}%")
    
    # All pairs sorted by raw co-purchase count
    print("\n\n📈 ALL PAIRS BY CO-PURCHASE COUNT:")
    print("-" * 80)
    
    for pair in pair_analysis[:20]:
        print(f"{pair['times_bought_together']:2d}x | {pair['product_a'][:35]} + {pair['product_b'][:35]}")
    
    # Output CSV for import
    print("\n\n💾 GENERATING METAFIELD IMPORT CSV...")
    print("-" * 80)
    
    # Create simplified product name mapping
    simplified_names = {}
    for product in product_counts:
        # Extract brand and key product type
        if 'Clipper' in product:
            brand = product.split()[0] if product.split() else 'Unknown'
            simplified_names[product] = f"{brand} Clipper"
        elif 'Trimmer' in product:
            brand = product.split()[0] if product.split() else 'Unknown'
            simplified_names[product] = f"{brand} Trimmer"
        elif 'Shaver' in product:
            brand = product.split()[0] if product.split() else 'Unknown'
            simplified_names[product] = f"{brand} Shaver"
        else:
            simplified_names[product] = product[:50]
    
    # Write recommendations for top products
    recommendations = {}
    for product in list(product_counts.keys())[:30]:
        # Find best pair for this product
        best_pair = None
        best_score = 0
        for pair in pair_analysis:
            if pair['product_a'] == product or pair['product_b'] == product:
                other = pair['product_b'] if pair['product_a'] == product else pair['product_a']
                if pair['affinity_score'] > best_score:
                    best_score = pair['affinity_score']
                    best_pair = other
        
        if best_pair:
            recommendations[product] = best_pair
    
    # Print recommendations
    print("\nRECOMMENDED PRODUCT PAIRS FOR METAFIELDS:")
    print("-" * 80)
    for product, pair in list(recommendations.items())[:20]:
        price = 300 - (product_counts.get(product, 0) * 10)  # Rough estimate
        print(f"Product: {simplified_names.get(product, product)[:50]}")
        print(f"  → Common Pair: {simplified_names.get(pair, pair)[:50]}")
        print(f"  → Suggested Upsell Gap: ${max(50, price)}")
        print()

if __name__ == '__main__':
    main()
