// helper: détecte un device "mobile-like" (doigt ou petit viewport)
const isMobileLike = () =>
  window.matchMedia('(pointer:coarse)').matches || window.innerWidth < 768;

const { createApp, nextTick } = Vue;

createApp({
  data(){
    return {
      allowedBlocks: new Set([0,2]),   // 0 = photographies, 2 = backrooms 3D (le texte est sur la page)
      activeBlock: null,
      overlayStyle: {},

      // états d’affichage
      showSlider: false,        // (désormais inutilisé mais conservé)
      showPdfContent: false,    // (désormais inutilisé mais conservé)
      showPhotoPdf: false,
      show3d: false,            // iframe du portfolio 3D
      contact: false,           // formulaire de contact

      // anciennes données slider (conservées pour stabilité)
      desktopImages: [
        'photos/lacnoir.jpg','photos/clara.jpg','photos/cyris.jpg',
        'photos/inde.jpg','photos/voile.jpg','photos/tete.jpg',
        'photos/tete2.jpg','photos/statue.png','photos/pola1.png'
      ],
      mobileImages: [
        'photos/lacnoir.jpg','photos/clara.jpg','photos/cyris.jpg',
        'photos/inde.jpg','photos/voile.jpg','photos/tete.jpg',
        'photos/tete2.jpg','photos/statue.png','photos/pola1.png'
      ],
      currentIndex: 0,
      isMobile: false
    }
  },

  computed:{
    currentImages(){ 
      return this.isMobile ? this.mobileImages : this.desktopImages 
    },
    currentImage(){ 
      return this.currentImages[this.currentIndex] 
    }
  },

  mounted(){
    const check = () => { this.isMobile = window.innerWidth < 768 }
    check();
    window.addEventListener('resize', check);

    // La page 3D tourne en iframe : son bouton « ↩ retour » nous prévient
    // au lieu de faire history.back(), qui ne sortirait pas de l'iframe.
    window.addEventListener('message', (e) => {
      if (e.data === 'fermer-3d' && this.show3d) this.closeOverlay();
    });

    this.initFenetre();
  },

  methods:{
    // Fenêtre « Aurélia Foucher » : déplaçable par sa barre de titre (souris ou doigt),
    // redimensionnable par le coin bas droit (resize:both en CSS). Le texte se recale seul.
    initFenetre(){
      const f = document.querySelector('.fenetre');
      const barre = f && f.querySelector('.barre');
      if (!barre) return;

      // On fige la position CSS (en %) en pixels pour pouvoir la déplacer et la redimensionner
      const figer = () => {
        const r = f.getBoundingClientRect();
        Object.assign(f.style, { left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px', bottom: 'auto' });
      };
      figer();

      const borner = () => {
        const x = Math.min(Math.max(0, f.offsetLeft), Math.max(0, window.innerWidth  - f.offsetWidth));
        const y = Math.min(Math.max(0, f.offsetTop),  Math.max(0, window.innerHeight - 40)); // la barre reste attrapable
        f.style.left = x + 'px'; f.style.top = y + 'px';
      };

      // Déplacement : on écoute le mouvement sur window (plus fiable que la capture
      // de pointeur selon les navigateurs), avec repli souris/tactile si besoin.
      let prise = null;
      const debut = (x, y) => { prise = { dx: x - f.offsetLeft, dy: y - f.offsetTop }; };
      const bouge = (x, y) => {
        if (!prise) return;
        f.style.left = (x - prise.dx) + 'px';
        f.style.top  = (y - prise.dy) + 'px';
        borner();
      };
      const lacher = () => { prise = null; };

      if (window.PointerEvent) {
        barre.addEventListener('pointerdown', (e) => { if (e.button) return; e.preventDefault(); debut(e.clientX, e.clientY); });
        window.addEventListener('pointermove', (e) => bouge(e.clientX, e.clientY));
        window.addEventListener('pointerup', lacher);
        window.addEventListener('pointercancel', lacher);
      } else {
        barre.addEventListener('mousedown', (e) => { if (e.button) return; e.preventDefault(); debut(e.clientX, e.clientY); });
        window.addEventListener('mousemove', (e) => bouge(e.clientX, e.clientY));
        window.addEventListener('mouseup', lacher);
        barre.addEventListener('touchstart', (e) => { const t = e.touches[0]; debut(t.clientX, t.clientY); }, { passive: true });
        window.addEventListener('touchmove', (e) => { if (!prise) return; const t = e.touches[0]; bouge(t.clientX, t.clientY); }, { passive: true });
        window.addEventListener('touchend', lacher);
      }
      window.addEventListener('resize', borner);
    },

    // Contact : pas de serveur sur ce site, le formulaire prépare un mail dans le logiciel du visiteur
    envoyer(e){
      const d = new FormData(e.target);
      const sujet = encodeURIComponent('Contact portfolio — ' + d.get('nom'));
      const corps = encodeURIComponent(d.get('message') + '\n\n— ' + d.get('nom') + ' (' + d.get('email') + ')');
      window.location.href = 'mailto:aurelia.foucher@outlook.com?subject=' + sujet + '&body=' + corps;
      this.contact = false;
    },

    handleClick(index, evt){
      if(!this.allowedBlocks.has(index)) return;
      this.openOverlay(index, evt);
    },

    openOverlay(index, event){

      // Sur mobile, le PDF photographie s'ouvre dans un onglet externe
      if (index === 0 && isMobileLike()) {
        window.open('photos/photographies.pdf', '_blank');
        return;
      }

      // Sur mobile, la 3D prend tout l'écran : navigation dans le même onglet,
      // son bouton « ↩ retour » (history.back) ramène ici tout seul.
      if (index === 2 && isMobileLike()) {
        window.location.href = '3d/index.html';
        return;
      }

      const rect = event.currentTarget.getBoundingClientRect();
      this.activeBlock = { index, rect };

      // reset des contenus
      this.showSlider = false;
      this.showPdfContent = false;
      this.showPhotoPdf = false;
      this.show3d = false;

      // fond initial pour l’animation
      let background = 'var(--cream)';
      let backgroundSize = 'auto';

      // noir pour la 3D : l'agrandissement enchaîne sans flash clair
      if (index === 2) background = '#000';

      this.overlayStyle = {
        top: rect.top + 'px',
        left: rect.left + 'px',
        width: rect.width + 'px',
        height: rect.height + 'px',
        background,
        backgroundSize
      };

      nextTick(() => {
        setTimeout(() => {
          Object.assign(this.overlayStyle, {
            top: '0px',
            left: '0px',
            width: '100vw',
            height: '100vh',
            backgroundSize: 'auto'
          });

          const delay = 500;

          if (index === 0) {
            setTimeout(() => { 
              this.showPhotoPdf = true; 
            }, delay);
          }

          if (index === 2) {
            setTimeout(() => {
              this.show3d = true;
            }, delay);
          }

        }, 50);
      });
    },

    // conservé mais plus utilisé
    nextImage(){
      const len = this.currentImages.length;
      this.currentIndex = (this.currentIndex + 1) % len;
    },

    closeOverlay(){
      this.showSlider = false;
      this.showPdfContent = false;
      this.showPhotoPdf = false;
      // démonte l'iframe : libère le contexte WebGL et les 16 Mo du monde
      this.show3d = false;

      const { rect } = this.activeBlock;
      const newBgSize = 'auto';

      Object.assign(this.overlayStyle, {
        top: rect.top + 'px',
        left: rect.left + 'px',
        width: rect.width + 'px',
        height: rect.height + 'px',
        backgroundSize: newBgSize
      });

      setTimeout(() => { 
        this.activeBlock = null 
      }, 500);
    }
  }
}).mount('#app');