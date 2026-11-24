    const headerBg = document.getElementById('headerBg');
    const mobileMenuButton = document.getElementById('mobileMenuButton');
    const mobileMenu = document.getElementById('mobileMenu');
    const menuIcon = document.getElementById('menuIcon');
    const menuLinks = document.querySelectorAll('.menu-link');

    // ==========================================
    // FADE IN / FADE OUT KHUSUS BACKGROUND HEADER
    // ==========================================
    window.addEventListener('scroll', () => {
        if (window.scrollY > 30) {
            // Munculkan background (Fade In)
            headerBg.classList.remove('opacity-0');
            headerBg.classList.add('opacity-100');
        } else {
            // Sembunyikan background saat di Home/atas (Fade Out)
            headerBg.classList.remove('opacity-100');
            headerBg.classList.add('opacity-0');
        }

        // Otomatis tutup mobile menu saat discroll
        if (!mobileMenu.classList.contains('hidden')) {
            closeMenu();
        }
    });

    // ==========================================
    // LOGIKA TOGGLE MOBILE MENU
    // ==========================================
    function toggleMenu() {
        const isOpen = mobileMenu.classList.toggle('hidden');
        
        if (!isOpen) {
            menuIcon.classList.remove('ri-more-2-fill');
            menuIcon.classList.add('ri-close-line');
        } else {
            menuIcon.classList.remove('ri-close-line');
            menuIcon.classList.add('ri-more-2-fill');
        }
    }

    function closeMenu() {
        mobileMenu.classList.add('hidden');
        menuIcon.classList.remove('ri-close-line');
        menuIcon.classList.add('ri-more-2-fill');
    }

    mobileMenuButton.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleMenu();
    });

    menuLinks.forEach(link => {
        link.addEventListener('click', () => {
            closeMenu();
        });
    });

    document.addEventListener('click', (e) => {
        if (!mobileMenu.contains(e.target) && !mobileMenuButton.contains(e.target)) {
            closeMenu();
        }
    });