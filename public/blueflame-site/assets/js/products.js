(function checkLegacyInspect() {
  const params = new URLSearchParams(window.location.search);
  const legacyInspect = params.get('inspect') || params.get('id');
  if (legacyInspect) {
    window.location.href = 'product-detail.html?id=' + encodeURIComponent(legacyInspect);
  }
})();

let currentBrand = 'all';
let currentSector = 'all';
let currentCategory = 'all';
let currentStage = 'all';
let currentAirflow = 'all';
let currentAfue = 'all';
let currentWidth = 'all';
let currentBtu = 'all';
let selectedAfue = new Set();
let selectedWidths = new Set();
let selectedBtus = new Set();
let selectedBrands = new Set();
let currentSearch = '';
let currentSort = 'default';
let currentViewMode = 'grid';
let filterRebatesOnly = false;
let openBranches = new Set(['node-brand-ameristar']);
let currentPage = 1;
const itemsPerPage = 6;
let currentRoleMode = localStorage.getItem('hvac_user_role') || 'consumer';

document.addEventListener('DOMContentLoaded', () => {
  initRoleSwitcher();
  initRockAutoTree();
  initFacetedFilters();
  initBrandSelect2();
  initRockAutoSearch();
  initViewModeToggle();
  initSort();
  renderBreadcrumbs();
  renderCatalog();
  initSizingCalculator();
  initQuoteModal();
  initMobileFilterDrawer();
});

function getProductSector(p) {
  const orig = (p.originalCategory || '').toLowerCase();
  return orig.includes('commercial') ? 'commercial' : 'residential';
}

function getProductStage(p) {
  const s = (p.specs && p.specs.stages) || '';
  const lower = s.toLowerCase();
  if (lower.includes('variable')) return 'variable';
  if (lower.includes('two')) return 'two';
  return 'single';
}

function getProductAirflow(p) {
  const a = (p.specs && p.specs.airflow) || '';
  const lower = a.toLowerCase();
  if (lower.includes('multi') || lower.includes('convertible') || lower.includes('universal') || (lower.includes('upflow') && lower.includes('downflow'))) {
    return 'multipoise';
  }
  if (lower.includes('downflow')) return 'downflow';
  return 'upflow';
}

function getProductWidth(p) {
  const dim = (p.specs && p.specs.dimensions) || '';
  const m = dim.match(/\d+\.?\d*"/);
  return m ? m[0] : '17.5"';
}

function normalizeWidth(w) {
  if (!w || w === 'all') return '';
  return String(w).replace(/[^0-9.]/g, '');
}

function getProductAfue(p) {
  const eff = (p.efficiency || '').toLowerCase();
  return eff.includes('80%') ? '80%' : 'high';
}

function getProductBtu(p) {
  if (p.btu) {
    const num = parseInt(p.btu.replace(/[^0-9]/g, ''), 10);
    if (!isNaN(num) && num > 0) return num;
  }
  const name = (p.name || '').toLowerCase();
  const spot = (p.spot_text || '').toLowerCase();
  const desc = (p.promo_description || '').toLowerCase();
  const allText = name + ' ' + spot + ' ' + desc;
  const m = allText.match(/(\d{2,3})[,.]?000\s*btu/);
  if (m) return parseInt(m[1] + '000', 10);
  if (p.specs && p.specs.dimensions) {
    if (p.specs.dimensions.includes('14.5')) return 30000;
    if (p.specs.dimensions.includes('17.5')) return 40000;
    if (p.specs.dimensions.includes('21')) return 50000;
    if (p.specs.dimensions.includes('24.5')) return 60000;
  }
  return 40000;
}

function isProductRebateEligible(p) {
  const eff = (p.efficiency || '').toLowerCase();
  const promo = (p.promo_title || '').toLowerCase() + ' ' + (p.promo_description || '').toLowerCase();
  return eff.includes('92%') || eff.includes('95%') || eff.includes('96%') || eff.includes('97%') || eff.includes('98%') || eff.includes('16 seer') || promo.includes('rebate') || promo.includes('bundle');
}

function initMobileFilterDrawer() {
  const toggleBtn = document.querySelector('#mobileFilterToggle');
  const closeBtn = document.querySelector('#drawerCloseBtn');
  const backdrop = document.querySelector('#drawerBackdrop');
  const applyBtn = document.querySelector('#applyDrawerBtn');
  const mobileChips = document.querySelectorAll('#mobileCatChips .mobile-cat-chip');

  function openDrawer() {
    document.body.classList.add('rockauto-drawer-open');
    document.body.style.overflow = 'hidden';
  }

  function closeDrawer() {
    document.body.classList.remove('rockauto-drawer-open');
    document.body.style.overflow = '';
  }

  if (toggleBtn) toggleBtn.addEventListener('click', openDrawer);
  if (closeBtn) closeBtn.addEventListener('click', closeDrawer);
  if (backdrop) backdrop.addEventListener('click', closeDrawer);
  if (applyBtn) {
    applyBtn.addEventListener('click', () => {
      closeDrawer();
      const catalogSection = document.querySelector('#productsCatalogSection');
      if (catalogSection) {
        catalogSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && document.body.classList.contains('rockauto-drawer-open')) {
      closeDrawer();
    }
  });

  mobileChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const cat = chip.getAttribute('data-cat');
      if (cat === 'all') {
        currentSector = 'all';
        currentCategory = 'all';
      } else if (cat === 'commercial') {
        currentSector = 'commercial';
        currentCategory = 'all';
      } else {
        currentSector = 'all';
        currentCategory = cat;
      }
      currentStage = 'all';
      currentAirflow = 'all';
      currentBrand = 'all';
      currentPage = 1;
      syncMobileCatChips();
      syncFacetedCheckboxes();
      renderBreadcrumbs();
      renderCatalog();
      updateTreeActiveStyles();
      updateMobileFilterBadge();
    });
  });
}

function syncMobileCatChips() {
  document.querySelectorAll('#mobileCatChips .mobile-cat-chip').forEach(chip => {
    const cat = chip.getAttribute('data-cat');
    let isActive = false;
    if (cat === 'all' && currentSector === 'all' && currentCategory === 'all') {
      isActive = true;
    } else if (cat === 'commercial' && currentSector === 'commercial') {
      isActive = true;
    } else if (cat === currentCategory) {
      isActive = true;
    }
    if (isActive) {
      chip.classList.add('active');
    } else {
      chip.classList.remove('active');
    }
  });
}

function updateMobileFilterBadge() {
  const badge = document.querySelector('#mobileFilterBadge');
  if (!badge) return;
  let count = 0;
  if (currentBrand !== 'all') count++;
  if (currentSector !== 'all') count++;
  if (currentCategory !== 'all') count++;
  if (currentStage !== 'all') count++;
  if (currentAirflow !== 'all') count++;
  if (currentAfue !== 'all') count++;
  if (currentWidth !== 'all') count++;
  if (currentBtu !== 'all') count++;
  count += selectedAfue.size;
  count += selectedWidths.size;
  count += selectedBtus.size;
  count += selectedBrands.size;
  if (filterRebatesOnly) count++;
  if (currentSearch) count++;
  if (count > 0) {
    badge.textContent = count;
    badge.style.display = 'inline-block';
  } else {
    badge.style.display = 'none';
  }
}

function countMatches(criteria) {
  return HVAC_PRODUCTS.filter(p => {
    if (criteria.brand && criteria.brand !== 'all') {
      if (p.brand.toLowerCase() !== criteria.brand.toLowerCase()) return false;
    }
    if (criteria.sector && criteria.sector !== 'all') {
      if (getProductSector(p) !== criteria.sector) return false;
    }
    if (criteria.category && criteria.category !== 'all') {
      if (criteria.category === 'furnaces') {
        const isFurnace = p.category === 'furnaces' || 
          (p.category === 'systems' && (p.name.toLowerCase().includes('furnace') || p.name.toLowerCase().includes('boiler'))) || 
          (p.originalCategory && p.originalCategory.toLowerCase().includes('furnace'));
        if (!isFurnace) return false;
      } else if (criteria.category === 'commercial') {
        if (getProductSector(p) !== 'commercial') return false;
      } else if (p.category !== criteria.category) {
        return false;
      }
    }
    if (criteria.stage && criteria.stage !== 'all') {
      if (getProductStage(p) !== criteria.stage) return false;
    }
    if (criteria.airflow && criteria.airflow !== 'all') {
      const af = getProductAirflow(p);
      if (af !== 'multipoise' && af !== criteria.airflow) return false;
    }
    if (criteria.afue && criteria.afue !== 'all') {
      const eff = (p.efficiency || '').toLowerCase();
      if (criteria.afue === '80%' && !eff.includes('80%')) return false;
      if (criteria.afue === 'high' && (eff.includes('80%') || eff.includes('standard'))) return false;
    }
    if (criteria.width && criteria.width !== 'all') {
      if (normalizeWidth(getProductWidth(p)) !== normalizeWidth(criteria.width)) return false;
    }
    if (criteria.btu && criteria.btu !== 'all') {
      const btu = getProductBtu(p);
      const target = parseInt(criteria.btu, 10);
      if (Math.abs(btu - target) > 5000) return false;
    }
    return true;
  }).length;
}

function isNodeActive(criteria) {
  if (!criteria) return false;
  if (criteria.brand && criteria.brand !== currentBrand) return false;
  if (criteria.category && criteria.category !== currentCategory) return false;
  if (criteria.stage && criteria.stage !== currentStage) return false;
  if (criteria.airflow && criteria.airflow !== currentAirflow) return false;
  if (criteria.afue && criteria.afue !== currentAfue) return false;
  if (criteria.width && normalizeWidth(criteria.width) !== normalizeWidth(currentWidth)) return false;
  if (criteria.btu && criteria.btu !== currentBtu) return false;

  // Exact depth checks: ensure node is not marked active if a more specific filter is active
  if (!criteria.category && currentCategory !== 'all') return false;
  if (!criteria.stage && currentStage !== 'all') return false;
  if (!criteria.airflow && currentAirflow !== 'all') return false;
  if (!criteria.afue && currentAfue !== 'all') return false;
  if (!criteria.width && currentWidth !== 'all') return false;
  if (!criteria.btu && currentBtu !== 'all') return false;
  if (!criteria.brand && currentBrand !== 'all') return false;

  return true;
}

function renderTreeNode({ id, level, title, count, icon, criteria, children, isLast }) {
  const hasChildren = children && children.length > 0;
  const isOpen = openBranches.has(id);
  const isActive = isNodeActive(criteria);

  let childrenHtml = '';
  if (hasChildren) {
    childrenHtml = children.map((c, idx) => renderTreeNode({
      ...c,
      isLast: idx === children.length - 1
    })).join('');
  }

  const dataAttrs = Object.entries(criteria || {})
    .map(([k, v]) => `data-${k}="${String(v).replace(/"/g, '&quot;')}"`)
    .join(' ');

  return `
    <div class="tree-node tree-node-lvl-${level} ${isOpen ? 'open' : ''} ${isLast ? 'is-last' : ''}" id="${id}">
      <div class="tree-row">
        ${hasChildren ? `
          <button type="button" class="tree-toggle-btn" data-toggle="${id}" aria-label="Toggle ${title}">
            &#9656;
          </button>
        ` : `
          <span class="tree-toggle-btn is-leaf-spacer"></span>
        `}
        <button type="button" class="tree-node-btn ${isActive ? 'active' : ''}" ${dataAttrs} data-node="${id}">
          <span class="tree-node-title">
            ${icon ? icon : ''}
            <span>${title}</span>
          </span>
          <span class="tree-badge ${count === 0 ? 'is-zero' : ''}">${count}</span>
        </button>
      </div>
      ${hasChildren ? `<div class="tree-children">${childrenHtml}</div>` : ''}
    </div>
  `;
}

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

