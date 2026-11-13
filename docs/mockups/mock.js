/* Hiệu ứng dùng chung cho 3 bản mẫu (không phụ thuộc thư viện) */
(function () {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fmt = (n) => n.toLocaleString('vi-VN') + 'đ';

  // Hiện dần khi cuộn
  const io = new IntersectionObserver((es) => {
    es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: 0.15 });
  document.querySelectorAll('.reveal').forEach((el, i) => {
    el.style.transitionDelay = ((i % 6) * 70) + 'ms';
    io.observe(el);
  });

  // Số chạy
  const co = new IntersectionObserver((es) => {
    es.forEach((e) => {
      if (!e.isIntersecting) return;
      co.unobserve(e.target);
      const el = e.target, end = parseFloat(el.dataset.count), dec = +(el.dataset.dec || 0);
      if (reduce) { el.textContent = end.toLocaleString('vi-VN'); return; }
      const t0 = performance.now(), dur = 1400;
      (function tick(t) {
        const p = Math.min((t - t0) / dur, 1), v = end * (1 - Math.pow(1 - p, 3));
        el.textContent = v.toLocaleString('vi-VN', { minimumFractionDigits: dec, maximumFractionDigits: dec });
        if (p < 1) requestAnimationFrame(tick);
      })(t0);
    });
  }, { threshold: 0.6 });
  document.querySelectorAll('[data-count]').forEach((el) => co.observe(el));

  // Nghiêng theo chuột
  if (!reduce) {
    document.querySelectorAll('[data-tilt]').forEach((el) => {
      el.addEventListener('mousemove', (ev) => {
        const r = el.getBoundingClientRect();
        const x = (ev.clientX - r.left) / r.width - 0.5, y = (ev.clientY - r.top) / r.height - 0.5;
        el.style.transform = `perspective(700px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg) translateY(-4px)`;
      });
      el.addEventListener('mouseleave', () => { el.style.transform = ''; });
    });
    // Parallax nhẹ
    const par = document.querySelectorAll('[data-par]');
    window.addEventListener('scroll', () => {
      const y = window.scrollY;
      par.forEach((el) => { el.style.transform = `translateY(${y * parseFloat(el.dataset.par)}px)`; });
    }, { passive: true });
  }

  // Giỏ hàng + ảnh bay vào giỏ
  const cart = [];
  const $ = (id) => document.getElementById(id);
  const drawer = $('drawer'), scrim = $('scrim'), list = $('drawerList'), total = $('drawerTotal'), count = $('cartCount');
  const open = (v) => { drawer.classList.toggle('open', v); scrim.classList.toggle('open', v); };
  $('cartBtn').addEventListener('click', () => open(true));
  $('drawerClose').addEventListener('click', () => open(false));
  scrim.addEventListener('click', () => open(false));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') open(false); });

  function render() {
    const n = cart.reduce((s, i) => s + i.qty, 0);
    count.textContent = n; count.classList.remove('bump'); void count.offsetWidth; count.classList.add('bump');
    list.innerHTML = cart.length ? cart.map((i, idx) => `
      <div class="d-row"><span class="d-emo">${i.emoji}</span>
        <div class="d-info"><b>${i.name}</b><small>${fmt(i.price)} × ${i.qty}</small></div>
        <button class="d-del" data-del="${idx}" aria-label="Xóa">×</button></div>`).join('')
      : '<p class="d-empty">Giỏ hàng đang trống. Thêm vài trái ngon nhé!</p>';
    total.textContent = fmt(cart.reduce((s, i) => s + i.price * i.qty, 0));
  }
  list.addEventListener('click', (e) => {
    const b = e.target.closest('[data-del]'); if (!b) return;
    cart.splice(+b.dataset.del, 1); render();
  });
  render();

  document.querySelectorAll('[data-add]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const d = btn.dataset, price = +d.price;
      const ex = cart.find((i) => i.name === d.name);
      ex ? ex.qty++ : cart.push({ name: d.name, price, emoji: d.emoji, qty: 1 });
      if (!reduce) {
        const a = btn.getBoundingClientRect(), b = $('cartBtn').getBoundingClientRect();
        const f = document.createElement('div');
        f.className = 'fly'; f.textContent = d.emoji;
        f.style.left = a.left + a.width / 2 + 'px'; f.style.top = a.top + 'px';
        document.body.appendChild(f);
        requestAnimationFrame(() => {
          f.style.transform = `translate(${b.left - a.left}px, ${b.top - a.top}px) scale(.3)`;
          f.style.opacity = '.2';
        });
        setTimeout(() => { f.remove(); render(); }, 750);
      } else render();
    });
  });
})();
