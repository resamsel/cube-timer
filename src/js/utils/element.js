Element.prototype.on = function(type, handler) {
  return this.addEventListener(type, handler);
};
Element.prototype.off = function(type, handler) {
  return this.removeEventListener(type, handler);
};

Element.prototype.show = function() {
  if (this.style.display === 'none') {
    this.style.display = 'block';
  }
};

Element.prototype.hide = function() {
  if (this.style.display !== 'none') {
    this.style.display = 'none';
  }
};

const FADE_DURATION = 400;
const FADE_INTERVAL = 25;
const FADE_FRAMES = FADE_DURATION / FADE_INTERVAL;

Element.prototype.fadeOut = function() {
  const target = this;
  return new Promise((resolve, reject) => {
    const fadeEffect = setInterval(function() {
      if (!target.style.opacity) {
        target.style.opacity = 1;
      }
      const opacity = parseFloat(target.style.opacity);
      if (opacity < 1 / FADE_FRAMES) {
        clearInterval(fadeEffect);
        target.style.display = 'none';
        target.style.opacity = 0;
        resolve();
      } else {
        target.style.opacity = opacity - 1 / FADE_FRAMES;
      }
    }, FADE_INTERVAL);
  });
};

Element.prototype.fadeIn = function() {
  const target = this;
  return new Promise((resolve, reject) => {
    const fadeEffect = setInterval(function() {
      if (!target.style.opacity) {
        target.style.opacity = 0;
      }
      if (target.style.display !== 'block') {
        target.style.display = 'block';
      }
      const opacity = parseFloat(target.style.opacity);
      if (opacity > 1 - (1 / FADE_FRAMES)) {
        clearInterval(fadeEffect);
        resolve();
      } else {
        target.style.opacity = opacity + 1 / FADE_FRAMES;
      }
    }, FADE_INTERVAL);
  });
};
