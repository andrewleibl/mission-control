#!/usr/bin/env python3

# Read the FAQ file
with open('preview-faq.html', 'r') as f:
    content = f.read()

# New footer CSS to add (homepage footer styles)
footer_css = '''
    /* Footer - Full Homepage Version */
    .clutch-home-footer {
      background: var(--clutch-bg);
      border-top: 1px solid var(--clutch-border);
      padding: 3rem 0 2rem;
      position: relative;
      overflow: hidden;
    }

    .clutch-home-footer::before {
      content: '';
      position: absolute;
      top: -100%;
      left: -10%;
      width: 600px;
      height: 600px;
      background: radial-gradient(circle, rgba(201, 137, 75, 0.2) 0%, transparent 50%);
      pointer-events: none;
      filter: blur(80px);
    }

    .clutch-home-footer::after {
      content: '';
      position: absolute;
      top: -80%;
      right: -10%;
      width: 400px;
      height: 400px;
      background: radial-gradient(circle, rgba(201, 137, 75, 0.12) 0%, transparent 45%);
      pointer-events: none;
      filter: blur(60px);
    }

    .clutch-home-section__inner {
      max-width: 1240px;
      margin: 0 auto;
      padding: 0 1.5rem;
      position: relative;
      z-index: 1;
    }

    .clutch-home-footer__grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 2rem;
      margin-bottom: 2.5rem;
    }

    @media (min-width: 768px) {
      .clutch-home-footer__grid {
        grid-template-columns: 2fr 2fr 1fr 1fr;
        gap: 3rem;
      }
    }

    .clutch-home-footer__sublinks {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1.5rem;
    }

    .clutch-home-footer__heading {
      font-size: 0.9375rem;
      font-weight: 600;
      margin-bottom: 1rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .clutch-home-footer__links {
      display: flex;
      flex-direction: column;
      gap: 0.625rem;
    }

    .clutch-home-footer__links a {
      font-size: 0.875rem;
      color: var(--clutch-text-dim);
      transition: color 0.2s;
    }

    .clutch-home-footer__links a:hover {
      color: var(--clutch-accent);
    }

    .clutch-home-footer__contact-info {
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid var(--clutch-border);
    }

    .clutch-home-footer__contact-info p {
      font-size: 0.8125rem;
      color: var(--clutch-text-muted);
      margin-bottom: 0.375rem;
      line-height: 1.5;
    }

    .clutch-home-footer__bottom {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1.25rem;
      padding-top: 2rem;
      border-top: 1px solid #1a2332;
    }

    @media (min-width: 640px) {
      .clutch-home-footer__bottom {
        flex-direction: row;
        justify-content: space-between;
      }
    }

    .clutch-home-footer__social {
      display: flex;
      gap: 0.875rem;
    }

    .clutch-home-footer__social a {
      width: 2.25rem;
      height: 2.25rem;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(255,255,255,0.05);
      border: 1px solid var(--clutch-border);
      border-radius: 8px;
      transition: all 0.2s;
    }

    .clutch-home-footer__social a:hover {
      border-color: var(--clutch-accent);
      background: rgba(201, 137, 75, 0.1);
    }

    .clutch-home-footer__social svg {
      width: 1rem;
      height: 1rem;
      stroke: var(--clutch-text-dim);
      stroke-width: 1.5;
      fill: none;
      transition: stroke 0.2s;
    }

    .clutch-home-footer__social a:hover svg {
      stroke: var(--clutch-accent);
    }

    .clutch-home-footer__copyright {
      font-size: 0.8125rem;
      color: #6b7a8a;
      text-align: center;
    }

    .clutch-home-footer__payment {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .clutch-home-footer__payment-row {
      display: flex;
      gap: 0.5rem;
    }

    .clutch-home-footer__payment-icon {
      font-size: 0.625rem;
      font-weight: 700;
      letter-spacing: 0.05em;
      color: #6b7a8a;
      padding: 0.25rem 0.5rem;
      background: rgba(255,255,255,0.05);
      border: 1px solid var(--clutch-border);
      border-radius: 4px;
    }
'''

# Replace old footer CSS with new
old_footer_css_start = '    .clutch-footer {'
if old_footer_css_start in content:
    # Find and remove old footer CSS
    css_start = content.find('    .clutch-footer {')
    css_end = content.find('@media (max-width: 900px)', css_start)
    if css_end == -1:
        css_end = content.find('  </style>', css_start)
    
    # Remove old footer CSS and add new
    content = content[:css_start] + footer_css + content[css_end:]
    print("Replaced footer CSS")