function initRoleSwitcher() {
  const btnConsumer = document.querySelector('#btnRoleConsumer');
  const btnEmployee = document.querySelector('#btnRoleEmployee');
  const badgeIndicator = document.querySelector('#roleBadgeIndicator');
  const badgeText = document.querySelector('#roleBadgeText');
  const memoBanner = document.querySelector('#serviceOnlyMemoBanner');
  const memoTitle = document.querySelector('#memoBannerTitle');
  const memoText = document.querySelector('#memoBannerText');

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
      if (memoBanner) {
        memoBanner.style.borderColor = 'rgba(52, 211, 153, 0.45)';
        memoBanner.style.background = 'linear-gradient(90deg, rgba(52, 211, 153, 0.12), rgba(8, 17, 38, 0.95))';
      }
      if (memoTitle) {
        memoTitle.textContent = 'INTERNAL TECH DISPATCH & WHOLESALE SUPPLY PORTAL:';
      }
      if (memoText) {
        memoText.innerHTML = 'Showing technician trade pricing, vendor stock availability (Ferguson Naperville, Johnstone Supply Naperville/Joliet), and work order requisition controls. <strong>Field Tech ID: BC-7492 (Active)</strong>.';
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
      if (memoBanner) {
        memoBanner.style.borderColor = 'rgba(255, 30, 142, 0.35)';
        memoBanner.style.background = 'linear-gradient(90deg, rgba(255, 30, 142, 0.08), rgba(8, 17, 38, 0.95))';
      }
      if (memoTitle) {
        memoTitle.textContent = 'Notice to Property Owners (Chicago & Suburbs):';
      }
      if (memoText) {
        memoText.innerHTML = 'Best Comfort Heating &amp; Cooling is a licensed HVAC service &amp; installation provider. In accordance with manufacturer warranties and EPA safety regulations, <strong>we do not sell uninstalled equipment to the public for self-installation</strong>. All units include certified installation, load calculation, and 10-year warranty coverage. For emergency replacement, call our 24/7 dispatch at <a href="tel:8155560660" style="color:#ff1e8e; font-weight:800;">(815) 556-0660</a>.';
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
      renderCatalog();
      showHvacToast('Switched to Consumer View: Direct sales disabled, public service notice active.', 'info');
    });
  }

  if (btnEmployee) {
    btnEmployee.addEventListener('click', () => {
      if (currentRoleMode === 'employee') return;
      currentRoleMode = 'employee';
      localStorage.setItem('hvac_user_role', 'employee');
      updateRoleUI();
      renderCatalog();
      showHvacToast('Switched to Employee View: Field Technician tools & internal wholesale pricing unlocked.', 'success');
    });
  }
}

