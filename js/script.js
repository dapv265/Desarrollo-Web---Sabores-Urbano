// =========================================================
// SABORES URBANOS — Landing page
// Sin backend: navbar flotante, menú móvil,
// scroll suave y animaciones de aparición.
// =========================================================

// ---------------------------------------------------------
// Navbar: sombra al hacer scroll
// ---------------------------------------------------------
const navbar = document.getElementById('navbar');
function actualizarNavbar(){
  navbar.classList.toggle('scrolled', window.scrollY > 12);
}
window.addEventListener('scroll', actualizarNavbar, { passive:true });
actualizarNavbar();

// ---------------------------------------------------------
// Menú móvil
// ---------------------------------------------------------
const navToggle = document.getElementById('nav-toggle');
const navLinks = document.getElementById('nav-links');

navToggle.addEventListener('click', () => {
  const abierto = navLinks.classList.toggle('open');
  navToggle.setAttribute('aria-expanded', abierto ? 'true' : 'false');
});

navLinks.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
  });
});

// ---------------------------------------------------------
// Animación de aparición al hacer scroll
// ---------------------------------------------------------
const elementosReveal = document.querySelectorAll('.reveal');

if('IntersectionObserver' in window){
  const observer = new IntersectionObserver((entradas) => {
    entradas.forEach(entrada => {
      if(entrada.isIntersecting){
        entrada.target.classList.add('in-view');
        observer.unobserve(entrada.target);
      }
    });
  }, { threshold:0.15, rootMargin:'0px 0px -60px 0px' });

  elementosReveal.forEach(el => observer.observe(el));
} else {
  elementosReveal.forEach(el => el.classList.add('in-view'));
}
