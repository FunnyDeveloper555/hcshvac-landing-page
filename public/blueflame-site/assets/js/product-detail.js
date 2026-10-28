let currentRoleMode = localStorage.getItem('hvac_user_role') || 'consumer';

function showHvacToast(message, type = 'info') {
  let toastContainer = document.querySelector('#hvacToastContainer');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'hvacToastContainer';
    toastContainer.style.cssText = 'position:fixed; bottom:24px; right:24px; z-index:99999; display:flex; flex-direction:column; gap:10px; pointer-events:none; max-width:380px;';
    document.body.appendChild(toastContainer);
  }
  const toast = document.createElement('div');
  const bgColor = type === 'success' ? '#059669' : type === 'warning' ? '#d97706' : '#0284c7';
  toast.style.cssText = `background:${bgColor}; color:#fff; padding:12px 18px; border-radius:8px; box-shadow:0 10px 25px rgba(0,0,0,0.5); font-size:0.85rem; font-weight:600; line-height:1.4; display:flex; align-items:center; gap:10px; transform:translateY(20px); opacity:0; transition:all 0.3s cubic-bezier(0.16, 1, 0.3, 1); pointer-events:auto; border:1px solid rgba(255,255,255,0.2);`;
  toast.innerHTML = `
    <span style="font-size:1.1rem;">${type === 'success' ? '✓' : type === 'warning' ? '⚠️' : 'ℹ️'}</span>
    <div style="flex:1;">${message}</div>
  `;
  toastContainer.appendChild(toast);
  requestAnimationFrame(() => {
    toast.style.transform = 'translateY(0)';
    toast.style.opacity = '1';
  });
  setTimeout(() => {
    toast.style.transform = 'translateY(10px)';
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

function initRoleSwitcher(product) {
  const btnConsumer = document.querySelector('#btnRoleConsumer');
  const btnEmployee = document.querySelector('#btnRoleEmployee');
  const badgeIndicator = document.querySelector('#roleBadgeIndicator');
  const badgeText = document.querySelector('#roleBadgeText');

  function updateRoleUI() {
    if (currentRoleMode === 'employee') {
      if (btnConsumer) btnConsumer.classList.remove('active');
      if (btnEmployee) btnEmployee.classList.add('active');
      if (badgeIndicator) {
        badgeIndicator.className = 'role-mode-badge-indicator mode-employee';
      }
      if (badgeText) {
        badgeText.innerHTML = 'Employee View (Field Tech &bull; Naperville Depot)';
      }
    } else {
      if (btnConsumer) btnConsumer.classList.add('active');
      if (btnEmployee) btnEmployee.classList.remove('active');
      if (badgeIndicator) {
        badgeIndicator.className = 'role-mode-badge-indicator mode-consumer';
      }
      if (badgeText) {
        badgeText.innerHTML = 'Consumer View (Public)';
      }
    }
  }

  updateRoleUI();

  if (btnConsumer) {
    btnConsumer.addEventListener('click', () => {
      if (currentRoleMode === 'consumer') return;
      currentRoleMode = 'consumer';
      localStorage.setItem('hvac_user_role', 'consumer');
      updateRoleUI();
      if (product) {
        renderProductDetail(product);
        renderRelatedProducts(product);
      }
      showHvacToast('Switched to Consumer View: Public spec display active.', 'info');
    });
  }

  if (btnEmployee) {
    btnEmployee.addEventListener('click', () => {
      if (currentRoleMode === 'employee') return;
      currentRoleMode = 'employee';
      localStorage.setItem('hvac_user_role', 'employee');
      updateRoleUI();
      if (product) {
        renderProductDetail(product);
        renderRelatedProducts(product);
      }
      showHvacToast('Switched to Employee View: Internal tech controls & trade pricing unlocked.', 'success');
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get('id') || '9ff1077b-2ec5-48ab-81a8-d42a05c231b8'; 

  const product = HVAC_PRODUCTS.find(p => p.id === productId) || HVAC_PRODUCTS[0];
  initRoleSwitcher(product);
  if (product) {
    renderProductDetail(product);
    renderRelatedProducts(product);
  }

  initQuoteModal();
  initReviewSubmission(product);
});

function getProductEditorial(p) {
  const brand = p.brand || 'Best Comfort OEM';
  const name = p.name;
  const cat = p.category;
  const eff = p.efficiency || 'High Efficiency Spec';

  let shortDesc = '';
  let keyBadges = [];
  let articleHtml = '';

  if (cat === 'systems' || name.toLowerCase().includes('condenser') || name.toLowerCase().includes('boiler') || name.toLowerCase().includes('furnace')) {
    shortDesc = `${brand} ${name} is an American-engineered, heavy-duty climate system designed specifically for the extreme temperature swings of the Chicago metropolitan area. Featuring advanced multi-stage modulation, whisper-quiet operation, and rugged internal metallurgy, this unit delivers uncompromised indoor comfort while dramatically lowering annual ComEd electric and Nicor Gas heating utility bills.`;
    keyBadges = [
      '✓ AHRI & Energy Star Certified',
      '✓ Chicago Sub-Zero & 95°F+ Tested',
      '✓ 10-Year Unit Replacement Warranty',
      '✓ ComEd / Nicor Rebate Eligible'
    ];
    articleHtml = `
      <div class="article-section" style="margin-bottom: 28px;">
        <h3 style="color: #fff; font-size: 1.3rem; margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
          <svg class="svg-icon" style="color: var(--rich-blue-electric);"><use href="#icon-bolt"></use></svg>
          1. Advanced Engineering &amp; Mechanical Architecture
        </h3>
        <p>
          The <strong>${brand} ${name}</strong> incorporates industrial-grade metallurgy and precision manufacturing designed to exceed standard residential durability benchmarks. At its core, the system utilizes high-efficiency staging and optimized internal heat transfer surfaces that maximize thermal conductivity while minimizing parasitic electrical draw. Heavy-gauge galvanized steel cabinet panels with baked-on polyurethane powder coating protect internal components against salt, snow, acid rain, and road dust common across Will and Cook counties.
        </p>
        <p>
          Internal acoustics are addressed through isolated compressor mounting grommets and an aerodynamic fan cowl that smooths airflow turbulence. This reduces operating decibels down to whisper-quiet levels, ensuring peaceful indoor and outdoor environments even during continuous peak-load operation.
        </p>
      </div>

      <div class="article-section" style="margin-bottom: 28px;">
        <h3 style="color: #fff; font-size: 1.3rem; margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
          <svg class="svg-icon" style="color: var(--electric-salmon);"><use href="#icon-snowflake"></use></svg>
          2. Engineered for Chicago's Extreme Climate Volatility
        </h3>
        <p>
          Chicagoland experiences one of North America's most demanding heating and cooling environments&mdash;ranging from -20&deg;F polar vortex deep freezes to 95&deg;F+ high-humidity summer heatwaves off Lake Michigan. Standard baseline HVAC equipment frequently struggles with frozen evaporator coils, high compressor head pressure, or heat exchanger thermal fatigue.
        </p>
        <div style="background: rgba(8, 15, 33, 0.7); border-left: 4px solid var(--electric-salmon); padding: 16px 20px; border-radius: 0 8px 8px 0; margin: 16px 0;">
          <strong style="color: #fff; display: block; margin-bottom: 4px;">Certified Cold-Climate &amp; Humidity Testing:</strong>
          <span style="color: var(--text-light); font-size: 0.92rem;">
            The ${name} is factory-calibrated with expanded operating envelopes, high/low pressure safety cutoffs, and crankcase heater integration to ensure seamless ignition and instantaneous refrigeration cycling without oil sludging or liquid refrigerant migration.
          </span>
        </div>
      </div>

      <div class="article-section" style="margin-bottom: 28px;">
        <h3 style="color: #fff; font-size: 1.3rem; margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
          <svg class="svg-icon" style="color: #34d399;"><use href="#icon-dollar"></use></svg>
          3. Real-World Efficiency, Operating Costs &amp; ROI Analysis
        </h3>
        <p>
          Operating with verified efficiency ratings (${eff}), upgrading to the ${brand} ${name} yields tangible monthly savings for homeowners currently operating 10 to 15-year-old baseline equipment. By dynamically matching output capacity to instantaneous home load requirements rather than cycling abruptly on and off, the unit prevents massive electrical inrush spikes and unnecessary fuel waste.
        </p>
        <p>
          On an average 2,400 sq. ft. Northern Illinois home, this efficiency leap translates to an estimated <strong>$450 to $780 in annual utility bill reductions</strong>. Combined with Illinois Clean Energy incentives, ComEd rebates, and Federal Inflation Reduction Act (IRA) Section 25C tax credits, homeowners typically achieve full system investment payback within 3.5 to 5 years.
        </p>
      </div>

      <div class="article-section" style="margin-bottom: 28px;">
        <h3 style="color: #fff; font-size: 1.3rem; margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
          <svg class="svg-icon" style="color: var(--rich-blue-electric);"><use href="#icon-tools"></use></svg>
          4. Best Comfort Precision Installation &amp; Diagnostic Protocol
        </h3>
        <p>
          Even the highest-rated HVAC equipment will fail prematurely if installed improperly. Best Comfort Heating &amp; Cooling adheres to strict ACCA Manual J load calculation guidelines and SMACNA static pressure standards during every installation:
        </p>
        <ul style="list-style: none; padding: 0; margin: 12px 0; display: flex; flex-direction: column; gap: 8px;">
          <li style="display: flex; gap: 10px; align-items: flex-start;">
            <span style="color: #34d399; font-weight: bold;">✓</span>
            <span><strong>Nitrogen Purge &amp; Deep Vacuum:</strong> Refrigerant lines are brazed under dry nitrogen flow and evacuated to below 350 microns to guarantee zero moisture contamination.</span>
          </li>
          <li style="display: flex; gap: 10px; align-items: flex-start;">
            <span style="color: #34d399; font-weight: bold;">✓</span>
            <span><strong>Digital Manifold Subcooling/Superheat Charging:</strong> Precision weigh-in and live thermodynamic verification to within 0.1 oz of OEM factory specs.</span>
          </li>
          <li style="display: flex; gap: 10px; align-items: flex-start;">
            <span style="color: #34d399; font-weight: bold;">✓</span>
            <span><strong>Duct Static Pressure &amp; Combustion Safety Testing:</strong> Verification of external static pressure, draft pressure, and zero carbon monoxide leakage.</span>
          </li>
        </ul>
      </div>

      <div class="article-section">
        <h3 style="color: #fff; font-size: 1.3rem; margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
          <svg class="svg-icon" style="color: var(--vibrant-pink);"><use href="#icon-shield"></use></svg>
          5. Homeowner Maintenance &amp; 10-Year Warranty Preservation
        </h3>
        <p>
          To maintain the 10-Year Factory Parts and Labor Limited Warranty, annual professional maintenance is required by the manufacturer. Homeowners should replace primary air filters every 60 to 90 days during peak seasons and maintain a 24-inch clear perimeter around exterior condenser units to prevent restricted airflow. Schedule your pre-season Spring AC or Autumn Heating Tune-Up with Best Comfort to enjoy guaranteed priority service and uninterrupted comfort.
        </p>
      </div>
    `;
  } else if (cat === 'filters' || name.toLowerCase().includes('filter')) {
    shortDesc = `${brand} ${name} features commercial-grade pleated synthetic media electrostatically charged to capture up to 98% of airborne dust, pollen, pet dander, mold spores, and smoke particles. Designed for high-velocity residential and light-commercial furnace blowers, it ensures superior indoor air purity without starving your HVAC system of essential airflow.`;
    keyBadges = [
      '✓ Commercial-Grade Pleated Media',
      '✓ Captures 98% of Airborne Allergens',
      '✓ Low Static Pressure Drop Design',
      '✓ 60-90 Day High-Capacity Lifespan'
    ];
    articleHtml = `
      <div class="article-section" style="margin-bottom: 28px;">
        <h3 style="color: #fff; font-size: 1.3rem; margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
          <svg class="svg-icon" style="color: var(--rich-blue-electric);"><use href="#icon-sparkles"></use></svg>
          1. Filtration Science &amp; Electrostatic Particulate Capture
        </h3>
        <p>
          The <strong>${name}</strong> uses progressive-density synthetic fibers woven with a continuous electrostatic charge. Unlike cheap fiberglass mesh filters that only stop large debris like hair and carpet fibers, this filter captures microscopic contaminants down to 0.3 microns&mdash;including pollen allergens, dust mite waste, bacteria nuclei, and respiratory droplets.
        </p>
      </div>

      <div class="article-section" style="margin-bottom: 28px;">
        <h3 style="color: #fff; font-size: 1.3rem; margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
          <svg class="svg-icon" style="color: #34d399;"><use href="#icon-bolt"></use></svg>
          2. Low Resistance Airflow &amp; Blower Motor Protection
        </h3>
        <p>
          Many homeowners mistakenly purchase dense retail store filters that severely restrict blower airflow, causing evaporator coils to freeze in summer and high-limit switches to trip furnaces in winter. The ${brand} filter is engineered with expanded diamond wire backing and deep V-pleats, maximizing effective surface area to maintain optimum CFM air velocity across your heat exchanger.
        </p>
      </div>

      <div class="article-section">
        <h3 style="color: #fff; font-size: 1.3rem; margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
          <svg class="svg-icon" style="color: var(--electric-salmon);"><use href="#icon-calendar"></use></svg>
          3. Recommended Replacement Schedule for Chicago Homes
        </h3>
        <p>
          During active Chicago winter heating (November through March) and summer cooling (June through August), inspect filters every 30 days. For homes with pets, indoor plants, or family members with asthma or allergies, replace every 60 days to preserve peak indoor air hygiene and maintain lower energy consumption.
        </p>
      </div>
    `;
  } else if (cat === 'thermostats' || name.toLowerCase().includes('thermostat')) {
    shortDesc = `${brand} ${name} delivers precision climate automation, intuitive touchscreen control, and full WiFi smartphone access. Compatible with single and multi-stage heating/cooling systems, it automatically optimizes heating schedules around your lifestyle to reduce wasted energy while qualifying for instant ComEd and Nicor smart thermostat rebates.`;
    keyBadges = [
      '✓ WiFi Remote Phone Control & Scheduling',
      '✓ Multi-Stage Heat & Cool Automation',
      '✓ ComEd Instant Rebate Eligible',
      '✓ 7-Day Energy Saving Algorithms'
    ];
    articleHtml = `
      <div class="article-section" style="margin-bottom: 28px;">
        <h3 style="color: #fff; font-size: 1.3rem; margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
          <svg class="svg-icon" style="color: var(--rich-blue-electric);"><use href="#icon-smartphone"></use></svg>
          1. Intelligent Temperature Modulation &amp; Humidity Logic
        </h3>
        <p>
          The <strong>${name}</strong> replaces outdated mercury and rudimentary digital bimetal thermostats with microprocessor-controlled thermal sensors accurate to within 0.5&deg;F. It actively communicates with your furnace, air conditioner, or heat pump to modulate cycle run-times, preventing wasteful rapid short-cycling and temperature overshoot.
        </p>
      </div>

      <div class="article-section" style="margin-bottom: 28px;">
        <h3 style="color: #fff; font-size: 1.3rem; margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
          <svg class="svg-icon" style="color: #34d399;"><use href="#icon-dollar"></use></svg>
          2. Energy Savings &amp; Instant Illinois Utility Rebates
        </h3>
        <p>
          Studies by the EPA Energy Star program show smart communicating thermostats save average Illinois households 10% to 12% on heating and up to 15% on cooling costs&mdash;representing roughly $180 to $240 annually. Best Comfort assists homeowners in claiming direct ComEd and Nicor Gas rebates at the time of installation.
        </p>
      </div>

      <div class="article-section">
        <h3 style="color: #fff; font-size: 1.3rem; margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
          <svg class="svg-icon" style="color: var(--vibrant-pink);"><use href="#icon-tools"></use></svg>
          3. C-Wire Compatibility &amp; Professional Installation
        </h3>
        <p>
          Reliable WiFi thermostats require a dedicated common 24V C-wire for constant power. Our licensed technicians verify your low-voltage control transformer and control board wiring, ensuring clean wall mounting, firmware updates, and app synchronization on your Apple iOS or Android device.
        </p>
      </div>
    `;
  } else {
    
    shortDesc = `Genuine factory-certified ${name} manufactured by ${brand}. Engineered to strict OEM specifications to restore original operating efficiency, electrical safety, and system longevity for residential and light-commercial HVAC units across the Chicago metro area.`;
    keyBadges = [
      '✓ 100% Genuine OEM Certified Component',
      '✓ Exact Factory Fit &amp; Electrical Tolerance',
      '✓ Rigorously Lab Tested for 100,000+ Cycles',
      '✓ Best Comfort Technician Installation Ready'
    ];
    articleHtml = `
      <div class="article-section" style="margin-bottom: 28px;">
        <h3 style="color: #fff; font-size: 1.3rem; margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
          <svg class="svg-icon" style="color: var(--rich-blue-electric);"><use href="#icon-tools"></use></svg>
          1. OEM Certification &amp; Critical Equipment Protection
        </h3>
        <p>
          The <strong>${name}</strong> meets exact factory metallurgical, thermal, and electrical specifications. Installing generic aftermarket replacement components can cause premature motor burnout, electrical shorts, or void existing manufacturer warranties. This genuine ${brand} part ensures factory-spec amperage draw, correct dielectric strength, and seamless compatibility with your primary HVAC system.
        </p>
      </div>

      <div class="article-section" style="margin-bottom: 28px;">
        <h3 style="color: #fff; font-size: 1.3rem; margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
          <svg class="svg-icon" style="color: var(--electric-salmon);"><use href="#icon-shield"></use></svg>
          2. Diagnostic Symptoms Indicating Replacement Is Needed
        </h3>
        <p>
          Common warning signs that require inspecting or replacing this component include: unusual humming or clicking sounds upon system startup, intermittent furnace ignition lockouts, frequent circuit breaker trips, reduced airflow velocity, or elevated compressor operating temperatures.
        </p>
      </div>

      <div class="article-section">
        <h3 style="color: #fff; font-size: 1.3rem; margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
          <svg class="svg-icon" style="color: #34d399;"><use href="#icon-clock"></use></svg>
          3. Immediate Chicago Van Dispatch &amp; Stock Availability
        </h3>
        <p>
          Best Comfort maintains fully stocked service vans throughout Joliet, Naperville, Orland Park, and Cook/Will counties carrying genuine OEM replacement components. Our technicians perform multimeter diagnostics, verify microfarad ratings and electrical ground isolation, and replace faulty parts on the spot during a single service visit.
        </p>
      </div>
    `;
  }

  return { shortDesc, keyBadges, articleHtml };
}

function renderProductDetail(product) {
  
  document.title = `${product.name} | Best Comfort Chicago`;
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) {
    metaDesc.content = `Inspect specifications, pricing, ratings and reviews for ${product.brand} ${product.name}. Certified Chicago HVAC installation and warranty.`;
  }

  const breadcrumbCat = document.querySelector('#detailBreadcrumbCat');
  const breadcrumbName = document.querySelector('#detailBreadcrumbName');
  if (breadcrumbCat) breadcrumbCat.textContent = product.originalCategory;
  if (breadcrumbName) breadcrumbName.textContent = product.name;

  const titleEl = document.querySelector('#detailProductTitle');
  const brandEl = document.querySelector('#detailProductBrand');
  const effBadge = document.querySelector('#detailEfficiencyBadge');
  const quoteBtn = document.querySelector('#btnDetailQuote');

  if (titleEl) titleEl.textContent = product.name;
  if (brandEl) brandEl.textContent = product.brand;
  if (effBadge) effBadge.textContent = product.efficiency;
  if (quoteBtn) quoteBtn.setAttribute('data-product-name', `${product.brand} - ${product.name}`);

  const editorial = getProductEditorial(product);
  const shortDescEl = document.querySelector('#detailShortDesc');
  const keyBadgesRow = document.querySelector('#detailKeyBadgesRow');
  const articleTitleEl = document.querySelector('#articleProductTitle');
  const articleBodyEl = document.querySelector('#articleDynamicContent');

  if (shortDescEl) shortDescEl.textContent = editorial.shortDesc;
  if (keyBadgesRow && editorial.keyBadges) {
    keyBadgesRow.innerHTML = editorial.keyBadges.map(b => `
      <span class="badge-pill badge-blue" style="font-size: 0.75rem; padding: 4px 10px; background: rgba(0, 212, 255, 0.12); border: 1px solid rgba(0, 212, 255, 0.3); color: #fff; display: inline-flex; align-items: center;">
        ${b}
      </span>
    `).join('');
  }
  if (articleTitleEl) {
    articleTitleEl.innerHTML = `${product.brand} ${product.name} &mdash; Engineering &amp; Chicago Climate Performance Guide`;
  }
  if (articleBodyEl) {
    articleBodyEl.innerHTML = editorial.articleHtml;
  }

  const primaryImg = document.querySelector('#primaryProductImg');
  const viewStatusBadge = document.querySelector('#currentViewStatus');
  const thumbContainer = document.querySelector('#showcaseThumbnailsRow');

  if (primaryImg && product.thumbnails.length > 0) {
    primaryImg.src = product.thumbnails[0].img;
    primaryImg.alt = product.name;
    primaryImg.onerror = function() {
      this.onerror = null;
      this.src = '/__l5e/assets-v1/c7ae305d-1ec2-4d0f-adad-7b658902247c/blueflame-ac-main.svg';
    };
  }

  if (viewStatusBadge && product.thumbnails.length > 0) {
    viewStatusBadge.innerHTML = `<svg class="svg-icon"><use href="#icon-eye"></use></svg> View: ${product.thumbnails[0].label} &bull; <span style="color:#fff; font-weight:normal; margin-left:4px;">${product.thumbnails[0].caption}</span>`;
  }

  if (thumbContainer && product.thumbnails.length > 0) {
    thumbContainer.innerHTML = product.thumbnails.map((t, idx) => `
      <button type="button" class="thumbnail-box ${idx === 0 ? 'active' : ''}" data-img-src="${t.img}" data-view-label="${t.label}" data-caption="${t.caption}">
        <img src="${t.img}" alt="${t.label}" onerror="this.src='/__l5e/assets-v1/9d4c3d32-b45d-4a36-8abf-a181f665edca/blueflame-furnace-main.svg';" />
        <span class="thumbnail-caption">${t.label}</span>
      </button>
    `).join('');

    thumbContainer.querySelectorAll('.thumbnail-box').forEach((thumb, idx) => {
      thumb.addEventListener('click', () => {
        thumbContainer.querySelectorAll('.thumbnail-box').forEach(t => t.classList.remove('active'));
        thumb.classList.add('active');

        const targetSrc = thumb.getAttribute('data-img-src');
        const viewLabel = thumb.getAttribute('data-view-label') || `Angle ${idx + 1}`;
        const captionText = thumb.getAttribute('data-caption') || '';

        if (primaryImg) {
          primaryImg.style.opacity = '0';
          primaryImg.style.transform = 'scale(0.97)';
          setTimeout(() => {
            primaryImg.src = targetSrc;
            primaryImg.alt = `${viewLabel} - ${captionText}`;
            primaryImg.style.opacity = '1';
            primaryImg.style.transform = 'scale(1)';
          }, 160);
        }

        if (viewStatusBadge) {
          viewStatusBadge.innerHTML = `<svg class="svg-icon"><use href="#icon-eye"></use></svg> View: ${viewLabel} &bull; <span style="color:#fff; font-weight:normal; margin-left:4px;">${captionText}</span>`;
        }
      });
    });
  }

  // Inject Discontinued Stamps on Primary Image Box
  const imageBox = document.querySelector('#primaryImageBox');
  if (imageBox) {
    const oldStamp = imageBox.querySelector('.stamp-overlay-wrapper');
    if (oldStamp) oldStamp.remove();
    if (product.isDiscontinued) {
      const stampEl = document.createElement('div');
      stampEl.className = 'stamp-overlay-wrapper';
      stampEl.innerHTML = `
        <div class="stamp-badge-red">Discontinued</div>
        ${product.discontinuedType === 'alternative' ? '<div class="stamp-badge-alt-green">SEE Alternative Replacement</div>' : ''}
      `;
      imageBox.appendChild(stampEl);
    }
  }

  // Inject Alternative Item Banner
  const oldAltBanner = document.querySelector('#detailAltBanner');
  if (oldAltBanner) oldAltBanner.remove();
  if (product.isDiscontinued && product.alternativeItemNumber) {
    const altBanner = document.createElement('div');
    altBanner.id = 'detailAltBanner';
    altBanner.className = 'card-alt-item-banner';
    altBanner.style.cssText = 'margin-top:14px; border-radius:6px; padding:10px 16px; font-size:0.85rem; cursor:pointer;';
    altBanner.innerHTML = `
      <svg class="svg-icon" style="width:16px; height:16px; color:#38bdf8;"><use href="#icon-arrow-right"></use></svg>
      <span>Alternative ITEM NUMBER: <strong>${product.alternativeItemNumber}</strong> (Click to view replacement)</span>
    `;
    altBanner.addEventListener('click', () => {
      if (product.alternativeProductId) {
        window.location.href = `product-detail.html?id=${encodeURIComponent(product.alternativeProductId)}`;
      } else {
        showHvacToast('Redirecting to alternative replacement specifications...', 'info');
      }
    });
    const showcaseCont = document.querySelector('.primary-image-container');
    if (showcaseCont) showcaseCont.appendChild(altBanner);
  }

  const ratingStarsEl = document.querySelector('#detailRatingStars');
  const ratingCountEl = document.querySelector('#detailRatingCount');
  if (ratingStarsEl) {
    ratingStarsEl.innerHTML = generateStarHtml(product.avgRating);
  }
  if (ratingCountEl) {
    ratingCountEl.innerHTML = `<strong>${product.avgRating.toFixed(1)}</strong> (${product.reviewCount} verified reviews &bull; <a href="#customerReviewsSection" style="color:var(--rich-blue-electric); text-decoration:underline;">Vote / Review &darr;</a>)`;
  }

  const spotTextEl = document.querySelector('#detailSpotText');
  if (spotTextEl) spotTextEl.textContent = product.spot_text || product.placeholders.TextPlaceHolder1;

  const p1 = document.querySelector('#textPlaceHolder1');
  const p2 = document.querySelector('#textPlaceHolder2');
  const p3 = document.querySelector('#textPlaceHolder3');
  const p4 = document.querySelector('#textPlaceHolder4');

  if (p1) p1.textContent = product.placeholders.TextPlaceHolder1;
  if (p2) p2.textContent = product.placeholders.TextPlaceHolder2;
  if (p3) p3.textContent = product.placeholders.TextPlaceHolder3;
  if (p4) p4.textContent = product.placeholders.TextPlaceHolder4;

  const variantContainer = document.querySelector('#detailVariantsBox');
  if (variantContainer) {
    if (product.variants && product.variants.length > 0) {
      let optionsHtml = product.variants.map((v, idx) => `
        <button type="button" class="btn-variant-select ${idx === 0 ? 'active' : ''}" data-sku="${v.sku}" data-price="${v.price}" style="padding: 8px 14px; margin: 4px; border: 1px solid ${idx === 0 ? 'var(--rich-blue-electric)' : 'rgba(255,255,255,0.2)'}; border-radius: 6px; background: ${idx === 0 ? 'rgba(0,212,255,0.15)' : 'rgba(14,30,64,0.6)'}; color: #fff; font-size: 0.85rem; cursor: pointer; transition: all 0.2s;">
          <strong>${v.name}</strong> - $${Number(v.price).toFixed(2)}
        </button>
      `).join('');

      let headerPriceHtml = '';
      if (currentRoleMode === 'employee') {
        headerPriceHtml = `<span id="detailLivePrice" style="font-size:1.4rem; font-weight:900; color:#34d399;">$${Number(product.variants[0].price).toFixed(2)} <span style="font-size:0.75rem; color:#38bdf8; font-weight:700;">(Tech Cost)</span></span>`;
      } else {
        if (product.isDiscontinued) {
          headerPriceHtml = `<span id="detailLivePrice" style="font-size:1.4rem; font-weight:900; color:var(--rich-blue-electric);">From <span style="text-decoration:line-through; opacity:0.65; color:#94a3b8;">$${Number(product.variants[0].price).toFixed(2)}</span></span>`;
        } else {
          headerPriceHtml = `<span id="detailLivePrice" style="font-size:1.4rem; font-weight:900; color:var(--rich-blue-electric);">$${Number(product.variants[0].price).toFixed(2)}</span>`;
        }
      }

      variantContainer.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; margin-bottom:8px;">
          <span style="font-size:0.88rem; font-weight:700; color:#fff;">Select Model / Size Variant:</span>
          ${headerPriceHtml}
        </div>
        <div style="display:flex; flex-wrap:wrap; gap:6px;">
          ${optionsHtml}
        </div>
        <div style="margin-top:8px; font-size:0.8rem; color:var(--text-muted);" id="detailVariantSku">
          Selected SKU: <strong style="color:#fff;">${product.variants[0].sku}</strong> &bull; Status: <span style="color:#34d399; font-weight:600;">${product.variants[0].stock_status || 'In Stock'}</span>
        </div>
      `;
      variantContainer.style.display = 'block';

      variantContainer.querySelectorAll('.btn-variant-select').forEach(vBtn => {
        vBtn.addEventListener('click', () => {
          variantContainer.querySelectorAll('.btn-variant-select').forEach(b => {
            b.style.borderColor = 'rgba(255,255,255,0.2)';
            b.style.background = 'rgba(14,30,64,0.6)';
          });
          vBtn.style.borderColor = 'var(--rich-blue-electric)';
          vBtn.style.background = 'rgba(0,212,255,0.15)';

          const priceVal = vBtn.getAttribute('data-price');
          const skuVal = vBtn.getAttribute('data-sku');
          const priceDisplay = document.querySelector('#detailLivePrice');
          const skuDisplay = document.querySelector('#detailVariantSku');

          if (priceDisplay) {
            if (currentRoleMode === 'employee') {
              priceDisplay.innerHTML = `$${Number(priceVal).toFixed(2)} <span style="font-size:0.75rem; color:#38bdf8; font-weight:700;">(Tech Cost)</span>`;
            } else if (product.isDiscontinued) {
              priceDisplay.innerHTML = `From <span style="text-decoration:line-through; opacity:0.65; color:#94a3b8;">$${Number(priceVal).toFixed(2)}</span>`;
            } else {
              priceDisplay.textContent = '$' + Number(priceVal).toFixed(2);
            }
          }
          if (skuDisplay) {
            skuDisplay.innerHTML = `Selected SKU: <strong style="color:#fff;">${skuVal}</strong> &bull; Status: <span style="color:#34d399; font-weight:600;">In Stock</span>`;
          }
          if (quoteBtn) {
            quoteBtn.setAttribute('data-product-name', `${product.brand} - ${product.name} (${skuVal})`);
          }
        });
      });
    } else {
      if (product.price_from) {
        let priceHtml = '';
        if (currentRoleMode === 'employee') {
          priceHtml = `<span style="font-size:1.4rem; font-weight:900; color:#34d399;">$${Number(product.price_from).toFixed(2)} <span style="font-size:0.75rem; color:#38bdf8; font-weight:700;">(Tech Cost)</span></span>`;
        } else {
          if (product.isDiscontinued) {
            priceHtml = `<span style="font-size:1.4rem; font-weight:900; color:var(--rich-blue-electric);">From <span style="text-decoration:line-through; opacity:0.65; color:#94a3b8;">$${Number(product.price_from).toFixed(2)}</span></span>`;
          } else {
            priceHtml = `<span style="font-size:1.4rem; font-weight:900; color:var(--rich-blue-electric);">$${Number(product.price_from).toFixed(2)}</span>`;
          }
        }
        variantContainer.innerHTML = `
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <span style="font-size:0.88rem; font-weight:700; color:#fff;">${currentRoleMode === 'employee' ? 'Technician Wholesale Price:' : 'Reference Unit Price:'}</span>
            ${priceHtml}
          </div>
        `;
        variantContainer.style.display = 'block';
      } else {
        variantContainer.innerHTML = `
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <span style="font-size:0.88rem; font-weight:700; color:#fff;">Pricing:</span>
            <span style="font-size:1.1rem; font-weight:800; color:var(--electric-salmon);">Request Custom Quote</span>
          </div>
        `;
        variantContainer.style.display = 'block';
      }
    }
  }

  // Update Action Bar according to currentRoleMode
  const actionBar = document.querySelector('.product-action-bar');
  if (actionBar) {
    if (currentRoleMode === 'consumer') {
      if (product.isDiscontinued) {
        actionBar.innerHTML = `
          <button type="button" class="btn btn-salmon btn-request-quote" id="btnDetailQuote" data-product-name="${product.brand} - ${product.name} (Discontinued Alternative Ingestion)">
            <svg class="svg-icon"><use href="#icon-tools"></use></svg> Request Discontinued Part Spec &amp; Diagnostic
          </button>
          <a href="tel:8155560660" class="btn btn-urgent-dispatch" style="padding:10px 16px; border-radius:6px; font-size:0.85rem; text-decoration:none;">
            <svg class="svg-icon" style="width:16px; height:16px;"><use href="#icon-phone"></use></svg>
            24/7 URGENT DISPATCH (815) 556-0660
          </a>
        `;
      } else {
        actionBar.innerHTML = `
          <button type="button" class="btn btn-salmon btn-request-quote" id="btnDetailQuote" data-product-name="${product.brand} - ${product.name}">
            <svg class="svg-icon"><use href="#icon-dollar"></use></svg> Request Instant Price &amp; Rebate Quote
          </button>
          <a href="contact.html" class="btn btn-outline">
            <svg class="svg-icon"><use href="#icon-calendar"></use></svg> Schedule In-Home Assessment
          </a>
        `;
      }
    } else {
      actionBar.innerHTML = `
        <button type="button" class="btn btn-salmon btn-request-quote" id="btnDetailQuote" data-product-name="${product.brand} - ${product.name}">
          <svg class="svg-icon"><use href="#icon-phone"></use></svg> Send Customer Quote
        </button>
        <button type="button" class="btn btn-emp-cart-detail" style="background:#0284c7; color:#fff; font-weight:800; border:none; padding:10px 16px; border-radius:6px; font-size:0.85rem; cursor:pointer;" data-name="${product.name}">
          <svg class="svg-icon" style="width:14px; height:14px;"><use href="#icon-cart"></use></svg> Add to Truck Stock Requisition
        </button>
      `;
      const cartBtn = actionBar.querySelector('.btn-emp-cart-detail');
      if (cartBtn) {
        cartBtn.addEventListener('click', () => {
          const wo = 'WO-' + Math.floor(100000 + Math.random() * 900000);
          showHvacToast(`Added "${product.name}" to Truck Stock requisition (${wo})!`, 'success');
        });
      }
    }

    const dynamicQuoteBtn = actionBar.querySelector('#btnDetailQuote');
    if (dynamicQuoteBtn) {
      dynamicQuoteBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const pName = dynamicQuoteBtn.getAttribute('data-product-name') || `${product.brand} - ${product.name}`;
        const modal = document.querySelector('#quoteModal');
        const modalProductName = document.querySelector('#modalProductName');
        const modalProductField = document.querySelector('#modalProductField');
        if (modalProductName) modalProductName.textContent = pName;
        if (modalProductField) modalProductField.value = pName;
        if (modal) {
          modal.classList.add('active');
          document.body.style.overflow = 'hidden';
        }
      });
    }
  }

  // Render Employee Control Panel if in employee mode
  let detailEmpPanel = document.querySelector('#detailEmployeeControlPanel');
  if (detailEmpPanel) detailEmpPanel.remove();

  if (currentRoleMode === 'employee') {
    detailEmpPanel = document.createElement('div');
    detailEmpPanel.id = 'detailEmployeeControlPanel';
    detailEmpPanel.className = 'employee-ctrl-panel';
    detailEmpPanel.style.marginTop = '16px';
    detailEmpPanel.innerHTML = `
      <div class="panel-title">
        <span>Field Tech Internal Work Order Control</span>
        <span style="color:#10b981; font-weight:700;">● Naperville Depot Active</span>
      </div>
      <div class="employee-row-item">
        <span class="label">Part Only Installed:</span>
        <span class="value" style="font-size:1.1rem; font-weight:900; color:#38bdf8;">$${(product.installedPrice || 505.00).toFixed(2)}</span>
      </div>
      <div class="employee-row-item">
        <span class="label">Special Order:</span>
        <span class="value" style="color:${product.specialOrder ? '#f59e0b' : '#10b981'}; font-weight:800;">${product.specialOrder ? 'Yes (Special Order 1-2 Days)' : 'No (In Truck Stock)'}</span>
      </div>
      <div class="employee-vendors">
        <span class="vendor-label">Vendor / Supplier Availability:</span>
        <div class="vendor-links-list">
          ${(product.vendors && product.vendors.length > 0) ? product.vendors.map(v => `
            <div style="margin-bottom:4px; display:flex; justify-content:space-between; align-items:center;">
              <a href="${v.mapLink || '#'}" target="_blank" rel="noopener" class="vendor-link" style="color:#67e8f9; text-decoration:underline; font-weight:700;">${v.name}</a>
              <span style="color:#94a3b8; font-size:0.75rem;">Stock: <strong style="color:#fff;">${v.stock}</strong> &bull; ${v.phone}</span>
            </div>
          `).join('') : `
            <div style="margin-bottom:4px; display:flex; justify-content:space-between; align-items:center;">
              <a href="https://maps.google.com/?q=Ferguson+Naperville+IL" target="_blank" rel="noopener" class="vendor-link" style="color:#67e8f9; text-decoration:underline; font-weight:700;">Ferguson Naperville</a>
              <span style="color:#94a3b8; font-size:0.75rem;">Stock: <strong style="color:#fff;">4 Avail</strong> &bull; (630) 555-0199</span>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <a href="https://maps.google.com/?q=Johnstone+Supply+Naperville+IL" target="_blank" rel="noopener" class="vendor-link" style="color:#67e8f9; text-decoration:underline; font-weight:700;">Johnstone Supply Naperville/Joliet</a>
              <span style="color:#94a3b8; font-size:0.75rem;">Stock: <strong style="color:#fff;">2 Avail</strong> &bull; (815) 555-0144</span>
            </div>
          `}
        </div>
      </div>
      <div class="employee-action-row">
        <button type="button" class="btn-emp btn-emp-modify" data-id="${product.id}">Modify Price</button>
        <button type="button" class="btn-emp btn-emp-quote" data-id="${product.id}" data-name="${product.name}">Send Quote</button>
        <button type="button" class="btn-emp btn-emp-cart" data-id="${product.id}" data-name="${product.name}">Add To Cart</button>
      </div>
      <div class="employee-modify-box" id="detailEmpModifyBox-${product.id}">
        <div class="modify-input-group">
          <label style="font-size:0.75rem; color:#94a3b8; align-self:center;">Modify Our Price: $</label>
          <input type="number" step="0.01" class="emp-price-input" id="detailEmpPriceInput-${product.id}" value="${(product.price_from || 149.99).toFixed(2)}">
          <button type="button" class="btn-save-modify" data-id="${product.id}">Save</button>
        </div>
      </div>
      <div class="employee-flags-row" style="margin-top:8px;">
        <div class="flag-badge ${product.isDiscontinued ? '' : 'flag-inactive'}" data-flag="discontinued" data-id="${product.id}" style="cursor:pointer;" title="Click to toggle Discontinued flag">
          <span>Flag: DISCONTINUED</span>
          <span style="font-size:0.65rem; opacity:0.85;">${product.isDiscontinued ? 'ACTIVE' : 'OFF'}</span>
        </div>
        ${(product.discontinuedType === 'alternative' || product.alternativeItemNumber) ? `
          <div class="flag-badge flag-alt" data-flag="alt" data-id="${product.id}" style="cursor:pointer;" title="Click to toggle Alternative flag">
            <span>Flag: DISCONTINUED (See ALT)</span>
            <span style="font-size:0.65rem; opacity:0.85;">#${product.alternativeItemNumber || '123ABC456'}</span>
          </div>
        ` : ''}
      </div>
    `;
    if (actionBar && actionBar.parentNode) {
      actionBar.parentNode.insertBefore(detailEmpPanel, actionBar.nextSibling);
    }

    const modifyBtn = detailEmpPanel.querySelector('.btn-emp-modify');
    const modifyBox = detailEmpPanel.querySelector(`#detailEmpModifyBox-${product.id}`);
    if (modifyBtn && modifyBox) {
      modifyBtn.addEventListener('click', () => modifyBox.classList.toggle('active'));
    }

    const saveBtn = detailEmpPanel.querySelector('.btn-save-modify');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        const input = detailEmpPanel.querySelector(`#detailEmpPriceInput-${product.id}`);
        if (input) {
          const pVal = parseFloat(input.value);
          if (!isNaN(pVal) && pVal > 0) {
            product.price_from = pVal;
            showHvacToast(`Price updated to $${pVal.toFixed(2)}`, 'success');
            renderProductDetail(product);
          }
        }
      });
    }

    const cartBtn = detailEmpPanel.querySelector('.btn-emp-cart');
    if (cartBtn) {
      cartBtn.addEventListener('click', () => {
        const wo = 'WO-' + Math.floor(100000 + Math.random() * 900000);
        showHvacToast(`Added "${product.name}" to Truck Stock requisition (${wo})!`, 'success');
      });
    }

    const quoteBtn = detailEmpPanel.querySelector('.btn-emp-quote');
    if (quoteBtn) {
      quoteBtn.addEventListener('click', () => {
        const modal = document.querySelector('#quoteModal');
        const modalProd = document.querySelector('#modalProductName');
        const modalField = document.querySelector('#modalProductField');
        if (modalProd) modalProd.textContent = `${product.brand} - ${product.name}`;
        if (modalField) modalField.value = `${product.brand} - ${product.name}`;
        if (modal) {
          modal.classList.add('active');
          document.body.style.overflow = 'hidden';
        }
      });
    }

    const flagBadges = detailEmpPanel.querySelectorAll('.flag-badge');
    flagBadges.forEach(badge => {
      badge.addEventListener('click', () => {
        const flagType = badge.getAttribute('data-flag');
        if (flagType === 'discontinued') {
          product.isDiscontinued = !product.isDiscontinued;
          showHvacToast(`Toggled DISCONTINUED flag: now ${product.isDiscontinued ? 'ACTIVE' : 'OFF'}.`, 'warning');
        } else if (flagType === 'alt') {
          product.discontinuedType = product.discontinuedType === 'alternative' ? 'no_longer_available' : 'alternative';
          showHvacToast(`Alternative flag updated: ${product.discontinuedType}.`, 'info');
        }
        renderProductDetail(product);
      });
    });
  }

  const promoBox = document.querySelector('#detailPromoAlert');
  if (promoBox) {
    if (product.promo_title) {
      promoBox.innerHTML = `
        <div style="display:flex; align-items:center; gap:10px;">
          <svg class="svg-icon" style="color:var(--vibrant-pink); width:22px; height:22px;"><use href="#icon-star"></use></svg>
          <div>
            <strong style="color:#fff; display:block; font-size:0.92rem;">${product.promo_title}</strong>
            <span style="color:var(--text-light); font-size:0.82rem;">${product.promo_description}</span>
          </div>
        </div>
      `;
      promoBox.style.display = 'block';
    } else {
      promoBox.style.display = 'none';
    }
  }

  const spec1 = document.querySelector('#detailSpecContent1');
  if (spec1) {
    spec1.innerHTML = `
      <div class="grid-2" style="gap:16px;">
        <div><strong>Airflow / Design:</strong> ${product.specs.airflow}</div>
        <div><strong>Operating Sound:</strong> ${product.specs.soundLevel}</div>
        <div><strong>Capacity Stages:</strong> ${product.specs.stages}</div>
        <div><strong>Dimensions:</strong> ${product.specs.dimensions}</div>
        <div><strong>Series #:</strong> ${product.series || 'Standard'}</div>
        <div><strong>Heating Capacity (BTU):</strong> ${product.btu || 'N/A'}</div>
      </div>
    `;
  }

  const spec3 = document.querySelector('#detailSpecContent3');
  if (spec3) {
    spec3.innerHTML = `
      <div class="grid-2" style="gap:16px;">
        <div><strong>Brand Certified:</strong> ${product.brand} Genuine Factory Certified</div>
        <div><strong>Warranty Coverage:</strong> ${product.placeholders.TextPlaceHolder3}</div>
        <div><strong>Chicago Rebates:</strong> ComEd & Nicor Gas Trade Ally Eligible</div>
        <div><strong>Labor Protection:</strong> 1-Year 100% Best Comfort Satisfaction Guarantee</div>
        <div><strong>Efficiency Rating:</strong> ${product.efficiency || 'High-Efficiency'}</div>
        <div><strong>Product Series:</strong> ${product.series || 'Standard'}</div>
      </div>
    `;
  }

  renderReviewsSection(product);
}

function generateStarHtml(rating) {
  let stars = '';
  const rounded = Math.round(rating);
  for (let i = 1; i <= 5; i++) {
    if (i <= rounded) {
      stars += '<span class="star-filled">★</span>';
    } else {
      stars += '<span class="star-empty">★</span>';
    }
  }
  return stars;
}

function renderReviewsSection(product) {
  const reviewsContainer = document.querySelector('#customerReviewsList');
  const overallScore = document.querySelector('#detailOverallScore');
  const overallStars = document.querySelector('#detailOverallStars');
  const totalReviewsCount = document.querySelector('#detailTotalReviewsCount');
  const barsContainer = document.querySelector('#detailRatingBars');

  if (!reviewsContainer) return;

  const revs = product.reviews || [];

  if (overallScore) overallScore.textContent = product.avgRating.toFixed(1);
  if (overallStars) overallStars.innerHTML = generateStarHtml(product.avgRating);
  if (totalReviewsCount) totalReviewsCount.textContent = `Based on ${revs.length} verified reviews`;

  if (barsContainer) {
    const starCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    revs.forEach(r => {
      starCounts[r.rating] = (starCounts[r.rating] || 0) + 1;
    });

    barsContainer.innerHTML = [5, 4, 3, 2, 1].map(stars => {
      const count = starCounts[stars] || 0;
      const pct = revs.length > 0 ? ((count / revs.length) * 100).toFixed(0) : 0;
      return `
        <div class="rating-bar-row">
          <span style="width: 50px;">${stars} Stars</span>
          <div class="rating-bar-track">
            <div class="rating-bar-fill" style="width: ${pct}%;"></div>
          </div>
          <span style="width: 40px; text-align: right; color: var(--text-muted);">${count}</span>
        </div>
      `;
    }).join('');
  }

  if (revs.length === 0) {
    reviewsContainer.innerHTML = `
      <div style="text-align: center; padding: 30px; color: var(--text-muted);">
        No reviews yet for this model. Be the first to leave a verified rating below!
      </div>
    `;
    return;
  }

  reviewsContainer.innerHTML = revs.map(r => `
    <article class="review-card-item">
      <div class="review-header">
        <div>
          <span class="reviewer-name">${r.reviewer_name}</span>
          ${r.is_verified_purchase ? `<span class="review-verified-badge"><svg class="svg-icon" style="width:12px; height:12px;"><use href="#icon-check-circle"></use></svg> Verified Purchase</span>` : ''}
          <div style="margin-top: 4px;" class="star-rating-display">
            ${generateStarHtml(r.rating)}
          </div>
        </div>
        <span class="review-date">${new Date(r.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
      </div>
      <h4 class="review-title">${r.title}</h4>
      <p class="review-text">${r.review_text}</p>
      <div style="display: flex; align-items: center; gap: 10px;">
        <button type="button" class="review-vote-btn" data-review-id="${r.id}" data-votes="${r.helpful_votes}">
          <span>👍 Helpful</span>
          <span class="vote-count">(${r.helpful_votes})</span>
        </button>
        <span style="font-size: 0.78rem; color: var(--text-muted);">Did this review help your purchasing decision?</span>
      </div>
    </article>
  `).join('');

  reviewsContainer.querySelectorAll('.review-vote-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.classList.contains('voted')) return;
      btn.classList.add('voted');
      let count = parseInt(btn.getAttribute('data-votes'), 10) || 0;
      count++;
      btn.setAttribute('data-votes', count);
      const countEl = btn.querySelector('.vote-count');
      if (countEl) countEl.textContent = `(${count})`;
    });
  });
}