function initRockAutoTree() {
  const treeContainer = document.querySelector('#rockAutoTree');
  const resetBtn = document.querySelector('#treeResetBtn');
  if (!treeContainer) return;

  // Standard HVAC cabinet dimensions & capacity options requested by client
  const widths = ['14.5"', '17.5"', '21"', '24.5"'];
  const furnaceBtus = ['30000', '35000', '40000', '45000', '50000', '55000', '60000'];

  function getMatchingBrands(crit) {
    const matched = HVAC_PRODUCTS.filter(p => {
      if (crit.brand && crit.brand !== 'all') {
        if (p.brand.toLowerCase() !== crit.brand.toLowerCase()) return false;
      }
      if (crit.sector && crit.sector !== 'all') {
        if (getProductSector(p) !== crit.sector) return false;
      }
      if (crit.category && crit.category !== 'all') {
        if (crit.category === 'furnaces') {
          const isFurnace = p.category === 'furnaces' || 
            (p.category === 'systems' && (p.name.toLowerCase().includes('furnace') || p.name.toLowerCase().includes('boiler'))) || 
            (p.originalCategory && p.originalCategory.toLowerCase().includes('furnace'));
          if (!isFurnace) return false;
        } else if (crit.category === 'commercial') {
          if (getProductSector(p) !== 'commercial') return false;
        } else if (p.category !== crit.category) {
          return false;
        }
      }
      if (crit.stage && crit.stage !== 'all') {
        if (getProductStage(p) !== crit.stage) return false;
      }
      if (crit.airflow && crit.airflow !== 'all') {
        const af = getProductAirflow(p);
        if (af !== 'multipoise' && af !== crit.airflow) return false;
      }
      if (crit.afue && crit.afue !== 'all') {
        const eff = (p.efficiency || '').toLowerCase();
        if (crit.afue === '80%' && !eff.includes('80%')) return false;
        if (crit.afue === 'high' && (eff.includes('80%') || eff.includes('standard'))) return false;
      }
      if (crit.width && crit.width !== 'all') {
        if (normalizeWidth(getProductWidth(p)) !== normalizeWidth(crit.width)) return false;
      }
      if (crit.btu && crit.btu !== 'all') {
        const btu = getProductBtu(p);
        const target = parseInt(crit.btu, 10);
        if (Math.abs(btu - target) > 5000) return false;
      }
      return true;
    });
    return [...new Set(matched.map(p => p.brand).filter(Boolean))].sort((a, b) => a.localeCompare(b));
  }

  function makeBrandNodes(baseId, baseCriteria, level = 7) {
    const brands = getMatchingBrands(baseCriteria);
    return brands.map(b => {
      const slug = b.toLowerCase().replace(/[^a-z0-9]/g, '');
      const crit = { ...baseCriteria, brand: b };
      return {
        id: `${baseId}-brand-${slug}`,
        level: level,
        title: b,
        icon: '<svg class="svg-icon" style="width:12px; height:12px; color:var(--rich-blue-electric);"><use href="#icon-package"></use></svg>',
        criteria: crit,
        count: countMatches(crit),
        children: []
      };
    });
  }

  function makeBtuNodes(baseId, baseCriteria, btuList) {
    return btuList.map(b => {
      const bNum = Number(b).toLocaleString();
      const crit = { ...baseCriteria, btu: b };
      const btuId = `${baseId}-btu${b}`;
      const brandChildren = makeBrandNodes(btuId, crit, 7);
      return {
        id: btuId,
        level: 6,
        title: `${bNum} BTU's`,
        criteria: crit,
        count: countMatches(crit),
        children: brandChildren
      };
    });
  }

  function makeWidthNodes(baseId, baseCriteria, btuList) {
    return widths.map(w => {
      const wNum = w.replace(/[^0-9]/g, '');
      const crit = { ...baseCriteria, width: w };
      const wId = `${baseId}-w${wNum}`;
      return {
        id: wId,
        level: 5,
        title: `${w} Width`,
        criteria: crit,
        count: countMatches(crit),
        children: makeBtuNodes(wId, crit, btuList)
      };
    });
  }

  // --- 1. FURNACES & HEATING ---
  const furnCrit = { category: 'furnaces' };
  const singleUp80 = { ...furnCrit, stage: 'single', airflow: 'upflow', afue: '80%' };
  const singleUpHigh = { ...furnCrit, stage: 'single', airflow: 'upflow', afue: 'high' };
  const singleDown80 = { ...furnCrit, stage: 'single', airflow: 'downflow', afue: '80%' };
  const singleDownHigh = { ...furnCrit, stage: 'single', airflow: 'downflow', afue: 'high' };

  const twoUp80 = { ...furnCrit, stage: 'two', airflow: 'upflow', afue: '80%' };
  const twoUpHigh = { ...furnCrit, stage: 'two', airflow: 'upflow', afue: 'high' };
  const twoDown80 = { ...furnCrit, stage: 'two', airflow: 'downflow', afue: '80%' };
  const twoDownHigh = { ...furnCrit, stage: 'two', airflow: 'downflow', afue: 'high' };

  const varUpHigh = { ...furnCrit, stage: 'variable', airflow: 'upflow', afue: 'high' };
  const varDownHigh = { ...furnCrit, stage: 'variable', airflow: 'downflow', afue: 'high' };

  const furnacesNode = {
    id: 'node-cat-furnaces',
    level: 1,
    title: 'Furnaces & Heating',
    icon: '<svg class="svg-icon" style="width:14px; height:14px; color:var(--electric-salmon);"><use href="#icon-fire"></use></svg>',
    criteria: furnCrit,
    count: countMatches(furnCrit),
    children: [
      {
        id: 'node-furn-single',
        level: 2,
        title: 'Single stage',
        criteria: { ...furnCrit, stage: 'single' },
        count: countMatches({ ...furnCrit, stage: 'single' }),
        children: [
          {
            id: 'node-furn-single-up',
            level: 3,
            title: 'Up Flow',
            criteria: { ...furnCrit, stage: 'single', airflow: 'upflow' },
            count: countMatches({ ...furnCrit, stage: 'single', airflow: 'upflow' }),
            children: [
              {
                id: 'node-furn-single-up-80',
                level: 4,
                title: '80% AFUE',
                criteria: singleUp80,
                count: countMatches(singleUp80),
                children: makeWidthNodes('node-furn-single-up-80', singleUp80, furnaceBtus)
              },
              {
                id: 'node-furn-single-up-high',
                level: 4,
                title: '90%+ High AFUE',
                criteria: singleUpHigh,
                count: countMatches(singleUpHigh),
                children: makeWidthNodes('node-furn-single-up-high', singleUpHigh, ['30000', '40000', '50000', '60000', '80000'])
              }
            ]
          },
          {
            id: 'node-furn-single-down',
            level: 3,
            title: 'Downflow',
            criteria: { ...furnCrit, stage: 'single', airflow: 'downflow' },
            count: countMatches({ ...furnCrit, stage: 'single', airflow: 'downflow' }),
            children: [
              {
                id: 'node-furn-single-down-80',
                level: 4,
                title: '80% AFUE',
                criteria: singleDown80,
                count: countMatches(singleDown80),
                children: makeWidthNodes('node-furn-single-down-80', singleDown80, ['30000', '40000', '45000', '60000'])
              },
              {
                id: 'node-furn-single-down-high',
                level: 4,
                title: '90%+ High AFUE',
                criteria: singleDownHigh,
                count: countMatches(singleDownHigh),
                children: makeWidthNodes('node-furn-single-down-high', singleDownHigh, ['30000', '40000', '60000'])
              }
            ]
          }
        ]
      },
      {
        id: 'node-furn-two',
        level: 2,
        title: 'Two stage',
        criteria: { ...furnCrit, stage: 'two' },
        count: countMatches({ ...furnCrit, stage: 'two' }),
        children: [
          {
            id: 'node-furn-two-up',
            level: 3,
            title: 'Up Flow',
            criteria: { ...furnCrit, stage: 'two', airflow: 'upflow' },
            count: countMatches({ ...furnCrit, stage: 'two', airflow: 'upflow' }),
            children: [
              {
                id: 'node-furn-two-up-80',
                level: 4,
                title: '80% AFUE',
                criteria: twoUp80,
                count: countMatches(twoUp80),
                children: makeWidthNodes('node-furn-two-up-80', twoUp80, furnaceBtus)
              },
              {
                id: 'node-furn-two-up-high',
                level: 4,
                title: '90%+ High AFUE',
                criteria: twoUpHigh,
                count: countMatches(twoUpHigh),
                children: makeWidthNodes('node-furn-two-up-high', twoUpHigh, ['40000', '50000', '60000', '80000', '100000'])
              }
            ]
          },
          {
            id: 'node-furn-two-down',
            level: 3,
            title: 'Downflow',
            criteria: { ...furnCrit, stage: 'two', airflow: 'downflow' },
            count: countMatches({ ...furnCrit, stage: 'two', airflow: 'downflow' }),
            children: [
              {
                id: 'node-furn-two-down-80',
                level: 4,
                title: '80% AFUE',
                criteria: twoDown80,
                count: countMatches(twoDown80),
                children: makeWidthNodes('node-furn-two-down-80', twoDown80, ['40000', '60000'])
              },
              {
                id: 'node-furn-two-down-high',
                level: 4,
                title: '90%+ High AFUE',
                criteria: twoDownHigh,
                count: countMatches(twoDownHigh),
                children: makeWidthNodes('node-furn-two-down-high', twoDownHigh, ['40000', '60000', '80000'])
              }
            ]
          }
        ]
      },
      {
        id: 'node-furn-var',
        level: 2,
        title: 'Two stage variable / Modulating',
        criteria: { ...furnCrit, stage: 'variable' },
        count: countMatches({ ...furnCrit, stage: 'variable' }),
        children: [
          {
            id: 'node-furn-var-up',
            level: 3,
            title: 'Up Flow',
            criteria: { ...furnCrit, stage: 'variable', airflow: 'upflow' },
            count: countMatches({ ...furnCrit, stage: 'variable', airflow: 'upflow' }),
            children: [
              {
                id: 'node-furn-var-up-high',
                level: 4,
                title: '90%+ High AFUE',
                criteria: varUpHigh,
                count: countMatches(varUpHigh),
                children: makeWidthNodes('node-furn-var-up-high', varUpHigh, ['40000', '60000', '80000', '100000', '120000'])
              }
            ]
          },
          {
            id: 'node-furn-var-down',
            level: 3,
            title: 'Downflow',
            criteria: { ...furnCrit, stage: 'variable', airflow: 'downflow' },
            count: countMatches({ ...furnCrit, stage: 'variable', airflow: 'downflow' }),
            children: [
              {
                id: 'node-furn-var-down-high',
                level: 4,
                title: '90%+ High AFUE',
                criteria: varDownHigh,
                count: countMatches(varDownHigh),
                children: makeWidthNodes('node-furn-var-down-high', varDownHigh, ['40000', '60000', '80000'])
              }
            ]
          }
        ]
      }
    ]
  };

  // --- 2. AC & HEAT PUMPS ---
  const acCrit = { category: 'systems' };
  const acSplitCrit = { ...acCrit, stage: 'single' };
  const acInvCrit = { ...acCrit, stage: 'two' };
  const acMiniCrit = { ...acCrit, stage: 'variable' };

  const acNode = {
    id: 'node-cat-systems',
    level: 1,
    title: 'AC & Heat Pumps',
    icon: '<svg class="svg-icon" style="width:14px; height:14px; color:var(--rich-blue-electric);"><use href="#icon-snowflake"></use></svg>',
    criteria: acCrit,
    count: countMatches(acCrit),
    children: [
      {
        id: 'node-ac-split',
        level: 2,
        title: 'Central Split Heat Pumps',
        criteria: acSplitCrit,
        count: countMatches(acSplitCrit),
        children: makeBrandNodes('node-ac-split', acSplitCrit, 3)
      },
      {
        id: 'node-ac-inv',
        level: 2,
        title: 'Inverter Condensers',
        criteria: acInvCrit,
        count: countMatches(acInvCrit),
        children: makeBrandNodes('node-ac-inv', acInvCrit, 3)
      },
      {
        id: 'node-ac-mini',
        level: 2,
        title: 'Multi-Zone Mini Splits',
        criteria: acMiniCrit,
        count: countMatches(acMiniCrit),
        children: makeBrandNodes('node-ac-mini', acMiniCrit, 3)
      }
    ]
  };

  // --- 3. AIR FILTERS & IAQ ---
  const filterCrit = { category: 'filters' };
  const filMerv11 = { ...filterCrit, airflow: 'upflow' };
  const filMerv13 = { ...filterCrit, stage: 'single' };
  const filHepa = { ...filterCrit, stage: 'two' };
  const filUvc = { ...filterCrit, stage: 'variable' };

  const filterNode = {
    id: 'node-cat-filters',
    level: 1,
    title: 'Air Filters & IAQ',
    icon: '<svg class="svg-icon" style="width:14px; height:14px; color:var(--mint-leaf);"><use href="#icon-wind"></use></svg>',
    criteria: filterCrit,
    count: countMatches(filterCrit),
    children: [
      {
        id: 'node-fil-merv11',
        level: 2,
        title: 'MERV 11 Standard Media',
        criteria: filMerv11,
        count: countMatches(filMerv11),
        children: makeBrandNodes('node-fil-merv11', filMerv11, 3)
      },
      {
        id: 'node-fil-merv13',
        level: 2,
        title: 'MERV 13 Carbon Clean',
        criteria: filMerv13,
        count: countMatches(filMerv13),
        children: makeBrandNodes('node-fil-merv13', filMerv13, 3)
      },
      {
        id: 'node-fil-hepa',
        level: 2,
        title: 'HEPA Whole-House Filtration',
        criteria: filHepa,
        count: countMatches(filHepa),
        children: makeBrandNodes('node-fil-hepa', filHepa, 3)
      },
      {
        id: 'node-fil-uvc',
        level: 2,
        title: 'UV-C Air Purifiers',
        criteria: filUvc,
        count: countMatches(filUvc),
        children: makeBrandNodes('node-fil-uvc', filUvc, 3)
      }
    ]
  };

  // --- 4. CONTROLS & THERMOSTATS ---
  const thermCrit = { category: 'thermostats' };
  const thermWifi = { ...thermCrit, stage: 'two' };
  const thermProg = { ...thermCrit, stage: 'single' };

  const thermNode = {
    id: 'node-cat-thermostats',
    level: 1,
    title: 'Controls & Thermostats',
    icon: '<svg class="svg-icon" style="width:14px; height:14px; color:var(--vibrant-pink);"><use href="#icon-smartphone"></use></svg>',
    criteria: thermCrit,
    count: countMatches(thermCrit),
    children: [
      {
        id: 'node-therm-wifi',
        level: 2,
        title: 'WiFi Smart Thermostats',
        criteria: thermWifi,
        count: countMatches(thermWifi),
        children: makeBrandNodes('node-therm-wifi', thermWifi, 3)
      },
      {
        id: 'node-therm-prog',
        level: 2,
        title: '7-Day Programmable',
        criteria: thermProg,
        count: countMatches(thermProg),
        children: makeBrandNodes('node-therm-prog', thermProg, 3)
      }
    ]
  };

  // --- 5. COMMERCIAL SYSTEMS ---
  const commCrit = { category: 'commercial' };
  const commRtu = { ...commCrit, stage: 'single' };
  const commFil = { ...commCrit, stage: 'two' };

  const commNode = {
    id: 'node-cat-commercial',
    level: 1,
    title: 'Commercial Systems',
    icon: '<svg class="svg-icon" style="width:14px; height:14px; color:var(--rich-blue-electric);"><use href="#icon-bolt"></use></svg>',
    criteria: commCrit,
    count: countMatches(commCrit),
    children: [
      {
        id: 'node-comm-rtu',
        level: 2,
        title: 'Packaged RTU & Boilers',
        criteria: commRtu,
        count: countMatches(commRtu),
        children: makeBrandNodes('node-comm-rtu', commRtu, 3)
      },
      {
        id: 'node-comm-fil',
        level: 2,
        title: 'Commercial Filtration',
        criteria: commFil,
        count: countMatches(commFil),
        children: makeBrandNodes('node-comm-fil', commFil, 3)
      }
    ]
  };

  // --- 6. OEM REPLACEMENT PARTS ---
  const partsCrit = { category: 'parts' };
  const partsElec = { ...partsCrit, stage: 'single' };
  const partsSensor = { ...partsCrit, stage: 'single', airflow: 'downflow' };
  const partsRef = { ...partsCrit, stage: 'two' };

  const partsNode = {
    id: 'node-cat-parts',
    level: 1,
    title: 'OEM Replacement Parts',
    icon: '<svg class="svg-icon" style="width:14px; height:14px; color:var(--text-muted);"><use href="#icon-tools"></use></svg>',
    criteria: partsCrit,
    count: countMatches(partsCrit),
    children: [
      {
        id: 'node-parts-elec',
        level: 2,
        title: 'Capacitors & Contactors',
        criteria: partsElec,
        count: countMatches(partsElec),
        children: makeBrandNodes('node-parts-elec', partsElec, 3)
      },
      {
        id: 'node-parts-sensor',
        level: 2,
        title: 'Flame Sensors & Ignitors',
        criteria: partsSensor,
        count: countMatches(partsSensor),
        children: makeBrandNodes('node-parts-sensor', partsSensor, 3)
      },
      {
        id: 'node-parts-ref',
        level: 2,
        title: 'Refrigerants (R-410A / R-22)',
        criteria: partsRef,
        count: countMatches(partsRef),
        children: makeBrandNodes('node-parts-ref', partsRef, 3)
      }
    ]
  };

  const allCategoryNodes = [
    furnacesNode,
    acNode,
    filterNode,
    thermNode,
    commNode,
    partsNode
  ];

  const categoriesHtml = allCategoryNodes.map((cat, idx) => {
    return renderTreeNode({ ...cat, isLast: idx === allCategoryNodes.length - 1 });
  }).join('');

  treeContainer.innerHTML = categoriesHtml;

  // Helper: Close all sibling tree-nodes under the same parent container
  function closeSiblings(node) {
    if (!node || !node.parentElement) return;
    const siblings = Array.from(node.parentElement.children);
    for (const sib of siblings) {
      if (sib !== node && sib.classList && sib.classList.contains('tree-node')) {
        sib.classList.remove('open');
        openBranches.delete(sib.id);
        sib.querySelectorAll('.tree-node.open').forEach(desc => {
          desc.classList.remove('open');
          openBranches.delete(desc.id);
        });
      }
    }
  }

  // Toggle button event listeners (expand / collapse branch with accordion behavior)
  treeContainer.querySelectorAll('.tree-toggle-btn[data-toggle]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const targetId = btn.getAttribute('data-toggle');
      const node = document.getElementById(targetId);
      if (node) {
        const isOpening = !node.classList.contains('open');
        if (isOpening) {
          closeSiblings(node);
          node.classList.add('open');
          openBranches.add(targetId);
        } else {
          node.classList.remove('open');
          openBranches.delete(targetId);
          node.querySelectorAll('.tree-node.open').forEach(desc => {
            desc.classList.remove('open');
            openBranches.delete(desc.id);
          });
        }
      }
    });
  });

  // Node selection event listeners (drill-down & filter)
  treeContainer.querySelectorAll('.tree-node-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const brand = btn.getAttribute('data-brand') || 'all';
      const cat = btn.getAttribute('data-category') || 'all';
      const stage = btn.getAttribute('data-stage') || 'all';
      const airflow = btn.getAttribute('data-airflow') || 'all';
      const afue = btn.getAttribute('data-afue') || 'all';
      const width = btn.getAttribute('data-width') || 'all';
      const btu = btn.getAttribute('data-btu') || 'all';

      currentSector = 'all';
      currentBrand = brand;
      currentCategory = cat;
      currentStage = stage;
      currentAirflow = airflow;
      currentAfue = afue;
      currentWidth = width;
      currentBtu = btu;
      currentPage = 1;

      // Auto-open this branch and all ancestor branches while closing sibling branches at each level
      let el = btn.closest('.tree-node');
      while (el) {
        closeSiblings(el);
        el.classList.add('open');
        openBranches.add(el.id);
        el = el.parentElement ? el.parentElement.closest('.tree-node') : null;
      }

      syncMobileCatChips();
      renderBreadcrumbs();
      renderCatalog();
      initRockAutoTree();
      updateMobileFilterBadge();
    });
  });

  if (resetBtn) {
    resetBtn.addEventListener('click', resetAllFilters);
  }
}

