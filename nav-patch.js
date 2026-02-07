// ============= SWIPE GESTURE & NAV OVERHAUL =============
// This file patches the SwissFinanceApp after load

(function() {
    'use strict';
    
    const waitForApp = setInterval(() => {
        if (typeof app === 'undefined' || !app.state) return;
        clearInterval(waitForApp);
        
        console.log('📱 Mobile Nav Overhaul loading...');
        
        // ---- 1. Override renderNavigation() ----
        app.renderNavigation = function() {
            const desktopNav = document.getElementById('desktop-nav');
            const mobileNav = document.getElementById('mobile-nav');

            // Desktop stays the same
            const desktopNavHTML = TABS.map(tab => `
                <div class="desktop-nav-item ${tab.id === this.currentTab ? 'active' : ''}" 
                     data-tab="${tab.id}" 
                     onclick="app.switchTab('${tab.id}')">
                    <span class="nav-icon">${tab.icon}</span>
                    <span>${tab.label}</span>
                </div>
            `).join('');

            // Mobile: new compact pill structure
            const mobileNavHTML = TABS.map(tab => `
                <button class="nav-button ${tab.id === this.currentTab ? 'active' : ''}" 
                        data-tab="${tab.id}" 
                        onclick="app.switchTab('${tab.id}')">
                    <span class="nav-icon">${tab.icon}</span>
                    <span class="nav-label">${tab.label}</span>
                </button>
            `).join('');

            if (desktopNav) desktopNav.innerHTML = desktopNavHTML;
            if (mobileNav) mobileNav.innerHTML = mobileNavHTML;
            
            // Auto-scroll active tab into view
            requestAnimationFrame(() => this.scrollActiveNavIntoView());
        };
        
        // ---- 2. Override switchTab() ----
        const origSwitchTab = app.switchTab.bind(app);
        app.switchTab = function(tabId) {
            this.currentTab = tabId;
            this.renderTab(tabId);
            
            // Update nav buttons
            document.querySelectorAll('.nav-button, .desktop-nav-item').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.tab === tabId);
            });
            
            // Scroll active nav into view (mobile)
            this.scrollActiveNavIntoView();
        };
        
        // ---- 3. New: scrollActiveNavIntoView() ----
        app.scrollActiveNavIntoView = function() {
            const mobileNav = document.getElementById('mobile-nav');
            if (!mobileNav) return;
            
            const activeBtn = mobileNav.querySelector('.nav-button.active');
            if (!activeBtn) return;
            
            // Scroll the active button to center of the nav bar
            const navRect = mobileNav.getBoundingClientRect();
            const btnRect = activeBtn.getBoundingClientRect();
            const scrollLeft = activeBtn.offsetLeft - (navRect.width / 2) + (btnRect.width / 2);
            
            mobileNav.scrollTo({
                left: Math.max(0, scrollLeft),
                behavior: 'smooth'
            });
        };
        
        // ---- 4. New: Swipe Gesture Handler ----
        app.initSwipeGestures = function() {
            const content = document.getElementById('tab-content');
            if (!content) return;
            
            let startX = 0;
            let startY = 0;
            let startTime = 0;
            let isDragging = false;
            
            // Create swipe indicators
            const leftIndicator = document.createElement('div');
            leftIndicator.className = 'swipe-indicator left';
            leftIndicator.textContent = '‹';
            document.body.appendChild(leftIndicator);
            
            const rightIndicator = document.createElement('div');
            rightIndicator.className = 'swipe-indicator right';
            rightIndicator.textContent = '›';
            document.body.appendChild(rightIndicator);
            
            // Create tab toast
            const toast = document.createElement('div');
            toast.className = 'swipe-tab-toast';
            toast.id = 'swipe-tab-toast';
            document.body.appendChild(toast);
            
            const getTabIndex = (tabId) => TABS.findIndex(t => t.id === tabId);
            
            const showToast = (tab) => {
                toast.textContent = `${tab.icon} ${tab.label}`;
                toast.classList.add('visible');
                clearTimeout(toast._timeout);
                toast._timeout = setTimeout(() => toast.classList.remove('visible'), 800);
            };
            
            content.addEventListener('touchstart', (e) => {
                // Don't swipe if touching input, select, button, or scrollable element
                const tag = e.target.tagName.toLowerCase();
                if (['input', 'select', 'textarea', 'button'].includes(tag)) return;
                if (e.target.closest('.modal')) return;
                if (e.target.closest('canvas')) return;
                
                startX = e.touches[0].clientX;
                startY = e.touches[0].clientY;
                startTime = Date.now();
                isDragging = true;
            }, { passive: true });
            
            content.addEventListener('touchmove', (e) => {
                if (!isDragging) return;
                
                const dx = e.touches[0].clientX - startX;
                const dy = e.touches[0].clientY - startY;
                
                // Only show indicator if mostly horizontal
                if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.5) {
                    if (dx > 0) {
                        leftIndicator.classList.add('visible');
                        rightIndicator.classList.remove('visible');
                    } else {
                        rightIndicator.classList.add('visible');
                        leftIndicator.classList.remove('visible');
                    }
                } else {
                    leftIndicator.classList.remove('visible');
                    rightIndicator.classList.remove('visible');
                }
            }, { passive: true });
            
            content.addEventListener('touchend', (e) => {
                if (!isDragging) return;
                isDragging = false;
                
                leftIndicator.classList.remove('visible');
                rightIndicator.classList.remove('visible');
                
                const endX = e.changedTouches[0].clientX;
                const endY = e.changedTouches[0].clientY;
                const dx = endX - startX;
                const dy = endY - startY;
                const dt = Date.now() - startTime;
                
                // Swipe detection: min 60px horizontal, mostly horizontal, under 400ms
                const isSwipe = Math.abs(dx) > 60 && 
                                Math.abs(dx) > Math.abs(dy) * 1.8 && 
                                dt < 400;
                
                if (!isSwipe) return;
                
                const currentIndex = getTabIndex(app.currentTab);
                let newIndex;
                
                if (dx > 0) {
                    // Swipe right → previous tab
                    newIndex = currentIndex > 0 ? currentIndex - 1 : TABS.length - 1;
                } else {
                    // Swipe left → next tab
                    newIndex = currentIndex < TABS.length - 1 ? currentIndex + 1 : 0;
                }
                
                const newTab = TABS[newIndex];
                showToast(newTab);
                app.switchTab(newTab.id);
                
            }, { passive: true });
            
            console.log('👆 Swipe gestures initialized');
        };
        
        // ---- 5. Initialize ----
        // Re-render nav with new structure
        app.renderNavigation();
        
        // Init swipe (only on mobile)
        if (window.innerWidth < 768) {
            app.initSwipeGestures();
        }
        
        // Also init on resize (e.g. rotating phone)
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                if (window.innerWidth < 768 && !document.querySelector('.swipe-indicator')) {
                    app.initSwipeGestures();
                }
            }, 250);
        });
        
        console.log('✅ Mobile Nav Overhaul active');
        
    }, 100);
})();
