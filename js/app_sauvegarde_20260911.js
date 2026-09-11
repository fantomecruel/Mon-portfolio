// helper: détecte un device "mobile-like" (doigt ou petit viewport)
const isMobileLike = () =>
  window.matchMedia('(pointer:coarse)').matches || window.innerWidth < 768;

const { createApp, nextTick } = Vue;

createApp({
  data(){
    return {
      allowedBlocks: new Set([0,1,2,5]),
      activeBlock: null,
      overlayStyle: {},

      // états d’affichage
      showSlider: false,        // (désormais inutilisé mais conservé)
      showBlock2Grid: false,
      showPdfContent: false,
      showPhotoPdf: false,

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
  },

  methods:{
    handleClick(index, evt){
      if(!this.allowedBlocks.has(index)) return;
      this.openOverlay(index, evt);
    },

    openOverlay(index, event){

      // PDFs → sur mobile : ouverture dans un onglet externe
      if ((index === 0 || index === 2 || index === 5) && isMobileLike()) {
        const url =
          index === 0 ? 'photos/photographies.pdf'
          : index === 2 ? 'photos/graphisme.pdf'
          : 'photos/graphismedecor.pdf';
        window.open(url, '_blank');
        return;
      }

      const rect = event.currentTarget.getBoundingClientRect();
      this.activeBlock = { index, rect };

      // reset des contenus
      this.showSlider = false;
      this.showBlock2Grid = false;
      this.showPdfContent = false;
      this.showPhotoPdf = false;

      // fond initial pour l’animation
      let background = 'var(--cream)';
      let backgroundSize = 'auto';

      if (index === 1) {
        background = "url('photos/a.svg') no-repeat center, var(--cream)";
        backgroundSize = '30% auto, auto';
      }

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
            backgroundSize: index === 1 ? 'cover' : 'auto'
          });

          const delay = 500;

          if (index === 0) {
            setTimeout(() => { 
              this.showPhotoPdf = true; 
            }, delay);
          }

          if (index === 1) {
            setTimeout(() => { 
              this.showBlock2Grid = true; 
            }, delay);
          }

          if (index === 2 || index === 5) {
            setTimeout(() => { 
              this.showPdfContent = true; 
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
      this.showBlock2Grid = false;
      this.showSlider = false;
      this.showPdfContent = false;
      this.showPhotoPdf = false;

      const { rect, index } = this.activeBlock;
      const newBgSize = index === 1 ? `${rect.width}px ${rect.height}px` : 'auto';

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