function updateTreeActiveStyles() {
  // Tree active styles are maintained by isNodeActive inside initRockAutoTree
}

function initFacetedFilters() {
  const rebateCb = document.querySelector('#filterRebatesOnly');
  if (rebateCb) {
    rebateCb.addEventListener('change', (e) => {
      filterRebatesOnly = e.target.checked;
      currentPage = 1;
      renderBreadcrumbs();
      renderCatalog();
      updateMobileFilterBadge();
    });
  }

  document.querySelectorAll('.width-facet-cb').forEach(cb => {
    cb.addEventListener('change', () => {
      if (cb.checked) {
        selectedWidths.add(cb.value);
      } else {
        selectedWidths.delete(cb.value);
      }
      currentPage = 1;
      renderBreadcrumbs();
      renderCatalog();
      updateMobileFilterBadge();
    });
  });

  document.querySelectorAll('.btu-facet-cb').forEach(cb => {
    cb.addEventListener('change', () => {
      if (cb.checked) {
        selectedBtus.add(cb.value);
      } else {
        selectedBtus.delete(cb.value);
      }
      currentPage = 1;
      renderBreadcrumbs();
      renderCatalog();
      updateMobileFilterBadge();
    });
  });

  document.querySelectorAll('.eff-facet-cb').forEach(cb => {
    cb.addEventListener('change', () => {
      if (cb.checked) {
        selectedAfue.add(cb.value);
      } else {
        selectedAfue.delete(cb.value);
      }
      currentPage = 1;
      renderBreadcrumbs();
      renderCatalog();
      updateMobileFilterBadge();
    });
  });

  document.querySelectorAll('.brand-facet-cb').forEach(cb => {
    cb.addEventListener('change', () => {
      if (cb.checked) {
        selectedBrands.add(cb.value);
      } else {
        for (const b of selectedBrands) {
          if (b.toLowerCase() === cb.value.toLowerCase()) {
            selectedBrands.delete(b);
          }
        }
      }
      syncBrandSelect2UI();
      currentPage = 1;
      renderBreadcrumbs();
      renderCatalog();
      updateMobileFilterBadge();
    });
  });
}

function syncFacetedCheckboxes() {
  const rebateCb = document.querySelector('#filterRebatesOnly');
  if (rebateCb) rebateCb.checked = filterRebatesOnly;

  document.querySelectorAll('.width-facet-cb').forEach(cb => {
    cb.checked = selectedWidths.has(cb.value);
  });

  document.querySelectorAll('.btu-facet-cb').forEach(cb => {
    cb.checked = selectedBtus.has(cb.value);
  });

  document.querySelectorAll('.eff-facet-cb').forEach(cb => {
    cb.checked = selectedAfue.has(cb.value);
  });

  document.querySelectorAll('.brand-facet-cb').forEach(cb => {
    let hasBrand = false;
    selectedBrands.forEach(b => {
      if (b.toLowerCase() === cb.value.toLowerCase()) hasBrand = true;
    });
    cb.checked = hasBrand;
  });

  syncBrandSelect2UI();
}

function resetAllFilters() {
  currentBrand = 'all';
  currentSector = 'all';
  currentCategory = 'all';
  currentStage = 'all';
  currentAirflow = 'all';
  currentAfue = 'all';
  currentWidth = 'all';
  currentBtu = 'all';
  selectedAfue.clear();
  selectedWidths.clear();
  selectedBtus.clear();
  selectedBrands.clear();
  currentSearch = '';
  filterRebatesOnly = false;
  currentSort = 'default';
  currentPage = 1;
  openBranches = new Set(['node-brand-ameristar']);

  const sInput = document.querySelector('#catalogSearchInput');
  if (sInput) sInput.value = '';
  const sClear = document.querySelector('#catalogSearchClear');
  if (sClear) sClear.style.display = 'none';

  const sMobile = document.querySelector('#catalogSearchInputMobile');
  if (sMobile) sMobile.value = '';
  const sMobileClear = document.querySelector('#catalogSearchClearMobile');
  if (sMobileClear) sMobileClear.style.display = 'none';

  const bSearch = document.querySelector('#brandSearchBox');
  if (bSearch && bSearch.value) {
    bSearch.value = '';
    bSearch.dispatchEvent(new Event('input'));
  }

  syncMobileCatChips();
  syncFacetedCheckboxes();
  renderBreadcrumbs();
  renderCatalog();
  initRockAutoTree();
  updateMobileFilterBadge();
}

function initBrandSelect2() {
  const container = document.querySelector('#brandSelect2');
  const control = document.querySelector('#brandSelect2Control');
  const dropdown = document.querySelector('#brandSelect2Dropdown');
  const searchInput = document.querySelector('#brandSearchBox');
  const searchClear = document.querySelector('#brandSearchClear');
  const clearAllBtn = document.querySelector('#brandSelectClearAll');
  const rendered = document.querySelector('#brandSelect2Rendered');
  const alphabetGroups = document.querySelectorAll('.brand-alphabet-group');
  const noResults = document.querySelector('#brandNoResults');

  if (!container || !control || !dropdown) return;

  document.body.appendChild(dropdown);

  function positionDropdown() {
    const rect = control.getBoundingClientRect();
    dropdown.style.top = (rect.bottom + window.scrollY + 4) + 'px';
    dropdown.style.left = (rect.left + window.scrollX) + 'px';
    dropdown.style.width = rect.width + 'px';
  }

  function openDropdown() {
    container.classList.add('open');
    control.classList.add('open');
    dropdown.classList.add('open');
    dropdown.style.display = 'flex';
    control.setAttribute('aria-expanded', 'true');
    positionDropdown();
    if (searchInput) searchInput.focus();
  }

  function closeDropdown() {
    container.classList.remove('open');
    control.classList.remove('open');
    dropdown.classList.remove('open');
    dropdown.style.display = 'none';
    control.setAttribute('aria-expanded', 'false');
  }

  function toggleDropdown() {
    if (container.classList.contains('open')) {
      closeDropdown();
    } else {
      openDropdown();
    }
  }

  control.addEventListener('click', (e) => {
    toggleDropdown();
  });

  control.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleDropdown();
    } else if (e.key === 'Escape') {
      closeDropdown();
    }
  });

  document.addEventListener('click', (e) => {
    if (!container.contains(e.target) && !dropdown.contains(e.target)) {
      closeDropdown();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && container.classList.contains('open')) {
      closeDropdown();
      control.focus();
    }
  });

  window.addEventListener('resize', () => {
    if (container.classList.contains('open')) positionDropdown();
  });

  const sidebar = document.querySelector('#rockAutoSidebar');
  if (sidebar) {
    sidebar.addEventListener('scroll', () => {
      if (container.classList.contains('open')) positionDropdown();
    });
  }

  if (searchInput) {
    searchInput.addEventListener('input', () => {
      const q = searchInput.value.trim().toLowerCase();
      if (searchClear) {
        searchClear.style.display = q ? 'block' : 'none';
      }

      let totalVisible = 0;
      alphabetGroups.forEach(grp => {
        const items = grp.querySelectorAll('.facet-checkbox-item');
        let grpVisible = 0;
        items.forEach(item => {
          const brand = (item.getAttribute('data-brand') || '').toLowerCase();
          if (!q || brand.includes(q)) {
            item.style.display = 'flex';
            grpVisible++;
            totalVisible++;
          } else {
            item.style.display = 'none';
          }
        });
        grp.style.display = grpVisible > 0 ? 'block' : 'none';
      });

      if (noResults) {
        noResults.style.display = totalVisible === 0 ? 'block' : 'none';
      }
    });

    if (searchClear) {
      searchClear.addEventListener('click', (e) => {
        e.stopPropagation();
        searchInput.value = '';
        searchInput.dispatchEvent(new Event('input'));
        searchInput.focus();
      });
    }
  }

  if (clearAllBtn) {
    clearAllBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      selectedBrands.clear();
      syncFacetedCheckboxes();
      currentPage = 1;
      renderBreadcrumbs();
      renderCatalog();
      updateMobileFilterBadge();
    });
  }

  if (rendered) {
    rendered.addEventListener('click', (e) => {
      const rmBtn = e.target.closest('.select2-tag-remove');
      if (!rmBtn) return;
      e.stopPropagation();
      const b = rmBtn.getAttribute('data-brand');
      if (b) {
        for (const brand of selectedBrands) {
          if (brand.toLowerCase() === b.toLowerCase()) {
            selectedBrands.delete(brand);
            break;
          }
        }
        syncFacetedCheckboxes();
        currentPage = 1;
        renderBreadcrumbs();
        renderCatalog();
        updateMobileFilterBadge();
      }
    });
  }

  syncBrandSelect2UI();
}

function syncBrandSelect2UI() {
  const rendered = document.querySelector('#brandSelect2Rendered');
  const countLabel = document.querySelector('#brandSelectCount');
  const control = document.querySelector('#brandSelect2Control');

  if (countLabel) {
    const sz = selectedBrands.size;
    countLabel.textContent = sz === 0 ? '0 selected' : (sz === 1 ? '1 selected' : sz + ' selected');
  }

  if (control) {
    if (selectedBrands.size > 0) {
      control.classList.add('has-selection');
    } else {
      control.classList.remove('has-selection');
    }
  }

  if (rendered) {
    if (selectedBrands.size === 0) {
      rendered.style.display = 'none';
      rendered.innerHTML = '';
    } else {
      rendered.style.display = 'flex';
      let tagsHtml = '';
      selectedBrands.forEach(b => {
        tagsHtml += `<span class="select2-tag" data-brand="${b}"><span class="select2-tag-label">${b}</span><button type="button" class="select2-tag-remove" data-brand="${b}" aria-label="Remove ${b}">&times;</button></span>`;
      });
      rendered.innerHTML = tagsHtml;
    }
  }
}

function initRockAutoSearch() {
  const searchInput = document.querySelector('#catalogSearchInput');
  const searchClear = document.querySelector('#catalogSearchClear');
  const searchMobile = document.querySelector('#catalogSearchInputMobile');
  const searchMobileClear = document.querySelector('#catalogSearchClearMobile');

  function handleSearch(val) {
    currentSearch = val.trim();
    currentPage = 1;
    if (searchInput && searchInput.value !== val) searchInput.value = val;
    if (searchMobile && searchMobile.value !== val) searchMobile.value = val;

    if (searchClear) searchClear.style.display = currentSearch.length > 0 ? 'block' : 'none';
    if (searchMobileClear) searchMobileClear.style.display = currentSearch.length > 0 ? 'block' : 'none';

    renderCatalog();
    renderBreadcrumbs();
    updateMobileFilterBadge();
  }

  if (searchInput) {
    searchInput.addEventListener('input', (e) => handleSearch(e.target.value));
  }
  if (searchMobile) {
    searchMobile.addEventListener('input', (e) => handleSearch(e.target.value));
  }

  if (searchClear) {
    searchClear.addEventListener('click', () => {
      handleSearch('');
      if (searchInput) searchInput.focus();
    });
  }
  if (searchMobileClear) {
    searchMobileClear.addEventListener('click', () => {
      handleSearch('');
      if (searchMobile) searchMobile.focus();
    });
  }
}