function initReviewSubmission(product) {
  const form = document.querySelector('#productReviewForm');
  const starsPicker = document.querySelector('#reviewStarPicker');
  const ratingInput = document.querySelector('#selectedRatingVal');
  const formAlert = document.querySelector('#reviewFormAlert');

  if (!form) return;

  if (starsPicker && ratingInput) {
    const stars = starsPicker.querySelectorAll('span');
    stars.forEach((star, idx) => {
      star.addEventListener('click', () => {
        const val = idx + 1;
        ratingInput.value = val;
        stars.forEach((s, i) => {
          if (i < val) {
            s.classList.add('active');
            s.style.color = '#f59e0b';
          } else {
            s.classList.remove('active');
            s.style.color = 'rgba(255,255,255,0.2)';
          }
        });
      });
    });
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = form.querySelector('#reviewName').value.trim();
    const title = form.querySelector('#reviewTitle').value.trim();
    const text = form.querySelector('#reviewText').value.trim();
    const rating = parseInt(ratingInput.value, 10) || 5;

    const newReview = {
      id: 'custom-' + Date.now(),
      reviewer_name: name || 'Verified Customer',
      rating: rating,
      title: title || 'Great Quality Product',
      review_text: text,
      is_verified_purchase: true,
      created_at: new Date().toISOString(),
      helpful_votes: 1
    };

    product.reviews.unshift(newReview);
    
    const sum = product.reviews.reduce((acc, r) => acc + r.rating, 0);
    product.avgRating = Number((sum / product.reviews.length).toFixed(1));
    product.reviewCount = product.reviews.length;

    renderReviewsSection(product);

    if (formAlert) {
      formAlert.className = 'form-alert success';
      formAlert.innerHTML = '<svg class="svg-icon" style="color:#34d399; margin-right:6px;"><use href="#icon-check-circle"></use></svg> <strong>Thank you for your vote!</strong> Your verified review has been posted.';
      formAlert.style.display = 'block';
    }

    form.reset();
  });
}

