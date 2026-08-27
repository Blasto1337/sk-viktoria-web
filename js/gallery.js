(() => {
  "use strict";

  const grid = document.getElementById("gallery-grid");
  if (!grid) return;

  const items = [...grid.querySelectorAll(".gallery-item")];
  const filterButtons = [...document.querySelectorAll(".filter-btn")];

  filterButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      filterButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      const filter = btn.dataset.filter;
      items.forEach((item) => {
        const show = filter === "all" || item.dataset.type === filter;
        item.classList.toggle("is-hidden", !show);
      });
    });
  });

  const lightbox = document.getElementById("lightbox");
  const lightboxMedia = document.getElementById("lightbox-media");
  const closeBtn = document.getElementById("lightbox-close");
  const prevBtn = document.getElementById("lightbox-prev");
  const nextBtn = document.getElementById("lightbox-next");

  let currentIndex = 0;

  function visibleItems() {
    return items.filter((item) => !item.classList.contains("is-hidden"));
  }

  function openLightbox(index) {
    const visible = visibleItems();
    if (!visible.length) return;
    currentIndex = (index + visible.length) % visible.length;
    const current = visible[currentIndex];
    const src = current.dataset.src;

    if (src) {
      lightboxMedia.classList.remove("ph");
      lightboxMedia.innerHTML = `<img src="${src}" alt="">`;
    } else {
      lightboxMedia.classList.add("ph");
      lightboxMedia.innerHTML = `<span>${current.dataset.type === "video" ? "video" : "foto"}</span>`;
    }

    lightbox.classList.add("open");
  }

  function closeLightbox() {
    lightbox.classList.remove("open");
  }

  items.forEach((item) => {
    item.addEventListener("click", () => {
      const visible = visibleItems();
      openLightbox(visible.indexOf(item));
    });
  });

  closeBtn.addEventListener("click", closeLightbox);
  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox) closeLightbox();
  });
  prevBtn.addEventListener("click", () => openLightbox(currentIndex - 1));
  nextBtn.addEventListener("click", () => openLightbox(currentIndex + 1));

  document.addEventListener("keydown", (e) => {
    if (!lightbox.classList.contains("open")) return;
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowLeft") openLightbox(currentIndex - 1);
    if (e.key === "ArrowRight") openLightbox(currentIndex + 1);
  });
})();
