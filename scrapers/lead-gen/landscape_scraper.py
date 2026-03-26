#!/usr/bin/env python3
"""
Landscaping Lead Scraper for Straight Point Marketing
Scrapes Google Maps for landscaping companies by city/state
Filters: 4-499 reviews, deduplicates, outputs clean CSV
"""

import os
import json
import time
import csv
from datetime import datetime
from typing import List, Dict, Optional
from dataclasses import dataclass, asdict
import argparse

# For Google Places API
import requests
from tqdm import tqdm

# Note: Using Google Places API requires an API key
# Get one at: https://developers.google.com/maps/documentation/places/web-service/get-api-key

@dataclass
class Business:
    name: str
    phone: str
    review_count: int
    address: str
    city: str
    state: str
    place_id: str
    website: str = ""
    
    def to_dict(self):
        return asdict(self)

class LandscapeScraper:
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://maps.googleapis.com/maps/api/place"
        self.results = []
        self.seen_place_ids = set()  # For deduplication
        
    def search_city(self, city: str, state: str, max_results: int = 60) -> List[Business]:
        """Search for landscaping companies in a specific city"""
        query = f"landscaping companies in {city}, {state}"
        print(f"\n🔍 Searching: {query}")
        
        businesses = []
        next_page_token = None
        
        while len(businesses) < max_results:
            url = f"{self.base_url}/textsearch/json"
            params = {
                "query": query,
                "key": self.api_key,
                "type": "landscape_contractor"
            }
            
            if next_page_token:
                params["pagetoken"] = next_page_token
                time.sleep(2)  # Required delay between pages
            
            try:
                response = requests.get(url, params=params, timeout=30)
                data = response.json()
                
                if data.get("status") != "OK":
                    print(f"⚠️  API Error: {data.get('status')} - {data.get('error_message', '')}")
                    break
                
                for place in data.get("results", []):
                    business = self._extract_business_data(place, city, state)
                    if business and self._passes_filters(business):
                        if business.place_id not in self.seen_place_ids:
                            businesses.append(business)
                            self.seen_place_ids.add(business.place_id)
                            
                            if len(businesses) >= max_results:
                                break
                
                # Check for next page
                next_page_token = data.get("next_page_token")
                if not next_page_token:
                    break
                    
            except Exception as e:
                print(f"❌ Error searching {city}: {e}")
                break
        
        print(f"✅ Found {len(businesses)} qualified businesses in {city}")
        return businesses
    
    def _extract_business_data(self, place: Dict, city: str, state: str) -> Optional[Business]:
        """Extract and clean business data from API response"""
        try:
            place_id = place.get("place_id", "")
            name = place.get("name", "").strip()
            address = place.get("formatted_address", "").strip()
            
            # Get detailed info including phone
            details = self._get_place_details(place_id)
            
            if not details:
                return None
            
            phone = details.get("formatted_phone_number", "")
            website = details.get("website", "")
            
            # Get review count
            review_count = details.get("user_ratings_total", 0)
            if not review_count:
                review_count = place.get("user_ratings_total", 0)
            
            return Business(
                name=name,
                phone=phone,
                review_count=review_count,
                address=address,
                city=city,
                state=state,
                place_id=place_id,
                website=website
            )
            
        except Exception as e:
            print(f"⚠️  Error extracting data: {e}")
            return None
    
    def _get_place_details(self, place_id: str) -> Optional[Dict]:
        """Get detailed business info including phone number"""
        url = f"{self.base_url}/details/json"
        params = {
            "place_id": place_id,
            "fields": "name,formatted_phone_number,website,user_ratings_total,formatted_address",
            "key": self.api_key
        }
        
        try:
            response = requests.get(url, params=params, timeout=10)
            data = response.json()
            
            if data.get("status") == "OK":
                return data.get("result", {})
            return None
            
        except Exception as e:
            print(f"⚠️  Error getting details: {e}")
            return None
    
    def _passes_filters(self, business: Business) -> bool:
        """Check if business passes review count filters"""
        # Filter: 4-499 reviews (not 0-3, not 500+)
        return 4 <= business.review_count <= 499
    
    def scrape_state(self, state: str, cities: List[str]) -> List[Business]:
        """Scrape all cities in a state"""
        print(f"\n{'='*60}")
        print(f"📍 PROCESSING STATE: {state.upper()}")
        print(f"{'='*60}")
        
        state_businesses = []
        
        for city in tqdm(cities, desc=f"Cities in {state}"):
            city_businesses = self.search_city(city, state)
            state_businesses.extend(city_businesses)
            time.sleep(1)  # Rate limiting between cities
        
        print(f"\n📊 STATE SUMMARY: {len(state_businesses)} total businesses in {state}")
        return state_businesses
    
    def export_to_csv(self, businesses: List[Business], filename: str):
        """Export results to CSV"""
        if not businesses:
            print("⚠️  No businesses to export")
            return
        
        filepath = os.path.join(os.path.dirname(__file__), filename)
        
        with open(filepath, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=[
                'name', 'phone', 'review_count', 'address', 'city', 'state', 'website', 'place_id'
            ])
            writer.writeheader()
            
            for biz in businesses:
                writer.writerow(biz.to_dict())
        
        print(f"\n✅ Exported {len(businesses)} leads to: {filepath}")
        
        # Print summary
        self._print_summary(businesses)
    
    def _print_summary(self, businesses: List[Business]):
        """Print summary statistics"""
        if not businesses:
            return
        
        review_counts = [b.review_count for b in businesses]
        avg_reviews = sum(review_counts) / len(review_counts)
        
        states = set(b.state for b in businesses)
        cities = set(f"{b.city}, {b.state}" for b in businesses)
        
        print(f"\n{'='*60}")
        print("📈 SCRAPE SUMMARY")
        print(f"{'='*60}")
        print(f"Total Leads: {len(businesses)}")
        print(f"States: {len(states)}")
        print(f"Cities: {len(cities)}")
        print(f"Average Reviews: {avg_reviews:.1f}")
        print(f"Review Range: {min(review_counts)} - {max(review_counts)}")
        print(f"{'='*60}\n")

