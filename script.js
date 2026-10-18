/* ============================================
   شادية — سِحر الحضور وكبرياء الجمال
   Ultra-Lightweight Mobile Book Engine (60 FPS)
   ============================================ */

(function () {
    'use strict';

    // ===== CONFIGURATION =====
    const TOTAL_PAGES = 6;
    const SWIPE_THRESHOLD = 40; // minimum px to trigger flip

    // ===== STATE =====
    let currentPage = 1;
    let isFlipping = false;
    let introOpen = false;

    // Touch variables
    let touchStartX = 0;
    let touchStartY = 0;
    let touchEndX = 0;

    // ===== DOM ELEMENTS =====
    const introScreen = document.getElementById('introScreen');
    const giftWrap = document.getElementById('giftWrap');
    const giftBox = document.getElementById('giftBox');
    const bookContainer = document.getElementById('bookContainer');
    const book = document.getElementById('book');
    const navNext = document.getElementById('navNext');
    const navPrev = document.getElementById('navPrev');
    const pageDots = document.getElementById('pageDots');
    const currentNum = document.getElementById('currentNum');
    const totalNum = document.getElementById('totalNum');
    const swipeHint = document.getElementById('swipeHint');

    // ===== INITIALIZATION =====
    function init() {
        totalNum.textContent = TOTAL_PAGES;
        buildDots();
        setupIntro();
        setupNavigation();
        setupGestures();

        // Show first page
        const firstPage = document.getElementById('page-1');
        if (firstPage) firstPage.classList.add('visible');
        updateUI();
    }

    // ===== DOTS CREATION =====
    function buildDots() {
        pageDots.innerHTML = '';
        for (let i = 1; i <= TOTAL_PAGES; i++) {
            const dot = document.createElement('div');
            dot.className = 'dot' + (i === 1 ? ' active' : '');
            dot.setAttribute('role', 'button');
            dot.setAttribute('aria-label', `الانتقال إلى صفحة ${i}`);
            dot.addEventListener('click', (e) => {
                e.stopPropagation();
                goToPage(i);
            });
            pageDots.appendChild(dot);
        }
    }

    function updateUI() {
        currentNum.textContent = currentPage;

        // Update Dots
        const dots = pageDots.querySelectorAll('.dot');
        dots.forEach((dot, idx) => {
            dot.classList.toggle('active', idx + 1 === currentPage);
        });

        // Update Nav Buttons
        navPrev.classList.toggle('disabled', currentPage <= 1);
        navNext.classList.toggle('disabled', currentPage >= TOTAL_PAGES);
    }

    // ===== INTRO UNWRAP (Zero-lag) =====
    function setupIntro() {
        function triggerOpen() {
            if (introOpen) return;
            introOpen = true;

            giftBox.style.transform = 'scale3d(1.1, 1.1, 1)';
            setTimeout(() => {
                giftBox.style.transform = 'scale3d(0.85, 0.85, 1)';
            }, 120);

            setTimeout(() => {
                introScreen.classList.add('hide');
                bookContainer.classList.remove('hidden');

                // Auto-dismiss swipe hint after 3 seconds
                setTimeout(() => {
                    if (swipeHint) swipeHint.classList.add('fade-out');
                }, 3000);
            }, 300);
        }

        giftWrap.addEventListener('click', triggerOpen);
        giftWrap.addEventListener('touchend', (e) => {
            e.preventDefault();
            triggerOpen();
        }, { passive: false });
    }

    // ===== PAGE FLIP ENGINE =====
    function flipNext() {
        if (isFlipping || currentPage >= TOTAL_PAGES) return;
        isFlipping = true;

        if (swipeHint) swipeHint.classList.add('fade-out');

        const activePage = document.getElementById(`page-${currentPage}`);
        const nextPage = document.getElementById(`page-${currentPage + 1}`);

        if (activePage) {
            activePage.classList.add('flipped');
        }

        if (nextPage) {
            nextPage.classList.add('visible');
        }

        setTimeout(() => {
            currentPage++;
            updateUI();
            isFlipping = false;
        }, 450);
    }

    function flipPrev() {
        if (isFlipping || currentPage <= 1) return;
        isFlipping = true;

        const prevPage = document.getElementById(`page-${currentPage - 1}`);
        const activePage = document.getElementById(`page-${currentPage}`);

        if (prevPage) {
            prevPage.classList.remove('flipped');
            prevPage.classList.add('visible');
        }

        setTimeout(() => {
            if (activePage) {
                activePage.classList.remove('visible');
            }
            currentPage--;
            updateUI();
            isFlipping = false;
        }, 450);
    }

    function goToPage(target) {
        if (isFlipping || target === currentPage || target < 1 || target > TOTAL_PAGES) return;
        isFlipping = true;

        if (swipeHint) swipeHint.classList.add('fade-out');

        for (let i = 1; i <= TOTAL_PAGES; i++) {
            const p = document.getElementById(`page-${i}`);
            if (!p) continue;

            if (i < target) {
                p.classList.add('flipped');
                p.classList.remove('visible');
            } else if (i === target) {
                p.classList.remove('flipped');
                p.classList.add('visible');
            } else {
                p.classList.remove('flipped');
                p.classList.remove('visible');
            }
        }

        currentPage = target;
        updateUI();

        setTimeout(() => {
            isFlipping = false;
        }, 300);
    }

    // ===== NAVIGATION BUTTONS =====
    function setupNavigation() {
        navNext.addEventListener('click', flipNext);
        navPrev.addEventListener('click', flipPrev);

        // Keyboard arrows for desktop preview
        document.addEventListener('keydown', (e) => {
            if (!introOpen) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    giftWrap.click();
                }
                return;
            }
            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                flipNext(); // RTL: left arrow flips to next
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                flipPrev(); // RTL: right arrow flips to prev
            }
        });
    }

    // ===== TOUCH GESTURES (SWIPE) =====
    function setupGestures() {
        book.addEventListener('touchstart', (e) => {
            if (e.touches.length !== 1) return;
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
            touchEndX = touchStartX;
        }, { passive: true });

        book.addEventListener('touchmove', (e) => {
            if (e.touches.length !== 1) return;
            touchEndX = e.touches[0].clientX;
        }, { passive: true });

        book.addEventListener('touchend', (e) => {
            const deltaX = touchEndX - touchStartX;
            const deltaY = Math.abs(e.changedTouches[0].clientY - touchStartY);

            // Ensure horizontal swipe, not vertical scroll
            if (Math.abs(deltaX) > SWIPE_THRESHOLD && Math.abs(deltaX) > deltaY) {
                if (deltaX < 0) {
                    // Swiped Left -> in RTL, next page
                    flipNext();
                } else {
                    // Swiped Right -> in RTL, previous page
                    flipPrev();
                }
            }
        }, { passive: true });
    }

    // Initialize as soon as DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