function initViewModeToggle() {
  const gridBtn = document.querySelector('#viewBtnGrid');
  const listBtn = document.querySelector('#viewBtnList');
  const grid = document.querySelector('#productsCatalogGrid');

  if (!gridBtn || !listBtn || !grid) return;

  gridBtn.addEventListener('click', () => {
    currentViewMode = 'grid';
    gridBtn.classList.add('active');
    listBtn.classList.remove('active');
    // Ensure grid layout classes
    grid.classList.remove('product-list-view');
    if (!grid.classList.contains('grid-3')) grid.classList.add('grid-3');
    grid.classList.add('grid-view');
    renderCatalog();
  });

  listBtn.addEventListener('click', () => {
    currentViewMode = 'list';
    listBtn.classList.add('active');
    gridBtn.classList.remove('active');
    // Switch to list layout, remove grid classes
    grid.classList.remove('grid-view');
    grid.classList.remove('grid-3');
    grid.classList.add('product-list-view');
    renderCatalog();
  });
}

function initSort() {
  const sortSelect = document.querySelector('#catalogSortSelect');
  if (!sortSelect) return;

  sortSelect.addEventListener('change', (e) => {
    currentSort = e.target.value;
    currentPage = 1;
    renderCatalog();
  });
}

function renderBreadcrumbs() {
  const trailContainer = document.querySelector('#breadcrumbTrail') || document.querySelector('#rockAutoBreadcrumbs');
  if (!trailContainer) return;

  let crumbs = [];
  crumbs.push({ label: 'Catalog Root', action: 'root' });

  if (currentSector === 'residential') {
    crumbs.push({ label: 'Residential', action: 'sector', val: 'residential' });
  } else if (currentSector === 'commercial') {
    crumbs.push({ label: 'Commercial', action: 'sector', val: 'commercial' });
  }

  if (currentCategory !== 'all') {
    let catLabel = currentCategory;
    if (currentCategory === 'furnaces') catLabel = 'Furnaces & Heating';
    if (currentCategory === 'systems') catLabel = 'AC & Systems';
    if (currentCategory === 'filters') catLabel = 'Air Filters & IAQ';
    if (currentCategory === 'thermostats') catLabel = 'Controls & Thermostats';
    if (currentCategory === 'parts') catLabel = 'OEM Parts';
    if (currentCategory === 'commercial') catLabel = 'Commercial Systems';
    crumbs.push({ label: catLabel, action: 'category', val: currentCategory });
  }

  if (currentStage !== 'all') {
    let stageLabel = currentStage === 'single' ? 'Single stage' : currentStage === 'two' ? 'Two stage' : 'Two stage variable';
    crumbs.push({ label: stageLabel, action: 'stage', val: currentStage });
  }

  if (currentAirflow !== 'all') {
    let airLabel = currentAirflow === 'upflow' ? 'Up Flow' : 'Downflow';
    crumbs.push({ label: airLabel, action: 'airflow', val: currentAirflow });
  }

  if (currentAfue !== 'all') {
    let afueLabel = currentAfue === '80%' ? '80% AFUE' : '90%+ AFUE';
    crumbs.push({ label: afueLabel, action: 'afue', val: currentAfue });
  }

  if (currentWidth !== 'all') {
    crumbs.push({ label: currentWidth + ' Width', action: 'width', val: currentWidth });
  }

  if (currentBtu !== 'all') {
    crumbs.push({ label: Number(currentBtu).toLocaleString() + ' BTU', action: 'btu', val: currentBtu });
  }

  if (currentBrand !== 'all') {
    crumbs.push({ label: currentBrand, action: 'brand-tree', val: currentBrand });
  }

  if (selectedWidths.size > 0) {
    selectedWidths.forEach(w => {
      crumbs.push({ label: w + ' Width', action: 'selectedWidth', val: w });
    });
  }

  if (selectedBtus.size > 0) {
    selectedBtus.forEach(b => {
      crumbs.push({ label: Number(b).toLocaleString() + ' BTU', action: 'selectedBtu', val: b });
    });
  }

  if (selectedAfue.size > 0) {
    selectedAfue.forEach(a => {
      crumbs.push({ label: a === '80%' ? '80% AFUE' : '92%+ AFUE', action: 'selectedAfue', val: a });
    });
  }

  if (selectedBrands.size > 0) {
    selectedBrands.forEach(b => {
      crumbs.push({ label: b, action: 'brand', val: b });
    });
  }

  if (filterRebatesOnly) {
    crumbs.push({ label: 'Rebates Qualified', action: 'rebate' });
  }

  if (currentSearch) {
    crumbs.push({ label: '"' + currentSearch + '"', action: 'search' });
  }

  let html = '';
  if (crumbs.length === 1) {
    html = `
      <span class="crumb-root-indicator">
        <svg class="svg-icon" style="width:13px; height:13px; color:var(--rich-blue-electric);"><use href="#icon-home"></use></svg>
        <span>All Equipment Catalog</span>
      </span>
    `;
  } else {
    crumbs.forEach((c, idx) => {
      const isLast = idx === crumbs.length - 1;
      if (idx > 0) {
        html += `<span class="crumb-separator">&rsaquo;</span>`;
      }
      if (isLast) {
        html += `<span class="crumb-current" aria-current="page">${c.label}</span>`;
      } else {
        html += `
          <button type="button" class="crumb-link" data-action="${c.action}" data-val="${c.val || ''}">
            <span>${c.label}</span>
          </button>
        `;
      }
    });

    html += `
      <button type="button" class="crumb-link crumb-clear-all" id="crumbClearAllBtn">
        <span>Clear All &times;</span>
      </button>
    `;
  }

  trailContainer.innerHTML = html;

  trailContainer.querySelectorAll('.crumb-link, #crumbClearAllBtn').forEach(btn => {
    btn.addEventListener('click', () => {
      const act = btn.getAttribute('data-action');
      const val = btn.getAttribute('data-val');

      if (btn.id === 'crumbClearAllBtn' || act === 'root') {
        resetAllFilters();
        return;
      }
      if (act === 'brand-tree') {
        // Leaf level, keep selection
      } else if (act === 'sector') {
        currentBrand = 'all';
        currentCategory = 'all';
        currentStage = 'all';
        currentAirflow = 'all';
        currentAfue = 'all';
        currentWidth = 'all';
        currentBtu = 'all';
      } else if (act === 'category') {
        currentBrand = 'all';
        currentStage = 'all';
        currentAirflow = 'all';
        currentAfue = 'all';
        currentWidth = 'all';
        currentBtu = 'all';
      } else if (act === 'stage') {
        currentBrand = 'all';
        currentAirflow = 'all';
        currentAfue = 'all';
        currentWidth = 'all';
        currentBtu = 'all';
      } else if (act === 'airflow') {
        currentBrand = 'all';
        currentAfue = 'all';
        currentWidth = 'all';
        currentBtu = 'all';
      } else if (act === 'afue') {
        currentBrand = 'all';
        currentWidth = 'all';
        currentBtu = 'all';
      } else if (act === 'width') {
        currentBrand = 'all';
        currentBtu = 'all';
      } else if (act === 'btu') {
        currentBrand = 'all';
      } else if (act === 'selectedWidth') {
        selectedWidths.delete(val);
      } else if (act === 'selectedBtu') {
        selectedBtus.delete(val);
      } else if (act === 'selectedAfue') {
        selectedAfue.delete(val);
      } else if (act === 'brand') {
        selectedBrands.delete(val);
      } else if (act === 'rebate') {
        filterRebatesOnly = false;
      } else if (act === 'search') {
        currentSearch = '';
        const sInput = document.querySelector('#catalogSearchInput');
        if (sInput) sInput.value = '';
      }

      currentPage = 1;
      syncMobileCatChips();
      syncFacetedCheckboxes();
      renderBreadcrumbs();
      renderCatalog();
      initRockAutoTree();
      updateMobileFilterBadge();
    });
  });
}

function filterProducts() {
  return HVAC_PRODUCTS.filter(p => {
    const sec = getProductSector(p);
    if (currentSector !== 'all' && sec !== currentSector) {
      return false;
    }

    if (currentBrand !== 'all') {
      if (p.brand.toLowerCase() !== currentBrand.toLowerCase()) {
        return false;
      }
    }

    if (currentCategory !== 'all') {
      if (currentCategory === 'furnaces') {
        const isFurnace = p.category === 'furnaces' || 
          (p.category === 'systems' && (p.name.toLowerCase().includes('furnace') || p.name.toLowerCase().includes('boiler'))) || 
          (p.originalCategory && p.originalCategory.toLowerCase().includes('furnace'));
        if (!isFurnace) return false;
      } else if (currentCategory === 'commercial') {
        if (sec !== 'commercial') return false;
      } else if (p.category !== currentCategory) {
        return false;
      }
    }

    if (currentStage !== 'all') {
      const stage = getProductStage(p);
      if (stage !== currentStage) return false;
    }

    if (currentAirflow !== 'all') {
      const airflow = getProductAirflow(p);
      if (airflow !== 'multipoise' && airflow !== currentAirflow) return false;
    }

    if (currentAfue !== 'all') {
      const eff = (p.efficiency || '').toLowerCase();
      if (currentAfue === '80%' && !eff.includes('80%')) return false;
      if (currentAfue === 'high' && (eff.includes('80%') || eff.includes('standard'))) return false;
    } else if (selectedAfue.size > 0) {
      const eff = (p.efficiency || '').toLowerCase();
      let match = false;
      if (selectedAfue.has('80%') && eff.includes('80%')) match = true;
      if (selectedAfue.has('high') && !eff.includes('80%') && !eff.includes('standard')) match = true;
      if (!match) return false;
    }

    if (currentWidth !== 'all') {
      const w = getProductWidth(p);
      if (normalizeWidth(w) !== normalizeWidth(currentWidth)) return false;
    } else if (selectedWidths.size > 0) {
      const wNorm = normalizeWidth(getProductWidth(p));
      let match = false;
      for (const sw of selectedWidths) {
        if (normalizeWidth(sw) === wNorm) {
          match = true;
          break;
        }
      }
      if (!match) return false;
    }

    if (currentBtu !== 'all') {
      const btu = getProductBtu(p);
      const target = parseInt(currentBtu, 10);
      if (Math.abs(btu - target) > 5000) return false;
    } else if (selectedBtus.size > 0) {
      const btu = getProductBtu(p);
      let match = false;
      for (const targetStr of selectedBtus) {
        const target = parseInt(targetStr, 10);
        if (Math.abs(btu - target) <= 5000) {
          match = true;
          break;
        }
      }
      if (!match) return false;
    }

    if (selectedBrands.size > 0) {
      let match = false;
      for (const b of selectedBrands) {
        const bLower = b.toLowerCase();
        if (p.brand.toLowerCase() === bLower) {
          match = true;
          break;
        }
        if (p.category === 'parts' || p.is_part) {
          const text = ((p.name || '') + ' ' + (p.spot_text || '') + ' ' + (p.originalCategory || '')).toLowerCase();
          if (text.includes('universal') || text.includes(bLower)) {
            match = true;
            break;
          }
        }
      }
      if (!match) return false;
    }

    if (filterRebatesOnly && !isProductRebateEligible(p)) {
      return false;
    }

    if (currentSearch) {
      const q = currentSearch.toLowerCase();
      const matchName = (p.name || '').toLowerCase().includes(q);
      const matchBrand = (p.brand || '').toLowerCase().includes(q);
      const matchCat = (p.category || '').toLowerCase().includes(q);
      const matchTag = (p.tag || '').toLowerCase().includes(q);
      const matchSpot = (p.spot_text || '').toLowerCase().includes(q);
      const matchEff = (p.efficiency || '').toLowerCase().includes(q);
      let matchSpecs = false;
      if (p.specs) {
        matchSpecs = Object.values(p.specs).some(val => (val || '').toLowerCase().includes(q));
      }
      if (!matchName && !matchBrand && !matchCat && !matchTag && !matchSpot && !matchEff && !matchSpecs) {
        return false;
      }
    }

    return true;
  });
}