# Top 20 most populated cities by state (sample - expand as needed)
STATE_CITIES = {
    "Texas": ["Houston", "San Antonio", "Dallas", "Austin", "Fort Worth", "El Paso", "Arlington", "Corpus Christi", "Plano", "Lubbock", "Laredo", "Irving", "Garland", "Frisco", "McKinney", "Amarillo", "Grand Prairie", "Brownsville", "Killeen", "Pasadena"],
    "Florida": ["Jacksonville", "Miami", "Tampa", "Orlando", "St. Petersburg", "Hialeah", "Port St. Lucie", "Cape Coral", "Tallahassee", "Fort Lauderdale", "Pembroke Pines", "Hollywood", "Gainesville", "Miramar", "Coral Springs", "West Palm Beach", "Clearwater", "Palm Bay", "Lakeland", "Pompano Beach"],
    "New York": ["New York City", "Buffalo", "Rochester", "Yonkers", "Syracuse", "Albany", "New Rochelle", "Mount Vernon", "Schenectady", "Utica", "White Plains", "Hempstead", "Troy", "Niagara Falls", "Binghamton", "Freeport", "Valley Stream", "Long Beach", "Rome", "North Tonawanda"],
    # Add more states as needed
}

def main():
    parser = argparse.ArgumentParser(description='Scrape landscaping leads from Google Maps')
    parser.add_argument('--state', type=str, help='State to scrape (e.g., "Texas")')
    parser.add_argument('--api-key', type=str, help='Google Places API Key')
    parser.add_argument('--output', type=str, default='landscaping_leads.csv', help='Output filename')
    
    args = parser.parse_args()
    
    # Get API key from env or args
    api_key = args.api_key or os.getenv('GOOGLE_PLACES_API_KEY')
    
    if not api_key:
        print("❌ ERROR: Google Places API key required")
        print("Get one at: https://developers.google.com/maps/documentation/places/web-service/get-api-key")
        print("\nSet it via:")
        print("  --api-key YOUR_KEY")
        print("  Or: export GOOGLE_PLACES_API_KEY=YOUR_KEY")
        return
    
    scraper = LandscapeScraper(api_key)
    
    # Determine which states to scrape
    if args.state:
        states_to_scrape = {args.state: STATE_CITIES.get(args.state, [])}
    else:
        states_to_scrape = STATE_CITIES
    
    all_businesses = []
    
    for state, cities in states_to_scrape.items():
        if not cities:
            print(f"⚠️  No cities defined for {state}, skipping...")
            continue
        
        state_businesses = scraper.scrape_state(state, cities)
        all_businesses.extend(state_businesses)
        
        # Save incremental backup after each state
        timestamp = datetime.now().strftime("%Y%m%d_%H%M")
        backup_file = f"{state.lower().replace(' ', '_')}_leads_{timestamp}.csv"
        scraper.export_to_csv(state_businesses, backup_file)
    
    # Final combined export
    if all_businesses:
        scraper.export_to_csv(all_businesses, args.output)

if __name__ == "__main__":
    main()
