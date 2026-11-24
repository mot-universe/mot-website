(function () {
    const slider = document.getElementById('worksSlider');
    const track  = document.getElementById('worksTrack');
    const dotsEl = document.getElementById('worksDots');
    const slides = Array.from(track.children);
    const MAX_MS = 15000;
    let index = 0, timer = null, visible = true;

    const modal      = document.getElementById('videoModal');
    const modalVideo = document.getElementById('modalVideo');
    const modalClose = document.getElementById('modalClose');
    let modalOpen = false;

    // Drag state
    let dragging = false, startX = 0, dx = 0, startT = 0, pid = null;

    // Video tidak menangkap pointer, jadi drag selalu diterima slider
    slides.forEach(s => {
        const v = s.querySelector('video');
        v.classList.add('pointer-events-none', 'select-none');
        v.setAttribute('draggable', 'false');
    });
    slider.classList.add('cursor-grab', 'select-none');
    slider.style.touchAction = 'pan-y'; // scroll vertikal HP tetap jalan

    // Dots
    const dots = slides.map((_, i) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.setAttribute('aria-label', 'Go to slide ' + (i + 1));
        b.className = 'w-2.5 h-2.5 rounded-full bg-white cursor-pointer transition-all duration-300 hover:scale-125';
        b.addEventListener('click', () => goTo(i));
        dotsEl.appendChild(b);
        return b;
    });

    function setTransform(px = 0) {
        track.style.transform = `translateX(calc(${-index * 100}% + ${px}px))`;
    }

    function updateUI() {
        dots.forEach((d, n) => {
            d.classList.toggle('bg-neon-purple', n === index);
            d.classList.toggle('bg-white', n !== index);
            d.classList.toggle('scale-150', n === index);
        });
    }

    function scheduleNext() {
        clearTimeout(timer);
        if (modalOpen) return;
        timer = setTimeout(() => goTo(index + 1), MAX_MS);
    }

    // restartVideo=false dipakai saat slide hanya "mental" kembali ke posisi semula
    function goTo(i, restartVideo = true) {
        index = (i + slides.length) % slides.length;
        track.style.transition = ''; // aktifkan lagi animasi Tailwind
        setTransform(0);
        updateUI();

        slides.forEach((s, n) => {
            const v = s.querySelector('video');
            if (n === index) {
                if (restartVideo) v.currentTime = 0;
                if (visible) v.play().catch(() => {});
            } else {
                v.pause();
            }
        });
        scheduleNext();
    }

    function openModal() {
    modalOpen = true;
    clearTimeout(timer);

    // Kembalikan track ke posisi slide (transition sempat dimatikan saat pointerdown)
    track.style.transition = '';
    setTransform(0);

    // Hentikan video carousel, putar video yang sama di modal
    const v = slides[index].querySelector('video');
    v.pause();
    modalVideo.src = v.currentSrc || v.querySelector('source').src;
    modal.showModal();
    modalVideo.play().catch(() => {});
    }

    function closeModal() {
        modalVideo.pause();
        modalVideo.removeAttribute('src');
        modalVideo.load();
    }

    modalClose.addEventListener('click', () => modal.close());

    // Klik area gelap (di luar video) menutup modal
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.close(); });

    // Dipanggil untuk semua cara menutup: tombol X, Esc, atau klik backdrop
    modal.addEventListener('close', () => {
        closeModal();
        modalOpen = false;
        goTo(index, false); // lanjutkan carousel dari slide yang sama
    });

    // Pindah otomatis saat video selesai
    slides.forEach((s, n) => {
        s.querySelector('video').addEventListener('ended', () => {
            if (n === index && !dragging) goTo(index + 1);
        });
    });

    // ===== Drag =====
    slider.addEventListener('pointerdown', (e) => {
        if (e.pointerType === 'mouse' && e.button !== 0) return; // hanya klik kiri
        if (e.target.closest('#worksDots')) return;               // dots tetap bisa diklik
        dragging = true;
        pid = e.pointerId;
        startX = e.clientX;
        startT = performance.now();
        dx = 0;
        clearTimeout(timer);
        track.style.transition = 'none'; // ikut pointer tanpa delay
        slider.classList.replace('cursor-grab', 'cursor-grabbing');
        slider.setPointerCapture(pid);
    });

    slider.addEventListener('pointermove', (e) => {
        if (!dragging || e.pointerId !== pid) return;
        dx = e.clientX - startX;

        // Efek karet di ujung (slide pertama ditarik ke kanan / terakhir ke kiri)
        const atStart = index === 0 && dx > 0;
        const atEnd   = index === slides.length - 1 && dx < 0;
        const shown   = (atStart || atEnd) ? dx * 0.3 : dx;
        setTransform(shown);
    });

    function endDrag(e) {
        if (!dragging || (e && e.pointerId !== pid)) return;
        dragging = false;
        slider.classList.replace('cursor-grabbing', 'cursor-grab');
        try { slider.releasePointerCapture(pid); } catch (_) {}

        if (Math.abs(dx) < 6 && e && e.type === 'pointerup') {
        openModal();
        return;
        }

        const width    = slider.clientWidth;
        const elapsed  = Math.max(performance.now() - startT, 1);
        const velocity = Math.abs(dx) / elapsed;                     // px per ms
        const passed   = Math.abs(dx) > width * 0.2 || (velocity > 0.5 && Math.abs(dx) > 30);

        if (passed) {
            goTo(dx < 0 ? index + 1 : index - 1); // geser kiri = slide berikutnya
        } else {
            goTo(index, false);                    // kembali ke slide semula
        }
    }
    slider.addEventListener('pointerup', endDrag);
    slider.addEventListener('pointercancel', endDrag);

    // Pause saat slider di luar layar
    new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        const v = slides[index].querySelector('video');
        (visible && !modalOpen) ? v.play().catch(() => {}) : v.pause();
    }, { threshold: 0.3 }).observe(slider);

    // Pas ukuran layar berubah, posisi tetap rapi
    window.addEventListener('resize', () => setTransform(0));

    goTo(0);
})();