function renderRelatedProducts(currentProduct) {
  const container = document.querySelector('#detailRelatedGrid');
  if (!container) return;

  const related = HVAC_PRODUCTS.filter(p => p.id !== currentProduct.id).slice(0, 4);

  container.innerHTML = related.map(p => {
    let priceText = '';
    const rawPrice = p.price_from ? '$' + Number(p.price_from).toFixed(2) : '$149.99';
    if (currentRoleMode === 'employee') {
      priceText = `<span style="color:#34d399;">From ${rawPrice}</span>`;
    } else {
      if (p.isDiscontinued) {
        priceText = `From <span style="text-decoration:line-through; opacity:0.65; color:#94a3b8;">${rawPrice}</span>`;
      } else {
        priceText = `From ${rawPrice}`;
      }
    }

    const stampOverlayHtml = p.isDiscontinued ? `
      <div class="stamp-overlay-wrapper">
        <div class="stamp-badge-red">Discontinued</div>
        ${p.discontinuedType === 'alternative' ? '<div class="stamp-badge-alt-green">SEE Alternative Replacement</div>' : ''}
      </div>
    ` : '';

    return `
      <article class="card card-interactive" style="display: flex; flex-direction: column; overflow: hidden; padding: 0;">
        <div class="product-card-thumb" style="background: #ffffff; padding: 16px; text-align: center; position: relative; border-bottom: 1px solid rgba(255,255,255,0.08); height: 180px; display: flex; align-items: center; justify-content: center; overflow: hidden;">
          <span class="card-tag ${p.tagClass}" style="position: absolute; top: 10px; left: 10px; z-index: 2; box-shadow: 0 2px 8px rgba(0,0,0,0.18); font-size: 0.7rem; padding: 3px 8px;">${p.tag}</span>
          <img src="${p.primaryImage}" alt="${p.name}" style="max-height: 100%; max-width: 100%; width: auto; height: auto; object-fit: contain; transition: transform 0.35s ease;" onerror="this.src='/__l5e/assets-v1/c7ae305d-1ec2-4d0f-adad-7b658902247c/blueflame-ac-main.svg';" />
          ${stampOverlayHtml}
        </div>
        <div style="padding: 20px; display: flex; flex-direction: column; flex-grow: 1;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
            <span style="font-size: 0.74rem; text-transform: uppercase; color: var(--rich-blue-electric); font-weight: 700;">${p.brand}</span>
            <span style="font-size: 0.88rem; font-weight: 800; color: #fff;">${priceText}</span>
          </div>
          <h4 style="font-size: 1.05rem; color: #fff; margin-bottom: 6px; line-height: 1.3;">${p.name}</h4>
          <div class="star-rating-display" style="margin-bottom: 10px;">
            ${generateStarHtml(p.avgRating)}
            <span class="rating-count-text">(${p.reviewCount})</span>
          </div>
          <div style="margin-top: auto;">
            <a href="product-detail.html?id=${p.id}" class="btn btn-outline btn-sm" style="width: 100%; text-align: center;">
              View Details &amp; Reviews &rarr;
            </a>
          </div>
        </div>
      </article>
    `;
  }).join('');
}