function sortProducts(prods) {
  const sorted = [...prods];
  if (currentSort === 'price-low' || currentSort === 'price-asc') {
    sorted.sort((a, b) => (a.price_from || 0) - (b.price_from || 0));
  } else if (currentSort === 'price-high' || currentSort === 'price-desc') {
    sorted.sort((a, b) => (b.price_from || 0) - (a.price_from || 0));
  } else if (currentSort === 'rating' || currentSort === 'rating-desc') {
    sorted.sort((a, b) => (b.avgRating || 0) - (a.avgRating || 0));
  } else if (currentSort === 'name-asc') {
    sorted.sort((a, b) => a.name.localeCompare(b.name));
  }
  return sorted;
}

function renderCatalog() {
  const grid = document.querySelector('#productsCatalogGrid');
  const emptyState = document.querySelector('#catalogEmptyState');
  const countDisplay = document.querySelector('#catalogResultCount');
  if (!grid) return;

  const filtered = filterProducts();
  const sorted = sortProducts(filtered);
  const totalItems = sorted.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;

  if (currentPage > totalPages) currentPage = 1;

  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedItems = sorted.slice(startIndex, startIndex + itemsPerPage);

  if (countDisplay) {
    if (totalItems === 0) {
      countDisplay.textContent = '0 items found';
    } else {
      const from = startIndex + 1;
      const to = Math.min(startIndex + itemsPerPage, totalItems);
      countDisplay.textContent = 'Showing ' + from + '-' + to + ' of ' + totalItems + ' items';
    }
  }

  if (totalItems === 0) {
    grid.innerHTML = '';
    if (emptyState) emptyState.style.display = 'block';
    renderPagination(0, 0);
    return;
  }

  if (emptyState) emptyState.style.display = 'none';

  if (currentViewMode === 'list') {
    grid.innerHTML = paginatedItems.map(p => {
      const hasRebate = isProductRebateEligible(p);
      const stage = getProductStage(p);
      const airflow = getProductAirflow(p);
      const width = getProductWidth(p);
      const stageLabel = stage === 'single' ? 'Single Stage' : stage === 'two' ? 'Two Stage' : 'Variable';
      const airflowLabel = airflow === 'downflow' ? 'Downflow' : 'Upflow';
      const sector = getProductSector(p);

      const stampOverlayHtml = p.isDiscontinued ? `
        <div class="stamp-overlay-wrapper">
          <div class="stamp-badge-red">Discontinued</div>
          ${p.discontinuedType === 'alternative' ? '<div class="stamp-badge-alt-green">SEE Alternative Replacement</div>' : ''}
        </div>
      ` : '';

      const altBannerHtml = (p.isDiscontinued && p.alternativeItemNumber) ? `
        <div class="card-alt-item-banner" data-alt-id="${p.alternativeProductId || ''}" title="Click to inspect alternative replacement specification">
          <svg class="svg-icon" style="width:14px; height:14px; color:#38bdf8;"><use href="#icon-arrow-right"></use></svg>
          Alternative ITEM NUMBER: <strong>${p.alternativeItemNumber}</strong>
        </div>
      ` : '';

      const priceFormatted = p.price_from ? '$' + Number(p.price_from).toFixed(2) : '$149.99';
      let priceDisplayHtml = '';
      if (currentRoleMode === 'employee') {
        priceDisplayHtml = `<div class="list-row-price" style="color:#34d399;">${priceFormatted} <span style="font-size:0.75rem; color:#38bdf8; font-weight:700;">(Tech Cost)</span></div>`;
      } else {
        if (p.isDiscontinued) {
          priceDisplayHtml = `<div class="list-row-price"><span style="text-decoration:line-through; opacity:0.65; color:#94a3b8;">${priceFormatted}</span></div>`;
        } else {
          priceDisplayHtml = `<div class="list-row-price">${priceFormatted}</div>`;
        }
      }

      let actionsHtml = '';
      if (currentRoleMode === 'consumer') {
        if (p.isDiscontinued) {
          actionsHtml = `
            <a href="product-detail.html?id=${p.id}" class="btn" style="background:transparent; color:#fff; border:1px solid rgba(255,255,255,0.2); padding:6px 12px; border-radius:4px; font-size:0.8rem; display:flex; align-items:center; gap:4px;">
              <svg class="svg-icon" style="width:14px; height:14px;"><use href="#icon-eye"></use></svg>
              Specs
            </a>
            <a href="tel:8155560660" class="btn btn-urgent-dispatch" style="padding:6px 10px; border-radius:4px; font-size:0.74rem; text-decoration:none;">
              <svg class="svg-icon" style="width:12px; height:12px;"><use href="#icon-phone"></use></svg>
              24/7 Dispatch (815) 556-0660
            </a>
          `;
        } else {
          actionsHtml = `
            <a href="product-detail.html?id=${p.id}" class="btn" style="background:transparent; color:#fff; border:1px solid rgba(255,255,255,0.2); padding:6px 12px; border-radius:4px; font-size:0.8rem; display:flex; align-items:center; gap:4px;">
              <svg class="svg-icon" style="width:14px; height:14px;"><use href="#icon-eye"></use></svg>
              Specs
            </a>
            <button type="button" class="btn btn-request-quote" data-id="${p.id}" data-name="${p.name}" style="background:#ff523b; color:#fff; border:none; padding:6px 12px; border-radius:4px; font-size:0.8rem; font-weight:800;">Quote</button>
          `;
        }
      } else {
        actionsHtml = `
          <a href="product-detail.html?id=${p.id}" class="btn" style="background:rgba(2,132,199,0.2); color:#38bdf8; border:1px solid rgba(56,189,248,0.4); padding:6px 12px; border-radius:4px; font-size:0.8rem; display:flex; align-items:center; gap:4px;">
            <svg class="svg-icon" style="width:14px; height:14px;"><use href="#icon-eye"></use></svg>
            Tech Specs
          </a>
        `;
      }

      const empPanelHtml = currentRoleMode === 'employee' ? `
        <div class="employee-ctrl-panel" style="margin-top:12px;">
          <div class="panel-title">
            <span>Field Tech Work Order Control</span>
            <span style="color:#10b981; font-weight:700;">● Naperville Depot</span>
          </div>
          <div class="employee-row-item">
            <span class="label">Part Only Installed:</span>
            <span class="value" style="font-size:0.95rem; font-weight:900; color:#38bdf8;">$${(p.installedPrice || 505.00).toFixed(2)}</span>
          </div>
          <div class="employee-row-item">
            <span class="label">Special Order:</span>
            <span class="value" style="color:${p.specialOrder ? '#f59e0b' : '#10b981'}; font-weight:800;">${p.specialOrder ? 'Yes (Special Order 1-2 Days)' : 'No (In Truck Stock)'}</span>
          </div>
          <div class="employee-vendors">
            <span class="vendor-label">Vendor / Supplier:</span>
            <div class="vendor-links-list">
              ${(p.vendors && p.vendors.length > 0) ? p.vendors.map(v => `
                <div style="margin-bottom:3px; display:flex; justify-content:space-between; align-items:center;">
                  <a href="${v.mapLink || '#'}" target="_blank" rel="noopener" class="vendor-link" style="color:#67e8f9; text-decoration:underline;">${v.name}</a>
                  <span style="color:#94a3b8; font-size:0.72rem;">Stock: <strong style="color:#fff;">${v.stock}</strong> &bull; ${v.phone}</span>
                </div>
              `).join('') : `
                <div style="margin-bottom:3px; display:flex; justify-content:space-between; align-items:center;">
                  <a href="https://maps.google.com/?q=Ferguson+Naperville+IL" target="_blank" rel="noopener" class="vendor-link" style="color:#67e8f9; text-decoration:underline;">Ferguson Naperville</a>
                  <span style="color:#94a3b8; font-size:0.72rem;">Stock: <strong style="color:#fff;">4 Avail</strong> &bull; (630) 555-0199</span>
                </div>
                <div style="display:flex; justify-content:space-between; align-items:center;">
                  <a href="https://maps.google.com/?q=Johnstone+Supply+Naperville+IL" target="_blank" rel="noopener" class="vendor-link" style="color:#67e8f9; text-decoration:underline;">Johnstone Supply Naperville/Joliet</a>
                  <span style="color:#94a3b8; font-size:0.72rem;">Stock: <strong style="color:#fff;">2 Avail</strong> &bull; (815) 555-0144</span>
                </div>
              `}
            </div>
          </div>
          <div class="employee-action-row">
            <button type="button" class="btn-emp btn-emp-modify" data-id="${p.id}">Modify Price</button>
            <button type="button" class="btn-emp btn-emp-quote" data-id="${p.id}" data-name="${p.name}">Send Quote</button>
            <button type="button" class="btn-emp btn-emp-cart" data-id="${p.id}" data-name="${p.name}">Add To Cart</button>
          </div>
          <div class="employee-modify-box" id="empModifyBox-${p.id}">
            <div class="modify-input-group">
              <label style="font-size:0.75rem; color:#94a3b8; align-self:center;">Modify Our Price: $</label>
              <input type="number" step="0.01" class="emp-price-input" id="empPriceInput-${p.id}" value="${(p.price_from || 149.99).toFixed(2)}">
              <button type="button" class="btn-save-modify" data-id="${p.id}">Save</button>
            </div>
          </div>
          <div class="employee-flags-row" style="margin-top:8px;">
            <div class="flag-badge ${p.isDiscontinued ? '' : 'flag-inactive'}" data-flag="discontinued" data-id="${p.id}" style="cursor:pointer;" title="Click to toggle Discontinued flag">
              <span>Flag: DISCONTINUED</span>
              <span style="font-size:0.65rem; opacity:0.85;">${p.isDiscontinued ? 'ACTIVE' : 'OFF'}</span>
            </div>
            ${(p.discontinuedType === 'alternative' || p.alternativeItemNumber) ? `
              <div class="flag-badge flag-alt" data-flag="alt" data-id="${p.id}" style="cursor:pointer;" title="Click to toggle Alternative flag">
                <span>Flag: DISCONTINUED (See ALT)</span>
                <span style="font-size:0.65rem; opacity:0.85;">#${p.alternativeItemNumber || '123ABC456'}</span>
              </div>
            ` : ''}
          </div>
        </div>
      ` : '';

      return `
        <article class="product-list-row" data-id="${p.id}">
          <div class="list-row-top">
            <div class="list-row-thumb" style="position:relative; overflow:hidden;">
              <img src="${p.primaryImage}" alt="${p.name}" loading="lazy">
              ${stampOverlayHtml}
            </div>
            <div class="list-row-info">
              <div class="list-row-brand">${p.brand} &bull; <span style="text-transform:capitalize;">${sector}</span></div>
              <h3 class="list-row-title"><a href="product-detail.html?id=${p.id}" style="text-decoration:none; color:inherit;">${p.name}</a></h3>
              <div style="font-size: 0.8rem; color: #b0c4de; margin-top:4px;">${p.spot_text || p.primaryCaption || 'Smart thermostat with remote access and scheduling'}</div>
              <div class="list-row-badges">
                ${hasRebate ? '<span class="card-tag" style="background:#ff1e8e; color:#fff; padding:3px 9px; border-radius:3px; font-size:0.7rem; font-weight:800;">SPRING SALE</span>' : ''}
                <span class="list-badge-eff">${p.efficiency || 'High-Efficiency'}</span>
              </div>
            </div>
          </div>
          ${altBannerHtml}
          <div class="list-row-specs">
            <div class="spec-mini-item"><strong>Stage</strong><span>${stageLabel}</span></div>
            <div class="spec-mini-item"><strong>Airflow</strong><span>${airflowLabel}</span></div>
            <div class="spec-mini-item"><strong>Width</strong><span>${width}</span></div>
            <div class="spec-mini-item"><strong>BTU</strong><span>${p.btu || 'N/A'}</span></div>
          </div>
          <div class="list-row-actions">
            <div>
              <div style="font-size:0.75rem; color:var(--text-muted); text-transform:uppercase; font-weight:700;">From</div>
              ${priceDisplayHtml}
            </div>
            <div style="display:flex; gap:8px; align-items:center;">
              ${actionsHtml}
            </div>
          </div>
          ${empPanelHtml}
        </article>
      `;
    }).join('');
  } else {
    grid.innerHTML = paginatedItems.map(p => {
      const hasRebate = isProductRebateEligible(p);
      const stage = getProductStage(p);
      const airflow = getProductAirflow(p);
      const width = getProductWidth(p);
      const stageLabel = stage === 'single' ? 'Single Stage' : stage === 'two' ? 'Two Stage' : 'Variable Modulating';
      const airflowLabel = airflow === 'downflow' ? 'Down Flow' : 'Up Flow';
      const sector = getProductSector(p);

      const stampOverlayHtml = p.isDiscontinued ? `
        <div class="stamp-overlay-wrapper">
          <div class="stamp-badge-red">Discontinued</div>
          ${p.discontinuedType === 'alternative' ? '<div class="stamp-badge-alt-green">SEE Alternative Replacement</div>' : ''}
        </div>
      ` : '';

      const altBannerHtml = (p.isDiscontinued && p.alternativeItemNumber) ? `
        <div class="card-alt-item-banner" data-alt-id="${p.alternativeProductId || ''}" title="Click to inspect alternative replacement specification">
          <svg class="svg-icon" style="width:14px; height:14px; color:#38bdf8;"><use href="#icon-arrow-right"></use></svg>
          Alternative ITEM NUMBER: <strong>${p.alternativeItemNumber}</strong>
        </div>
      ` : '';

      const priceFormatted = p.price_from ? '$' + Number(p.price_from).toFixed(2) : '$149.99';
      let priceDisplayHtml = '';
      if (currentRoleMode === 'employee') {
        priceDisplayHtml = `<span style="color:#34d399; font-weight:800; font-size:1.15rem;">From ${priceFormatted}</span> <span style="font-size:0.75rem; color:#38bdf8; font-weight:700;">(Tech Cost)</span>`;
      } else {
        if (p.isDiscontinued) {
          priceDisplayHtml = `<span style="color:#fff; font-weight:800; font-size:1.15rem;">From <span style="text-decoration:line-through; opacity:0.65; color:#94a3b8;">${priceFormatted}</span></span>`;
        } else {
          priceDisplayHtml = `<span style="color:#fff; font-weight:800; font-size:1.15rem;">From ${priceFormatted}</span>`;
        }
      }

      let footerButtonsHtml = '';
      if (currentRoleMode === 'consumer') {
        if (p.isDiscontinued) {
          footerButtonsHtml = `
            <div class="product-card-footer" style="display:grid; grid-template-columns:1fr 1.35fr; gap:8px; padding:0; border:none; background:transparent;">
              <a href="product-detail.html?id=${p.id}" class="btn" style="background:transparent; color:#fff; font-weight:800; border:1px solid rgba(255,255,255,0.25); display:flex; align-items:center; justify-content:center; gap:6px; padding:8px 6px; border-radius:6px; font-size:0.8rem;">
                <svg class="svg-icon" style="width:14px; height:14px;"><use href="#icon-eye"></use></svg>
                View Specs
              </a>
              <a href="tel:8155560660" class="btn btn-urgent-dispatch" style="padding:8px 6px; border-radius:6px; font-size:0.73rem; text-decoration:none;">
                <svg class="svg-icon" style="width:13px; height:13px;"><use href="#icon-phone"></use></svg>
                24/7 URGENT DISPATCH (815) 556-0660
              </a>
            </div>
          `;
        } else {
          footerButtonsHtml = `
            <div class="product-card-footer" style="display:grid; grid-template-columns:1fr 1fr; gap:10px; padding:0; border:none; background:transparent;">
              <a href="product-detail.html?id=${p.id}" class="btn" style="background:#ff523b; color:#fff; font-weight:800; border:none; display:flex; align-items:center; justify-content:center; gap:6px; padding:8px; border-radius:6px;">
                <svg class="svg-icon" style="width:16px; height:16px;"><use href="#icon-eye"></use></svg>
                View Specs
              </a>
              <button type="button" class="btn btn-request-quote" data-id="${p.id}" data-name="${p.name}" style="background:transparent; color:#fff; font-weight:800; border:1px solid rgba(255,255,255,0.2); padding:8px; border-radius:6px; transition:all 0.2s;">Quote</button>
            </div>
          `;
        }
      } else {
        footerButtonsHtml = `
          <div class="product-card-footer" style="display:grid; grid-template-columns:1fr; gap:8px; padding:0; border:none; background:transparent;">
            <a href="product-detail.html?id=${p.id}" class="btn" style="background:rgba(2,132,199,0.2); color:#38bdf8; font-weight:800; border:1px solid rgba(56,189,248,0.4); display:flex; align-items:center; justify-content:center; gap:6px; padding:8px; border-radius:6px; font-size:0.82rem;">
              <svg class="svg-icon" style="width:14px; height:14px;"><use href="#icon-eye"></use></svg>
              View Tech Specs &amp; Schematics
            </a>
          </div>
        `;
      }

      const employeePanelHtml = currentRoleMode === 'employee' ? `
        <div class="employee-ctrl-panel">
          <div class="panel-title">
            <span>Field Tech Work Order Control</span>
            <span style="color:#10b981; font-weight:700;">● Naperville Depot</span>
          </div>
          
          <div class="employee-row-item">
            <span class="label">Part Only Installed:</span>
            <span class="value" style="font-size:0.95rem; font-weight:900; color:#38bdf8;">$${(p.installedPrice || 505.00).toFixed(2)}</span>
          </div>

          <div class="employee-row-item">
            <span class="label">Special Order:</span>
            <span class="value" style="color:${p.specialOrder ? '#f59e0b' : '#10b981'}; font-weight:800;">${p.specialOrder ? 'Yes (Special Order 1-2 Days)' : 'No (In Truck Stock)'}</span>
          </div>

          <div class="employee-vendors">
            <span class="vendor-label">Vendor / Supplier:</span>
            <div class="vendor-links-list">
              ${(p.vendors && p.vendors.length > 0) ? p.vendors.map(v => `
                <div style="margin-bottom:3px; display:flex; justify-content:space-between; align-items:center;">
                  <a href="${v.mapLink || '#'}" target="_blank" rel="noopener" class="vendor-link" style="color:#67e8f9; text-decoration:underline;">${v.name}</a>
                  <span style="color:#94a3b8; font-size:0.72rem;">Stock: <strong style="color:#fff;">${v.stock}</strong> &bull; ${v.phone}</span>
                </div>
              `).join('') : `
                <div style="margin-bottom:3px; display:flex; justify-content:space-between; align-items:center;">
                  <a href="https://maps.google.com/?q=Ferguson+Naperville+IL" target="_blank" rel="noopener" class="vendor-link" style="color:#67e8f9; text-decoration:underline;">Ferguson Naperville</a>
                  <span style="color:#94a3b8; font-size:0.72rem;">Stock: <strong style="color:#fff;">4 Avail</strong> &bull; (630) 555-0199</span>
                </div>
                <div style="display:flex; justify-content:space-between; align-items:center;">
                  <a href="https://maps.google.com/?q=Johnstone+Supply+Naperville+IL" target="_blank" rel="noopener" class="vendor-link" style="color:#67e8f9; text-decoration:underline;">Johnstone Supply Naperville/Joliet</a>
                  <span style="color:#94a3b8; font-size:0.72rem;">Stock: <strong style="color:#fff;">2 Avail</strong> &bull; (815) 555-0144</span>
                </div>
              `}
            </div>
          </div>

          <div class="employee-action-row">
            <button type="button" class="btn-emp btn-emp-modify" data-id="${p.id}">
              Modify Price
            </button>
            <button type="button" class="btn-emp btn-emp-quote" data-id="${p.id}" data-name="${p.name}">
              Send Quote
            </button>
            <button type="button" class="btn-emp btn-emp-cart" data-id="${p.id}" data-name="${p.name}">
              Add To Cart
            </button>
          </div>

          <div class="employee-modify-box" id="empModifyBox-${p.id}">
            <div class="modify-input-group">
              <label style="font-size:0.75rem; color:#94a3b8; align-self:center;">Modify Our Price: $</label>
              <input type="number" step="0.01" class="emp-price-input" id="empPriceInput-${p.id}" value="${(p.price_from || 149.99).toFixed(2)}">
              <button type="button" class="btn-save-modify" data-id="${p.id}">Save</button>
            </div>
          </div>

          <div class="employee-flags-row" style="margin-top:8px;">
            <div class="flag-badge ${p.isDiscontinued ? '' : 'flag-inactive'}" data-flag="discontinued" data-id="${p.id}" style="cursor:pointer;" title="Click to toggle Discontinued flag">
              <span>Flag: DISCONTINUED</span>
              <span style="font-size:0.65rem; opacity:0.85;">${p.isDiscontinued ? 'ACTIVE' : 'OFF'}</span>
            </div>
            ${(p.discontinuedType === 'alternative' || p.alternativeItemNumber) ? `
              <div class="flag-badge flag-alt" data-flag="alt" data-id="${p.id}" style="cursor:pointer;" title="Click to toggle Alternative flag">
                <span>Flag: DISCONTINUED (See ALT)</span>
                <span style="font-size:0.65rem; opacity:0.85;">#${p.alternativeItemNumber || '123ABC456'}</span>
              </div>
            ` : ''}
          </div>
        </div>
      ` : '';

      return `
        <article class="product-card" data-id="${p.id}" style="display:flex; flex-direction:column; height:100%;">
          <div class="product-card-thumb" style="position:relative; background:#fff; padding:12px; border-radius: var(--radius-sm) var(--radius-sm) 0 0; overflow:hidden;">
            <img src="${p.primaryImage}" alt="${p.name}" loading="lazy" style="width:100%; height:180px; object-fit:contain;">
            ${hasRebate ? '<span class="card-rebate-tag" style="position:absolute; top:8px; left:8px; background:#ff1e8e; color:#fff; font-size:0.7rem; font-weight:800; padding:4px 8px; border-radius:3px; z-index:2;">SPRING SALE - 15% OFF</span>' : '<span class="card-tag" style="position:absolute; top:8px; left:8px; background:#ff1e8e; color:#fff; font-size:0.7rem; font-weight:800; padding:4px 8px; border-radius:3px; z-index:2;">SPRING SALE - 15% OFF</span>'}
            <span class="card-brand-overlay" style="position:absolute; bottom:8px; right:8px; background:rgba(8,17,38,0.7); color:#00d4ff; font-weight:900; font-size:0.75rem; text-transform:uppercase; letter-spacing:0.05em; padding:4px 8px; border-radius:3px; z-index:2;">${p.brand}</span>
            ${stampOverlayHtml}
          </div>

          ${altBannerHtml}

          <div class="product-card-body" style="padding:16px; flex:1; display:flex; flex-direction:column;">
            <div style="margin-bottom:8px;">
              ${priceDisplayHtml}
            </div>
            
            <div style="font-size:0.7rem; color:var(--text-muted); text-transform:uppercase; margin-bottom:4px; font-weight:600;">
              Product: ${p.category || 'Equipment'} &nbsp;|&nbsp; Series #: ${p.series || 'Standard'}
            </div>
            
            <h3 class="product-card-title" style="font-size:1.1rem; font-weight:800; line-height:1.3; margin-bottom:10px; color:#fff;">${p.name}</h3>
            
            <div class="card-stars" style="display:flex; align-items:center; gap:6px; color:#ff9800; font-size:0.85rem; font-weight:800; margin-bottom:12px;">
              <div style="display:flex; gap:2px;">
                <svg class="svg-icon" style="width:12px; height:12px;"><use href="#icon-star"></use></svg>
                <svg class="svg-icon" style="width:12px; height:12px;"><use href="#icon-star"></use></svg>
                <svg class="svg-icon" style="width:12px; height:12px;"><use href="#icon-star"></use></svg>
                <svg class="svg-icon" style="width:12px; height:12px;"><use href="#icon-star"></use></svg>
                <svg class="svg-icon" style="width:12px; height:12px;"><use href="#icon-star"></use></svg>
              </div>
              <span>${p.avgRating || 4.7}</span>
              <span style="color:#8a9bb8; font-weight:400; font-size:0.8rem;">(${p.reviewCount || 3} reviews)</span>
            </div>

            <div style="font-size:0.75rem; color:#00d4ff; font-weight:700; margin-bottom:8px; line-height:1.4;">
              SPECS: <span style="color:#b0c4de; font-weight:400;">${p.category || 'Equipment'} - ${stageLabel} - ${airflowLabel} - ${p.btu || 'N/A'} BTU ${p.brand}</span>
            </div>

            <p class="product-card-spot" style="color:#b0c4de; font-size:0.85rem; line-height:1.4; margin-bottom:16px;">${p.spot_text || p.primaryCaption || 'Smart thermostat with remote access and scheduling'}</p>
            
            <div style="margin-top:auto; font-size:0.8rem; color:#00d4ff; font-weight:700; border-bottom:1px solid rgba(255,255,255,0.08); padding-bottom:12px; margin-bottom:12px;">
              3 Sizes/Options Available
            </div>
            
            ${footerButtonsHtml}
          </div>

          ${employeePanelHtml}
        </article>
      `;
    }).join('');
  }

  renderPagination(totalItems, totalPages);

  // Wire Quote buttons
  grid.querySelectorAll('.btn-request-quote').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const pName = btn.getAttribute('data-name');
      openQuoteModalWithProduct(pName);
    });
  });

  // Wire Alternative Banner clicks
  grid.querySelectorAll('.card-alt-item-banner').forEach(banner => {
    banner.addEventListener('click', (e) => {
      e.stopPropagation();
      const altId = banner.getAttribute('data-alt-id');
      if (altId) {
        window.location.href = `product-detail.html?id=${encodeURIComponent(altId)}`;
      } else {
        showHvacToast('Redirecting to alternative replacement specifications...', 'info');
      }
    });
  });

  // Wire Employee Action: Send Quote
  grid.querySelectorAll('.btn-emp-quote').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const pName = btn.getAttribute('data-name');
      openQuoteModalWithProduct(pName);
    });
  });

  // Wire Employee Action: Modify Price toggle
  grid.querySelectorAll('.btn-emp-modify').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-id');
      const box = document.querySelector(`#empModifyBox-${id}`);
      if (box) {
        box.classList.toggle('active');
      }
    });
  });

  // Wire Employee Action: Save Modified Price
  grid.querySelectorAll('.btn-save-modify').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-id');
      const input = document.querySelector(`#empPriceInput-${id}`);
      if (input) {
        const newPrice = parseFloat(input.value);
        if (!isNaN(newPrice) && newPrice > 0) {
          const targetProd = HVAC_PRODUCTS.find(x => x.id === id);
          if (targetProd) {
            targetProd.price_from = newPrice;
            showHvacToast(`Price for "${targetProd.name}" updated to $${newPrice.toFixed(2)}.`, 'success');
            renderCatalog();
          }
        }
      }
    });
  });

  // Wire Employee Action: Add To Cart / Truck Requisition
  grid.querySelectorAll('.btn-emp-cart').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const pName = btn.getAttribute('data-name') || 'Item';
      const workOrderId = 'WO-' + Math.floor(100000 + Math.random() * 900000);
      showHvacToast(`Added "${pName}" to Truck Stock requisition (${workOrderId})!`, 'success');
    });
  });

  // Wire Employee Action: Toggle Flags
  grid.querySelectorAll('.flag-badge').forEach(badge => {
    badge.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = badge.getAttribute('data-id');
      const flagType = badge.getAttribute('data-flag');
      const targetProd = HVAC_PRODUCTS.find(x => x.id === id);
      if (targetProd) {
        if (flagType === 'discontinued') {
          targetProd.isDiscontinued = !targetProd.isDiscontinued;
          showHvacToast(`Toggled DISCONTINUED flag: now ${targetProd.isDiscontinued ? 'ACTIVE' : 'OFF'}.`, 'warning');
        } else if (flagType === 'alt') {
          targetProd.discontinuedType = targetProd.discontinuedType === 'alternative' ? 'no_longer_available' : 'alternative';
          showHvacToast(`Alternative flag updated: ${targetProd.discontinuedType}.`, 'info');
        }
        renderCatalog();
      }
    });
  });
}