# New footer HTML
new_footer_html = '''  <footer class="clutch-home-footer">
    <div class="clutch-home-section__inner">
      <div class="clutch-home-footer__grid">
        <div class="clutch-home-footer__column clutch-home-footer__column--wide">
          <h3 class="clutch-home-footer__heading">Shop by Brand</h3>
          <div class="clutch-home-footer__sublinks">
            <nav class="clutch-home-footer__links">
              <a href="preview-collections.html?vendor=Andis">Andis</a>
              <a href="preview-collections.html?vendor=Babyliss%20Pro">Babyliss Pro</a>
              <a href="preview-collections.html?vendor=JRL">JRL</a>
              <a href="preview-collections.html?vendor=Wahl">Wahl</a>
              <a href="preview-collections.html?vendor=Gamma%20%7C%20Style%20Craft">Gamma | Style Craft</a>
              <a href="preview-collections.html?vendor=Supreme%20Trimmers">Supreme Trimmers</a>
              <a href="preview-collections.html?vendor=Level%203">Level 3</a>
            </nav>
            <nav class="clutch-home-footer__links">
              <a href="preview-collections.html?vendor=Cocco%20Hair%20Pro">Cocco Hair Pro</a>
              <a href="preview-collections.html?vendor=Oster">Oster</a>
              <a href="preview-collections.html?vendor=Tomb45">Tomb45</a>
              <a href="preview-collections.html?vendor=Vincent">Vincent</a>
              <a href="preview-collections.html?vendor=OG%20Walker">OG Walker</a>
              <a href="preview-collections.html?vendor=Smash">Smash</a>
              <a href="preview-collections.html?vendor=Rolda">Rolda</a>
            </nav>
          </div>
        </div>
        
        <div class="clutch-home-footer__column clutch-home-footer__column--wide">
          <h3 class="clutch-home-footer__heading">Shop by Supplies</h3>
          <div class="clutch-home-footer__sublinks">
            <nav class="clutch-home-footer__links">
              <a href="preview-collections.html?category=clippers">Clippers</a>
              <a href="preview-collections.html?category=trimmers">Trimmers</a>
              <a href="preview-collections.html?category=shavers">Shavers</a>
              <a href="preview-collections.html?category=barber-bags-cases">Barber Bags | Cases</a>
              <a href="preview-collections.html?category=lights">Lights</a>
            </nav>
            <nav class="clutch-home-footer__links">
              <a href="preview-collections.html?category=accessories">Accessories</a>
              <a href="preview-collections.html?category=capes">Capes</a>
              <a href="preview-collections.html?category=barber-chairs">Barber Chairs</a>
              <a href="preview-collections.html?category=barber-clothing">Barber Clothing</a>
              <a href="preview-collections.html?category=barber-poles">Barber Poles</a>
            </nav>
          </div>
        </div>
        
        <div class="clutch-home-footer__column">
          <h3 class="clutch-home-footer__heading">Support</h3>
          <nav class="clutch-home-footer__links">
            <a href="preview-classes.html">View All Classes</a>
            <a href="preview-faq.html">FAQ</a>
            <a href="preview-reviews.html">Reviews</a>
            <a href="preview-shipping.html">Shipping</a>
            <a href="preview-returns.html">Return Policy</a>
            <a href="preview-terms.html">Terms & Conditions</a>
            <a href="preview-privacy.html">Privacy Policy</a>
          </nav>
        </div>
        
        <div class="clutch-home-footer__column">
          <h3 class="clutch-home-footer__heading">Contact</h3>
          <nav class="clutch-home-footer__links">
            <a href="preview-contact.html">Reach Out</a>
          </nav>
          <div class="clutch-home-footer__contact-info">
            <p>+1 (214) 677-1059</p>
            <p>viceliatinde20@gmail.com</p>
            <p>113 South Center. Grand Prairie, TX 75050</p>
            <p>Mon - Fri 9am - 6pm.</p>
            <p>Sat. 9am-12pm CST</p>
          </div>
        </div>
      </div>
      
      <div class="clutch-home-footer__bottom">
        <div class="clutch-home-footer__social">
          <a href="https://www.instagram.com/clutchbarbersupply" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
            <svg viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="5" ry="5" stroke="currentColor" fill="none"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
          </a>
          <a href="https://www.facebook.com/clutchbarbersupply" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
            <svg viewBox="0 0 24 24"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
          </a>
          <a href="https://g.page/clutchbarbersupply" target="_blank" rel="noopener noreferrer" aria-label="Google">
            <svg viewBox="0 0 24 24"><text x="12" y="20" text-anchor="middle" font-family="DM Sans, sans-serif" font-size="22" font-weight="700" fill="currentColor">G</text></svg>
          </a>
        </div>
        
        <p class="clutch-home-footer__copyright">© 2026 Clutch Barber Supply. All rights reserved. Website Powered By Straight Point Marketing</p>
        
        <div class="clutch-home-footer__payment">
          <div class="clutch-home-footer__payment-row">
            <span class="clutch-home-footer__payment-icon">AMEX</span>
            <span class="clutch-home-footer__payment-icon">Apple Pay</span>
            <span class="clutch-home-footer__payment-icon">Diners</span>
            <span class="clutch-home-footer__payment-icon">Discover</span>
            <span class="clutch-home-footer__payment-icon">G Pay</span>
          </div>
          <div class="clutch-home-footer__payment-row">
            <span class="clutch-home-footer__payment-icon">MC</span>
            <span class="clutch-home-footer__payment-icon">PayPal</span>
            <span class="clutch-home-footer__payment-icon">Shop Pay</span>
            <span class="clutch-home-footer__payment-icon">UnionPay</span>
            <span class="clutch-home-footer__payment-icon">VISA</span>
          </div>
        </div>
      </div>
    </div>
  </footer>
'''

# Find and replace the old footer HTML
# Look for <footer class="clutch-footer"> and replace until </footer>
if '<footer class="clutch-footer">' in content:
    start = content.find('<footer class="clutch-footer">')
    end = content.find('</footer>', start) + len('</footer>')
    content = content[:start] + new_footer_html + content[end:]
    print("Replaced footer HTML")
elif '<footer' in content:
    # Find any footer tag
    start = content.find('<footer')
    end = content.find('</footer>', start) + len('</footer>')
    content = content[:start] + new_footer_html + content[end:]
    print("Replaced footer HTML")

# Write back
with open('preview-faq.html', 'w') as f:
    f.write(content)

print("\nFAQ footer updated to match homepage!")
