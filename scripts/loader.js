window.addEventListener('load', () => {
    const loader = document.getElementById('loader');
    if (loader) {
        // Minimal delay to ensure the loader is seen briefly
        setTimeout(() => {
            loader.classList.add('is-hidden');
        }, 800);
    }
});