function initQuoteModal() {
  const modal = document.querySelector('#quoteModal');
  const closeBtn = document.querySelector('#closeQuoteModal');
  const modalProductName = document.querySelector('#modalProductName');
  const modalProductField = document.querySelector('#modalProductField');

  if (!modal) return;

  document.querySelectorAll('.btn-request-quote').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const pName = btn.getAttribute('data-product-name') || 'Selected HVAC Unit';
      if (modalProductName) modalProductName.textContent = pName;
      if (modalProductField) modalProductField.value = pName;

      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
    });
  });

  function closeModal() {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }

  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
      closeModal();
    }
  });

  const modalForm = document.querySelector('#modalQuoteForm');
  if (modalForm) {
    modalForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const alertBox = modalForm.querySelector('.form-alert');
      const submitBtn = modalForm.querySelector('button[type="submit"]');

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Calculating Quote...';
      }

      setTimeout(() => {
        if (alertBox) {
          alertBox.className = 'form-alert success';
          alertBox.innerHTML = '<svg class="svg-icon" style="color:#34d399; margin-right:6px;"><use href="#icon-check-circle"></use></svg> <strong>Estimate Sent!</strong> We have reserved your Chicago rebate package. Our HVAC specialist will contact you shortly.';
        }
        modalForm.reset();
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Submit Free Quote Request';
        }
      }, 700);
    });
  }
}
