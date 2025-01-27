let gif = null;
let recordingFrames = false;

const duration = 1;
const blurValue = 1;
const windX = -30;
const windY = -50;
const scatter = 0;
const detail = 50;
const frameRate = 60;
const quality = 10;

const updateCSSvars = (key, value, units) => {
  document.documentElement.style.setProperty(`--${key}`, `${round(value, 2)}${units}`);
};

const round = (value, precision) => {
  const multiplier = Math.pow(10, precision);
  return Math.round(value * multiplier) / multiplier;
};

updateCSSvars('fade-time', round(duration, 2), 's');
updateCSSvars('blur-time', round(duration, 2), 's');
updateCSSvars('quickFade-time', round(duration - duration * (duration * 0.1), 2), 's');
updateCSSvars('blur-amount', round(blurValue / 16, 3), 'em');

const initGif = () => {
  try {
    gif = new GIF({
      workers: 4,
      quality: quality,
      width: 512,
      height: 512,
      workerScript: 'assets/js/gif.worker.js',
      dither: false,
      fps: frameRate,
    });

    gif.on('finished', function (blob) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const button = document.getElementById('button');
      a.href = url;
      a.download = 'render.gif';
      a.click();
      URL.revokeObjectURL(url);
      recordingFrames = false;
      button.innerText = 'Disintegrate';
      location.reload(true);
    });

    return true;
  } catch (error) {
    console.error('Error initializing GIF:', error);
    return false;
  }
};

const captureFrame = () => {
  if (!recordingFrames || !gif) return;

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const elements = document.querySelectorAll('.dust, #image-container img');
  elements.forEach(el => {
      if (el.style.display !== 'none') {
          const x = (canvas.width - el.width) / 2;
          const y = (canvas.height - el.height) / 2;
          ctx.drawImage(el, x, y, el.width, el.height);
      }
  });

  gif.addFrame(canvas, { delay: 1000 / frameRate });
};

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('button').addEventListener('click', async (e) => {
    const target = document.querySelector(e.target.dataset.target);

    if (target.style.display === "none") {
      target.style.display = "";
    }

      Array.from(target.children).map(el => {
        el.classList.remove('quickFade');
      });

      if (initGif()) {
        recordingFrames = true;

        const frameInterval = setInterval(captureFrame, 1000 / frameRate);

        setTimeout(() => {
          clearInterval(frameInterval);
          if (gif) {
            gif.render();
          }
        }, duration * 1000 + 1500);
      }

      desintegrate(target);

      e.innerText = 'Disintegrate';
  });
});

const desintegrate = (target) => {
  button = document.getElementById('button');
  button.innerText = 'Rendering...';
  html2canvas(target, {
    allowTaint: false,
    useCORS: true,
    backgroundColor: 'transparent',
    scale: 1,
  }).then(canvas => {
    const canvasCount = detail;
    const ctx = canvas.getContext("2d");
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixelArr = imageData.data;
    const data = imageData.data.slice(0).fill(0);
    let imageDataArray = Array.from({ length: canvasCount }, e => data.slice(0));

    for (let i = 0; i < pixelArr.length; i += 4) {
      const p = Math.floor((i / pixelArr.length) * canvasCount);
      const a = imageDataArray[weightedRandomDistrib(p, canvasCount)];

      a[i] = pixelArr[i];
      a[i + 1] = pixelArr[i + 1];
      a[i + 2] = pixelArr[i + 2];
      a[i + 3] = pixelArr[i + 3];
    }

    for (let i = 0; i < canvasCount; i++) {
      const c = newCanvasFromImageData(imageDataArray[i], canvas.width, canvas.height);
      c.classList.add("dust");

      const d = duration * 1000;
      const delay = (i / canvasCount) * (duration * 800);

      setTimeout(() => {
        animateTransform(c, windX, windY, chance.integer({ min: -scatter, max: scatter }), d);
        Array.from(target.querySelectorAll(':not(.dust)')).map(el => {
          el.style.display = 'none';
        });
        c.classList.add('blur');
        setTimeout(() => {
          c.remove();
        }, d + 100);
      }, delay);

      target.appendChild(c);
    }

    Array.from(target.querySelectorAll(':not(.dust)')).map(el => {
      el.classList.add('quickFade');
    });
  }).catch(function (error) {
    console.log(error);
  });
};

const weightedRandomDistrib = (peak, count) => {
  const prob = [], seq = [];
  for (let i = 0; i < count; i++) {
    prob.push(Math.pow(count - Math.abs(peak - i), detail / 2));
    seq.push(i);
  }
  return chance.weighted(seq, prob);
  };

  const animateTransform = (elem, sx, sy, angle, duration) => {
  elem.animate([
    { transform: 'rotate(0) translate(0, 0)' },
    { transform: `rotate(${angle}deg) translate(${sx}px,${sy}px)` }
  ], {
    duration: duration,
    easing: 'ease-in-out',
    fill: 'forwards'
  });
};

const newCanvasFromImageData = (imageDataArray, w, h) => {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const tempCtx = canvas.getContext("2d");
  tempCtx.putImageData(new ImageData(imageDataArray, w, h), 0, 0);
  return canvas;
};

document.getElementById('file').addEventListener('change', function(e) {
  var file = e.target.files[0];
  var reader = new FileReader();
  reader.onload = function(e) {
    document.querySelector('#image img').src = e.target.result;
    document.querySelector('#image img').style.display = 'block';
    document.querySelector('span').style.opacity = '0';
    document.querySelector('button').disabled = false;
  };
  reader.readAsDataURL(file);
});