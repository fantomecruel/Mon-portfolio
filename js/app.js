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
  },

  methods:{
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