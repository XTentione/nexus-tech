/* Nexus Tech — script.js */

const $ = id => document.getElementById(id);
const overlays = ['searchOverlay', 'cartOverlay', 'userOverlay', 'videoOverlay'];

function openOverlay(id) {
    const el = $(id);
    if (!el) return;
    closeAll();
    el.classList.add('open');
    document.body.classList.add('lock');
    if (id === 'searchOverlay') setTimeout(() => $('searchInput') && $('searchInput').focus(), 120);
}

function closeAll() {
    overlays.forEach(id => { const el = $(id); if (el) el.classList.remove('open'); });
    document.body.classList.remove('lock');
    const vf = $('videoFrame');
    if (vf) vf.src = '';
}
window.closeAll = closeAll;

if ($('searchBtn')) $('searchBtn').onclick = () => openOverlay('searchOverlay');
if ($('cartBtn'))   $('cartBtn').onclick   = () => openOverlay('cartOverlay');
if ($('userBtn'))   $('userBtn').onclick   = () => openOverlay('userOverlay');

/* VIDEO */
const VIDEO_URL = 'https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&rel=0';
if ($('videoBtn')) {
    $('videoBtn').onclick = () => {
        const frame = $('videoFrame');
        if (frame) frame.src = VIDEO_URL;
        openOverlay('videoOverlay');
    };
}

/* CLOSE HANDLERS */
document.querySelectorAll('[data-close]').forEach(b => b.onclick = closeAll);
overlays.forEach(id => {
    const el = $(id);
    if (el) el.onclick = e => { if (e.target === el) closeAll(); };
});
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeAll(); });

/* NAV SMOOTH SCROLL */
document.querySelectorAll('[data-nav]').forEach(link => {
    link.onclick = e => {
        const t = document.getElementById(link.getAttribute('href').slice(1));
        if (!t) return;
        e.preventDefault();
        t.scrollIntoView({ behavior: 'smooth' });
        document.querySelectorAll('[data-nav]').forEach(l => l.classList.remove('active'));
        link.classList.add('active');
    };
});

/* CART */
const STORAGE_KEY = 'nexus_cart_v1';
let cart = [];
try { cart = JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch (e) { cart = []; }

const catalog = [
    { name: 'Nexus Pro Max', price: 349 },
    { name: 'Nexus Pro Max Midnight Black', price: 349 },
    { name: 'Nexus Buds', price: 149 },
    { name: 'Nexus Buds Pro', price: 199 },
    { name: 'Nexus Charging Case', price: 39 },
    { name: 'Nexus Audio Cable', price: 19 }
];

function saveCart() { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(cart)); } catch (e) {} }

function addToCart(name, price) {
    const item = cart.find(i => i.name === name);
    if (item) item.qty += 1;
    else cart.push({ name, price, qty: 1 });
    saveCart();
    renderCart();
    bump();
    if ($('cartBtn')) {
        $('cartBtn').style.color = '#a855f7';
        setTimeout(() => { $('cartBtn').style.color = ''; }, 400);
    }
}
window.addToCart = addToCart;

function removeFromCart(name) {
    cart = cart.filter(i => i.name !== name);
    saveCart();
    renderCart();
}

function updateQty(name, d) {
    const item = cart.find(i => i.name === name);
    if (!item) return;
    item.qty += d;
    if (item.qty <= 0) removeFromCart(name);
    else { saveCart(); renderCart(); }
}

function renderCart() {
    const countEl = $('cartCount');
    const itemsEl = $('cartItems');
    const totalEl = $('cartTotal');
    if (!countEl || !itemsEl || !totalEl) return;

    const qty = cart.reduce((s, i) => s + i.qty, 0);
    countEl.textContent = qty;
    countEl.classList.toggle('show', qty > 0);

    if (!cart.length) {
        itemsEl.innerHTML = '<p class="hint">Your cart is empty.</p>';
        totalEl.textContent = '$0.00';
        return;
    }

    itemsEl.innerHTML = cart.map(i => `
        <div class="cart-item">
            <div class="ci-info">
                <div class="name">${i.name}</div>
                <div class="price">$${(i.price * i.qty).toFixed(2)}</div>
            </div>
            <div class="qty">
                <button data-act="dec" data-name="${i.name}">−</button>
                <span>${i.qty}</span>
                <button data-act="inc" data-name="${i.name}">+</button>
            </div>
            <button class="rm" data-act="rm" data-name="${i.name}"><i class="fa-solid fa-trash"></i></button>
        </div>`).join('');

    itemsEl.querySelectorAll('button[data-act]').forEach(b => {
        b.onclick = () => {
            const act = b.dataset.act;
            const name = b.dataset.name;
            if (act === 'inc') updateQty(name, 1);
            if (act === 'dec') updateQty(name, -1);
            if (act === 'rm')  removeFromCart(name);
        };
    });

    totalEl.textContent = '$' + cart.reduce((s, i) => s + i.price * i.qty, 0).toFixed(2);
}

function bump() {
    const el = $('cartCount');
    if (!el) return;
    el.classList.remove('bump');
    void el.offsetWidth;
    el.classList.add('bump');
}

if ($('checkoutBtn')) {
    $('checkoutBtn').onclick = () => {
        if (!cart.length) return;
        alert('Thanks! Order total: ' + $('cartTotal').textContent);
        cart = [];
        saveCart();
        renderCart();
        closeAll();
    };
}

/* SEARCH */
function renderSearch(q) {
    const box = $('searchResults');
    if (!box) return;
    q = q.trim().toLowerCase();
    if (!q) {
        box.innerHTML = '<p class="hint">Try "Pro Max", "earbuds", or "battery".</p>';
        return;
    }
    const matches = catalog.filter(p => p.name.toLowerCase().includes(q));
    if (!matches.length) {
        box.innerHTML = '<p class="hint">No results. Try a different keyword.</p>';
        return;
    }
    box.innerHTML = matches.map(p => `
        <div class="result" data-name="${p.name}" data-price="${p.price}">
            <span class="n">${p.name}</span>
            <span class="p">$${p.price}</span>
        </div>`).join('');

    box.querySelectorAll('.result').forEach(r => {
        r.onclick = () => {
            addToCart(r.dataset.name, Number(r.dataset.price));
            closeAll();
            openOverlay('cartOverlay');
        };
    });
}
if ($('searchInput')) $('searchInput').addEventListener('input', e => renderSearch(e.target.value));

/* INIT */
renderCart();