function renderPagination(totalItems, totalPages) {
  const container = document.querySelector('#catalogPagination');
  if (!container) return;

  if (totalPages <= 1) {
    container.innerHTML = '';
    container.style.display = 'none';
    return;
  }

  container.style.display = 'flex';

  let html = '';
  const isPrevDisabled = currentPage === 1;
  html += `
    <button type="button" class="pagination-btn pagination-prev ${isPrevDisabled ? 'disabled' : ''}" ${isPrevDisabled ? 'disabled' : ''} data-page="${currentPage - 1}" aria-label="Previous Page">
      &larr; Prev
    </button>
  `;

  for (let p = 1; p <= totalPages; p++) {
    const isActive = p === currentPage;
    html += `
      <button type="button" class="pagination-btn ${isActive ? 'active' : ''}" data-page="${p}" aria-label="Page ${p}" ${isActive ? 'aria-current="page"' : ''}>
        ${p}
      </button>
    `;
  }

  const isNextDisabled = currentPage === totalPages;
  html += `
    <button type="button" class="pagination-btn pagination-next ${isNextDisabled ? 'disabled' : ''}" ${isNextDisabled ? 'disabled' : ''} data-page="${currentPage + 1}" aria-label="Next Page">
      Next &rarr;
    </button>
  `;

  container.innerHTML = html;

  container.querySelectorAll('.pagination-btn[data-page]').forEach(btn => {
    btn.addEventListener('click', () => {
      const pageNum = parseInt(btn.getAttribute('data-page'), 10);
      if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages && pageNum !== currentPage) {
        currentPage = pageNum;
        renderCatalog();
        const catalogSec = document.querySelector('#productsCatalogSection');
        if (catalogSec) {
          catalogSec.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    });
  });
}

function initSizingCalculator() {
  const sqftInput = document.querySelector('#calcSqftRange');
  const sqftDisplay = document.querySelector('#calcSqftVal');
  const coolingResult = document.querySelector('#calcCoolingTons');
  const heatingResult = document.querySelector('#calcHeatingBtu');
  const savingsResult = document.querySelector('#calcEstSavings');
  const rebateResult = document.querySelector('#calcRebateEst');

  if (!sqftInput) return;

  function updateEstimates(val) {
    if (sqftDisplay) sqftDisplay.textContent = Number(val).toLocaleString() + ' sq ft';

    let cooling = '2.5 Tons';
    let heating = '60,000 BTU';
    let savings = '$490 / yr';
    let rebate = '$1,200+';

    if (val <= 1400) {
      cooling = '2.0 Tons';
      heating = '45,000 BTU';
      savings = '$380 / yr';
      rebate = '$800+';
    } else if (val <= 2000) {
      cooling = '2.5 Tons';
      heating = '60,000 BTU';
      savings = '$490 / yr';
      rebate = '$1,200+';
    } else if (val <= 2600) {
      cooling = '3.0 - 3.5 Tons';
      heating = '75,000 BTU';
      savings = '$610 / yr';
      rebate = '$1,600+';
    } else if (val <= 3200) {
      cooling = '4.0 Tons';
      heating = '90,000 BTU';
      savings = '$740 / yr';
      rebate = '$2,000+';
    } else {
      cooling = '5.0 Tons / Dual Zone';
      heating = '110,000+ BTU';
      savings = '$920 / yr';
      rebate = '$2,500+';
    }

    if (coolingResult) coolingResult.textContent = cooling;
    if (heatingResult) heatingResult.textContent = heating;
    if (savingsResult) savingsResult.textContent = savings;
    if (rebateResult) rebateResult.textContent = rebate;
  }

  sqftInput.addEventListener('input', (e) => {
    updateEstimates(e.target.value);
  });
}

function openQuoteModalWithProduct(productName) {
  const modal = document.querySelector('#quoteModal');
  const noteInput = document.querySelector('#quoteNotes');
  if (!modal) return;

  if (noteInput && productName) {
    noteInput.value = 'Interested in certified equipment: ' + productName + '. Please include Chicago ComEd/Nicor rebates and installation warranty.';
  }

  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function initQuoteModal() {
  const modal = document.querySelector('#quoteModal');
  const closeBtn = document.querySelector('#quoteModalClose');
  const cancelBtn = document.querySelector('#quoteCancelBtn');
  const form = document.querySelector('#quoteRequestForm');
  const triggerBtns = document.querySelectorAll('.trigger-quote-modal');

  if (!modal) return;

  function closeModal() {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }

  triggerBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
    });
  });

  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (cancelBtn) cancelBtn.addEventListener('click', closeModal);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
      closeModal();
    }
  });

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const submitBtn = form.querySelector('button[type="submit"]');
      const origText = submitBtn ? submitBtn.textContent : 'Send Request';

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting Request...';
      }

      setTimeout(() => {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Quote Submitted!';
        }

        const successMsg = document.createElement('div');
        successMsg.className = 'form-success-alert';
        successMsg.style.cssText = 'background:rgba(0,212,255,0.15); border:1px solid var(--rich-blue-electric); color:#fff; padding:12px 16px; border-radius:6px; margin-top:14px; text-align:center; font-weight:700;';
        successMsg.textContent = 'Thank you! A certified Chicago HVAC specialist will contact you with your custom equipment estimate within 15 minutes.';
        form.appendChild(successMsg);

        setTimeout(() => {
          form.reset();
          successMsg.remove();
          if (submitBtn) submitBtn.textContent = origText;
          closeModal();
        }, 3200);
      }, 1000);
    });
  }
}
