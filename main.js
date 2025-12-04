// Global configuration for physics and scroll speeds
const CONFIG = {
  physics: {
    xLimit: 9.0,
    yLimit: 6.0,
    zMin: -15.0,
    zMax: 3.0,
    idleMaxSpeed: 0.18,
    idleMaxForce: 0.008,
    activeMaxSpeed: 0.35,
    activeMaxForce: 0.03
  },
  scroll: {
    careerSpeedMultiplier: 3,
    skillsSpeedMultiplier: 2,
    horizontalSpeedMultiplier: 3
  },
  flight: {
    baseSpeed: 1.0,      // base speed of the loop
    scrollBoost: 1.5     // how much scroll can speed it up
  }
};

let isHorizontalSection = false;

// Simple mouse state (we'll feed this into THREE later)
const mouse = { x: 0.5, y: 0.5 };
let isMouseActive = false;
let mouseActiveTimeout = null;

// --- CUSTOM CURSOR FALLBACK FOR TOUCH / COARSE POINTER ---
(function () {
  const mq = window.matchMedia && window.matchMedia('(pointer: coarse)');

  function handlePointerChange(e) {
    if (e.matches) {
      // Coarse pointer device (touch) — disable custom cursor
      document.body.classList.add('no-custom-cursor');
    } else {
      document.body.classList.remove('no-custom-cursor');
    }
  }

  if (mq) {
    handlePointerChange(mq);
    mq.addEventListener('change', handlePointerChange);
  }
})();

// Ensure GSAP/ScrollTrigger are available
if (window.gsap && window.ScrollTrigger) {
  gsap.registerPlugin(ScrollTrigger);
}

// --- 1. SETUP & LOADER ---
const preloader = document.querySelector('.preloader');
const counter = document.getElementById('counter');
const progress = document.querySelector('.loader-progress');

if (preloader && counter && progress) {
  let count = 0;
  const interval = setInterval(() => {
    count += Math.floor(Math.random() * 5) + 1;
    if (count > 100) count = 100;

    counter.innerText = count + '%';
    progress.style.width = count + '%';

    if (count === 100) {
      clearInterval(interval);
      revealSite();
    }
  }, 30);

  function revealSite() {
    if (!window.gsap) {
      preloader.style.display = 'none';
      return;
    }

    const tl = gsap.timeline();

    tl.to('.preloader', {
      yPercent: -100,
      duration: 1.2,
      ease: 'power4.inOut'
    })
      .to(
        '#canvas-container',
        { opacity: 1, duration: 1 },
        '-=0.5'
      )
      .to(
        '.hero-line',
        {
          y: 0,
          duration: 1.5,
          stagger: 0.1,
          ease: 'power4.out'
        },
        '-=0.8'
      )
      .to(
        '.hero-fade',
        {
          y: 0,
          opacity: 1,
          duration: 1,
          ease: 'power2.out'
        },
        '-=1'
      );
  }
}

// --- 2. SMOOTH SCROLL (LENIS) ---
// Disable Lenis on coarse pointer devices (most smartphones / tablets)
const isCoarsePointer =
  window.matchMedia &&
  window.matchMedia('(pointer: coarse)').matches;

if (typeof Lenis !== 'undefined' && !isCoarsePointer) {
  const lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smooth: true
  });

  function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);

  if (window.ScrollTrigger) {
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);
  }
} else {
  console.warn('Lenis disabled on this device (coarse pointer or not loaded). Using native scroll.');
  document.body.style.overflowY = 'auto';
}

// --- 3. HEADER BLUR ON SCROLL ---
const nav = document.querySelector('nav');
window.addEventListener('scroll', () => {
  if (!nav) return;
  if (window.scrollY > 50) {
    nav.classList.add('scrolled');
  } else {
    nav.classList.remove('scrolled');
  }
});

// --- 4. INTRO SCROLL PINNING & TEXT HIGHLIGHT ---
if (window.gsap && window.ScrollTrigger) {
  const revealTypes = document.querySelectorAll('.reveal-type');

  revealTypes.forEach((text) => {
    const content = text.textContent;
    text.innerHTML = '';
    const words = content.split(' ').filter((word) => word.length > 0);
    words.forEach((word) => {
      const span = document.createElement('span');
      span.textContent = word + ' ';
      span.style.opacity = '0.2';
      text.appendChild(span);
    });
  });

  const allSpans = document.querySelectorAll('.reveal-type span');

  gsap.to(allSpans, {
    color: '#fffafb',
    opacity: 1,
    stagger: 0.1,
    scrollTrigger: {
      trigger: '#intro',
      pin: true,
      start: 'top top',
      end: '+=150%',
      scrub: 1
    }
  });
}

// --- 5. CAREER PATH SCROLL LOGIC ---
if (window.gsap && window.ScrollTrigger) {
  const careerSection = document.querySelector('.career-section');
  const careerWrapper = document.querySelector('.career-timeline-container');
  const careerProgress = document.querySelector('.career-progress-bar');

  if (careerSection && careerWrapper) {
    const careerScrollDist =
      careerWrapper.scrollWidth - window.innerWidth + 200;

    gsap.to(careerWrapper, {
      x: -careerScrollDist,
      ease: 'none',
      scrollTrigger: {
        trigger: careerSection,
        pin: true,
        start: 'top top',
        scrub: 1,
        end: () =>
          '+=' +
          careerScrollDist * CONFIG.scroll.careerSpeedMultiplier,
        onUpdate: (self) => {
          if (careerProgress) {
            gsap.to(careerProgress, {
              width: self.progress * 100 + '%',
              duration: 0.1,
              ease: 'none'
            });
          }
        }
      }
    });
  }

  // --- 6. SKILLS SCROLL LOGIC ---
  const skillsSection = document.querySelector('.skills-section');
  const skillsWrapper = document.querySelector('.skills-timeline-container');
  const skillsProgress = document.querySelector('.skills-progress-bar');

  if (skillsSection && skillsWrapper) {
    const skillsScrollDist =
      skillsWrapper.scrollWidth - window.innerWidth + 200;

    gsap.to(skillsWrapper, {
      x: -skillsScrollDist,
      ease: 'none',
      scrollTrigger: {
        trigger: skillsSection,
        pin: true,
        start: 'top top',
        scrub: 1,
        end: () =>
          '+=' +
          skillsScrollDist * CONFIG.scroll.skillsSpeedMultiplier,
        onUpdate: (self) => {
          if (skillsProgress) {
            gsap.to(skillsProgress, {
              width: self.progress * 100 + '%',
              duration: 0.1,
              ease: 'none'
            });
          }
        }
      }
    });
  }

  // --- 7. HORIZONTAL SCROLL LOGIC (SHOWCASE & ARCHIVE) ---
  const horizontalSections = gsap.utils.toArray('.horizontal-section');

  horizontalSections.forEach((section) => {
    const wrapper = section.querySelector('.horizontal-wrapper');
    const panels = gsap.utils.toArray('.panel', section);
    const progressBar = section.querySelector('.section-progress-bar');

    const scrollDistance = section.offsetWidth * (panels.length - 1);

    if (wrapper) {
      const tween = gsap.to(wrapper, {
        xPercent: (-100 * (panels.length - 1)) / panels.length,
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          pin: true,
          start: 'top top',
          scrub: 1,
          snap: {
            snapTo: 1 / (panels.length - 1),
            duration: 0.6,
            delay: 0.1,
            ease: 'circ.out'
          },
          end: () =>
            '+=' +
            scrollDistance * CONFIG.scroll.horizontalSpeedMultiplier,
          onToggle: (self) => {
            isHorizontalSection = self.isActive;
          },
          onUpdate: (self) => {
            if (progressBar) {
              gsap.to(progressBar, {
                width: self.progress * 100 + '%',
                duration: 0.1,
                ease: 'none'
              });
            }
          }
        }
      });

      // TRIGGER TEXT FILL ANIMATION FOR BOTH SHOWCASE AND ARCHIVE
      const fillOverlay = section.querySelector('.fill-text-overlay');
      if (fillOverlay) {
        gsap.to(fillOverlay, {
          width: '100%',
          duration: 1.5,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 60%',
            toggleActions: 'play none none reverse'
          }
        });
      }

      panels.forEach((panel) => {
        const img = panel.querySelector('img');
        if (img) {
          gsap.to(img, {
            xPercent: 15,
            ease: 'none',
            scrollTrigger: {
              trigger: panel,
              containerAnimation: tween,
              scrub: true
            }
          });
        }
      });
    }
  });
}

// --- 8. DYNAMIC HEADER SYNC ---
const headerText = document.getElementById('dynamic-header');
const pageProgressBar = document.getElementById('page-progress');

function updateHeader(title) {
  if (!window.gsap || !headerText) return;
  if (headerText.innerText !== title) {
    gsap.killTweensOf(headerText);
    gsap.to(headerText, {
      y: -24,
      duration: 0.2,
      ease: 'power2.in',
      onComplete: () => {
        headerText.innerText = title;
        gsap.set(headerText, { y: 24 });
        gsap.to(headerText, {
          y: 0,
          duration: 0.3,
          ease: 'power2.out'
        });
      }
    });
  }
}

function toggleSectionLabel(sectionId, show) {
  if (!window.gsap) return;
  const label = document.querySelector(`#${sectionId} .section-label`);
  if (label) {
    gsap.killTweensOf(label);
    if (show) {
      gsap.to(label, {
        y: 0,
        opacity: 1,
        scale: 1,
        duration: 0.5,
        ease: 'back.out(2)'
      });
    } else {
      gsap.to(label, {
        y: -20,
        opacity: 0,
        scale: 0.8,
        duration: 0.4,
        ease: 'back.in(2)'
      });
    }
  }
}

if (window.ScrollTrigger) {
  const sections = [
    { id: 'hero', title: 'RAJAT SINGH' },
    { id: 'intro', title: 'INTRODUCTION' },
    { id: 'experience', title: 'EXPERIENCE' },
    { id: 'skills', title: 'SKILLS' },
    { id: 'showcase', title: 'SHOWCASE' },
    { id: 'work', title: 'ARCHIVE' },
    { id: 'contact', title: 'CONTACT' }
  ];

  ScrollTrigger.refresh();

  sections.forEach((section, i) => {
    ScrollTrigger.create({
      trigger: `#${section.id}`,
      start: 'top top',
      end: 'bottom top',
      onEnter: () => {
        updateHeader(section.title);
        toggleSectionLabel(section.id, false);
      },
      onEnterBack: () => {
        updateHeader(section.title);
        toggleSectionLabel(section.id, false);
      },
      onLeaveBack: () => {
        toggleSectionLabel(section.id, true);
        if (i > 0) {
          updateHeader(sections[i - 1].title);
        }
      }
    });
  });

  // --- 9. GLOBAL PROGRESS BAR ---
  if (pageProgressBar) {
    gsap.to(pageProgressBar, {
      width: '100%',
      ease: 'none',
      scrollTrigger: {
        trigger: document.documentElement,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 0
      }
    });
  }
}

// --- 10. CUSTOM CURSOR & BG ---
const cursor = document.getElementById('cursor');

window.addEventListener('mousemove', (e) => {
  // track mouse activity for plane steering
  isMouseActive = true;
  clearTimeout(mouseActiveTimeout);
  mouseActiveTimeout = setTimeout(() => {
    isMouseActive = false;
  }, 150);

  // update mouse normalized coords for 3D
  mouse.x = e.clientX / window.innerWidth;
  mouse.y = e.clientY / window.innerHeight;

  if (!cursor || !window.gsap) return;
  gsap.to(cursor, {
    x: e.clientX,
    y: e.clientY,
    duration: 0.1,
    ease: 'power2.out'
  });
});

const interactiveElements = document.querySelectorAll(
  'a, button, .panel, .exp-row, .career-node'
);
interactiveElements.forEach((el) => {
  el.addEventListener('mouseenter', () => {
    if (!cursor || !window.gsap) return;
    cursor.classList.add('hovered');
    gsap.to(cursor, { scale: 0.5, duration: 0.3 });
  });
  el.addEventListener('mouseleave', () => {
    if (!cursor || !window.gsap) return;
    cursor.classList.remove('hovered');
    gsap.to(cursor, { scale: 1, duration: 0.3 });
  });
});

// --- 11. THREE.JS BACKGROUND & FLOATING PAPER PLANE (LAZY INIT) ---
function init3D() {
  if (typeof THREE === 'undefined') return;

  // 1. RENDERER FOR BACKGROUND (Layer 1)
  const rendererBG = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  document.getElementById('canvas-container').appendChild(rendererBG.domElement);
  rendererBG.setSize(window.innerWidth, window.innerHeight);
  rendererBG.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // 2. RENDERER FOR PLANE (Layer 2)
  const rendererFeather = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true
  });
  document
    .getElementById('feather-container')
    .appendChild(rendererFeather.domElement);
  rendererFeather.setSize(window.innerWidth, window.innerHeight);
  rendererFeather.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  rendererFeather.setClearColor(0x000000, 0);

  // --- SCENE 1: ABSTRACT BACKGROUND (Orthographic) ---
  const bgScene = new THREE.Scene();
  const bgCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  const bgMaterial = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uResolution: {
        value: new THREE.Vector2(window.innerWidth, window.innerHeight)
      },
      uMouse: { value: new THREE.Vector2(0.5, 0.5) }
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform vec2 uResolution;
      uniform vec2 uMouse;
      varying vec2 vUv;

      vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

      float snoise(vec2 v) {
        const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                            -0.577350269189626, 0.024390243902439);
        vec2 i  = floor(v + dot(v, C.yy) );
        vec2 x0 = v - i + dot(i, C.xx);
        vec2 i1;
        i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
        vec4 x12 = x0.xyxy + C.xxzz;
        x12.xy -= i1;
        i = mod289(i);
        vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
                           + i.x + vec3(0.0, i1.x, 1.0 ));
        vec3 m = max(0.5 - vec3(dot(x0,x0),
                                dot(x12.xy,x12.xy),
                                dot(x12.zw,x12.zw)), 0.0);
        m = m*m ;
        m = m*m ;
        vec3 x = 2.0 * fract(p * C.www) - 1.0;
        vec3 h = abs(x) - 0.5;
        vec3 ox = floor(x + 0.5);
        vec3 a0 = x - ox;
        m *= 1.79284291400159 - 0.85373472095314
             * ( a0*a0 + h*h );
        vec3 g;
        g.x  = a0.x  * x0.x  + h.x  * x0.y;
        g.yz = a0.yz * x12.xz + h.yz * x12.yw;
        return 130.0 * dot(m, g);
      }

      float fbm(vec2 x) {
        float v = 0.0;
        float a = 0.5;
        vec2 shift = vec2(100.0);
        mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.50));
        for (int i = 0; i < 5; ++i) {
          v += a * snoise(x);
          x = rot * x * 2.0 + shift;
          a *= 0.5;
        }
        return v;
      }

      float ridgedNoise(vec2 p) {
        return 1.0 - abs(snoise(p));
      }

      void main() {
        vec2 uv = gl_FragCoord.xy / uResolution.xy;
        float aspect = uResolution.x / uResolution.y;

        float mx = (uMouse.x - 0.5) * aspect;
        float my = (uMouse.y - 0.5);

        vec3 cOnyx = vec3(0.074, 0.082, 0.082);
        vec3 cGraphite = vec3(0.169, 0.173, 0.157);
        vec3 cVerdigris = vec3(0.2, 0.6, 0.537);
        vec3 cAqua = vec3(0.49, 0.886, 0.82);
        vec3 cSnow = vec3(0.95);

        vec3 col = mix(cOnyx * 0.6, cGraphite * 0.8, smoothstep(1.2, 0.0, uv.y));

        float auroraShape = snoise(vec2(uv.x * aspect * 0.5, uv.y * 0.1 + uTime * 0.02));
        auroraShape += snoise(vec2(uv.x * aspect * 1.5, uv.y * 0.2 - uTime * 0.03)) * 0.5;

        float auroraMask = smoothstep(0.3, 0.9, uv.y + snoise(vec2(uv.x * 0.5, uTime * 0.05))*0.2);

        vec3 auroraCol = mix(cVerdigris, cAqua, snoise(vec2(uv.x, uTime*0.1))*0.5+0.5);
        float pillars = max(0.0, snoise(vec2(uv.x * 10.0, uv.y * 2.0 + uTime * 0.5)));

        col += auroraCol * max(0.0, auroraShape - 0.1) * auroraMask * (0.3 + pillars * 0.2);

        float t = uTime * 0.03;
        float c1 = fbm(vec2(uv.x * aspect * 0.4 + t, uv.y * 1.2));
        float c2 = fbm(vec2(uv.x * aspect * 0.8 - t * 0.5, uv.y * 2.5));

        float clouds = smoothstep(0.3, 0.9, c1 + c2 * 0.4);
        clouds *= smoothstep(0.1, 0.4, uv.y);

        col = mix(col, mix(cSnow, cAqua, 0.3), clouds * 0.4);

        float x3 = uv.x * aspect * 0.6 + mx * 0.02 + 5.0;
        float h3 = ridgedNoise(vec2(x3, 0.0)) * 0.5 + 0.2;
        if(uv.y < h3) {
          float fog = smoothstep(h3, h3 - 0.4, uv.y);
          vec3 mtCol = mix(cGraphite, cOnyx, 0.6);
          col = mix(mtCol, col, fog * 0.8);
        }

        float x2 = uv.x * aspect * 1.0 + mx * 0.05 + 12.3;
        float h2 = ridgedNoise(vec2(x2, 1.0)) * 0.35 + 0.15;
        h2 += snoise(vec2(x2 * 8.0, 0.0)) * 0.03;

        if(uv.y < h2) {
          float fog = smoothstep(h2, h2 - 0.3, uv.y);
          vec3 mtCol = mix(cOnyx, cVerdigris * 0.8, 0.4);
          col = mix(mtCol, col, fog * 0.5);
        }

        float x1 = uv.x * aspect * 1.4 + mx * 0.1 + 42.5;
        float h1 = ridgedNoise(vec2(x1, 2.0)) * 0.25 + 0.05;
        if(uv.y < h1) {
          col = cOnyx;
        }

        float grain = fract(sin(dot(uv, vec2(12.9898, 78.233))) * 43758.5453);
        col += grain * 0.04;

        gl_FragColor = vec4(col, 1.0);
      }
    `
  });

  const bgPlane = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), bgMaterial);
  bgScene.add(bgPlane);

  // --- SCENE 2: FLOATING 3D PAPER PLANE (Perspective) ---
  const planeScene = new THREE.Scene();
  const planeCamera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    100
  );
  planeCamera.position.z = 5;

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
  planeScene.add(ambientLight);
  const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
  dirLight.position.set(5, 10, 7);
  planeScene.add(dirLight);
  const backLight = new THREE.DirectionalLight(0xffffff, 0.5);
  backLight.position.set(-5, -5, -10);
  planeScene.add(backLight);

  const planeGroup = new THREE.Group();

  function createPaperTexture() {
    const size = 512;
    const data = new Uint8Array(size * size * 4);
    for (let i = 0; i < size * size * 4; i += 4) {
      const noise = Math.random() * 40 + 215;
      data[i] = noise;
      data[i + 1] = noise;
      data[i + 2] = noise;
      data[i + 3] = 255;
    }
    const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 2);
    texture.needsUpdate = true;
    return texture;
  }

  const paperTexture = createPaperTexture();

  function createThemedPlane() {
    const geometry = new THREE.BufferGeometry();

    const nose = { x: 0, y: 0, z: 4 };
    const tailTop = { x: 0, y: 0.8, z: -3.5 };
    const tailBottom = { x: 0, y: -0.5, z: -3.5 };
    const wingLeft = { x: 2.8, y: 0.8, z: -3.5 };
    const wingRight = { x: -2.8, y: 0.8, z: -3.5 };

    const spineWidth = 0.15;
    const spineLeft = { x: spineWidth, y: 0.2, z: -3.5 };
    const spineRight = { x: -spineWidth, y: 0.2, z: -3.5 };

    const vertices = [];
    const colors = [];
    const uvs = [];

    const colorMain = new THREE.Color(0x7de2d1);
    const colorDark = new THREE.Color(0xf0f0e8);
    const colorWhite = new THREE.Color(0xfffafb);
    const colorGrey = new THREE.Color(0x339989);

    function getUV(v) {
      return { u: v.x / 6 + 0.5, v: v.z / 8 + 0.5 };
    }

    function addTriangle(v1, v2, v3, color) {
      vertices.push(v1.x, v1.y, v1.z);
      vertices.push(v2.x, v2.y, v2.z);
      vertices.push(v3.x, v3.y, v3.z);

      colors.push(color.r, color.g, color.b);
      colors.push(color.r, color.g, color.b);
      colors.push(color.r, color.g, color.b);

      const uv1 = getUV(v1);
      const uv2 = getUV(v2);
      const uv3 = getUV(v3);
      uvs.push(uv1.u, uv1.v);
      uvs.push(uv2.u, uv2.v);
      uvs.push(uv3.u, uv3.v);
    }

    addTriangle(nose, spineLeft, wingLeft, colorMain);
    addTriangle(nose, wingRight, spineRight, colorMain);

    addTriangle(nose, tailTop, spineLeft, colorWhite);
    addTriangle(nose, spineRight, tailTop, colorWhite);

    addTriangle(nose, wingLeft, tailBottom, colorDark);
    addTriangle(nose, tailBottom, wingRight, colorDark);

    addTriangle(tailTop, tailBottom, spineLeft, colorGrey);
    addTriangle(tailTop, spineRight, tailBottom, colorGrey);

    geometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(vertices, 3)
    );
    geometry.setAttribute(
      'color',
      new THREE.Float32BufferAttribute(colors, 3)
    );
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geometry.computeVertexNormals();

    const material = new THREE.MeshStandardMaterial({
      vertexColors: true,
      map: paperTexture,
      roughness: 0.9,
      metalness: 0.0,
      side: THREE.DoubleSide,
      flatShading: true
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.y = Math.PI;
    return mesh;
  }

  const paperPlane = createThemedPlane();
  planeGroup.add(paperPlane);

  planeGroup.position.set(-15, 10, 0);
  planeGroup.scale.set(0.25, 0.25, 0.25);
  planeScene.add(planeGroup);

  let isIntroAnimating = true;

  let position = new THREE.Vector3(-15, 10, 0);
  let velocity = new THREE.Vector3(0, 0, 0);
  let acceleration = new THREE.Vector3(0, 0, 0);

  const currentQuaternion = new THREE.Quaternion();

  let scrollVelocity = 0;
  let lastScrollY = window.scrollY;

  const introProxy = { x: -15, y: 10, z: 0 };
  if (window.gsap) {
    gsap.to(introProxy, {
      x: 0,
      y: 0,
      z: 0,
      duration: 4.0,
      ease: 'power2.out',
      onUpdate: () => {
        position.set(introProxy.x, introProxy.y, introProxy.z);
        velocity.set(1, -0.2, 0).normalize().multiplyScalar(0.2);
      },
      onComplete: () => {
        isIntroAnimating = false;
      }
    });
  } else {
    position.set(0, 0, 0);
    isIntroAnimating = false;
  }

  function applyForce(force) {
    acceleration.add(force);
  }

  function seek(target, maxSpeed, maxForce) {
    const desired = new THREE.Vector3().subVectors(target, position);
    const dist = desired.length();
    desired.normalize();

    if (dist < 3.0) {
      desired.multiplyScalar(maxSpeed * (dist / 3.0));
    } else {
      desired.multiplyScalar(maxSpeed);
    }

    const steer = new THREE.Vector3().subVectors(desired, velocity);
    steer.clampLength(0, maxForce);
    return steer;
  }

  // Flight target (center path)
  function getFlightTarget(time) {
    const t = time * 0.4;
    return new THREE.Vector3(
      Math.sin(t) * 5.0,          // horizontal radius
      Math.sin(t * 2.0) * 2.5,    // vertical radius
      Math.cos(t) * 4.0 - 4.0     // depth
    );
  }

  function boundaries(d, maxSpeed, maxForce) {
    let desired = null;
    const xLim = CONFIG.physics.xLimit;
    const yLim = CONFIG.physics.yLimit;
    const zMin = CONFIG.physics.zMin;
    const zMax = CONFIG.physics.zMax;

    if (position.x < -xLim)
      desired = new THREE.Vector3(maxSpeed, velocity.y, velocity.z);
    else if (position.x > xLim)
      desired = new THREE.Vector3(-maxSpeed, velocity.y, velocity.z);

    if (position.y < -yLim)
      desired = new THREE.Vector3(velocity.x, maxSpeed, velocity.z);
    else if (position.y > yLim)
      desired = new THREE.Vector3(velocity.x, -maxSpeed, velocity.z);

    if (position.z < zMin)
      desired = new THREE.Vector3(velocity.x, velocity.y, maxSpeed);
    else if (position.z > zMax)
      desired = new THREE.Vector3(velocity.x, velocity.y, -maxSpeed);

    if (desired) {
      desired.normalize().multiplyScalar(maxSpeed);
      const steer = new THREE.Vector3().subVectors(desired, velocity);
      steer.clampLength(0, maxForce);
      return steer;
    }
    return new THREE.Vector3(0, 0, 0);
  }

  const clock = new THREE.Clock();
  let shaderTime = 0;
  let flightTime = 0;
  const mouseVec = new THREE.Vector2(0.5, 0.5);

  function animate() {
    const dt = clock.getDelta();
    shaderTime += dt;

    // Update BG Shader
    mouseVec.set(mouse.x, mouse.y);
    bgMaterial.uniforms.uTime.value = shaderTime;
    bgMaterial.uniforms.uMouse.value = mouseVec;

    // Scroll data only used for speed, not for position
    const currentScrollY = window.scrollY;
    const rawVel = currentScrollY - lastScrollY;
    scrollVelocity += (rawVel - scrollVelocity) * 0.2;
    lastScrollY = currentScrollY;

    const normalizedScroll = Math.min(
      1,
      Math.abs(scrollVelocity) / 40
    );
    const speedFactor =
      1 + CONFIG.flight.scrollBoost * normalizedScroll;

    // Advance flight time based on scroll-influenced speed
    flightTime += dt * CONFIG.flight.baseSpeed * speedFactor;

    // --- PHYSICS ENGINE ---
    if (!isIntroAnimating) {
      const baseMaxSpeed = CONFIG.physics.idleMaxSpeed;
      const baseMaxForce = CONFIG.physics.idleMaxForce;
      const boostedMaxSpeed = CONFIG.physics.activeMaxSpeed;
      const boostedMaxForce = CONFIG.physics.activeMaxForce;

      const maxSpeed = isMouseActive ? boostedMaxSpeed : baseMaxSpeed;
      const maxForce = isMouseActive ? boostedMaxForce : baseMaxForce;

      // 1) Base looping flight around center
      const patternTarget = getFlightTarget(flightTime);
      let target = patternTarget.clone();

      // 2) Add gentle mouse steering around that path
      if (isMouseActive) {
        const mouseOffset = new THREE.Vector3(
          (mouse.x - 0.5) * 6,   // small horizontal steering
          -(mouse.y - 0.5) * 3,  // small vertical steering
          0
        );
        target.add(mouseOffset.multiplyScalar(0.4)); // blend strength
      }

      const moveForce = seek(target, maxSpeed, maxForce);
      applyForce(moveForce);

      // 3) Soft boundaries so it stays on-screen
      const safetyForce = boundaries(1.0, maxSpeed * 1.2, 0.05);
      applyForce(safetyForce);

      // 4) Integrate physics
      velocity.add(acceleration);
      velocity.clampLength(0, maxSpeed);
      position.add(velocity);
      acceleration.multiplyScalar(0);
    }

    // UPDATE VISUALS
    planeGroup.position.copy(position);

    // Orientation / banking
    if (velocity.lengthSq() > 0.00001) {
      const targetQuaternion = new THREE.Quaternion();
      const lookMatrix = new THREE.Matrix4();
      const up = new THREE.Vector3(0, 1, 0);

      const eye = new THREE.Vector3(0, 0, 0);
      lookMatrix.lookAt(eye, velocity, up);
      targetQuaternion.setFromRotationMatrix(lookMatrix);

      const bankAmount = -velocity.x * 0.5;
      const maxBank = Math.PI / 3.0;
      const clampedBank = Math.max(-maxBank, Math.min(maxBank, bankAmount));

      const rollQuaternion = new THREE.Quaternion();
      rollQuaternion.setFromAxisAngle(
        new THREE.Vector3(0, 0, 1),
        clampedBank
      );

      targetQuaternion.multiply(rollQuaternion);

      planeGroup.quaternion.slerp(targetQuaternion, 0.05);
    }

    rendererBG.render(bgScene, bgCamera);
    rendererFeather.render(planeScene, planeCamera);

    requestAnimationFrame(animate);
  }

  animate();

  window.addEventListener('resize', () => {
    const w = window.innerWidth;
    const h = window.innerHeight;

    rendererBG.setSize(w, h);
    rendererFeather.setSize(w, h);

    bgMaterial.uniforms.uResolution.value.set(w, h);
    planeCamera.aspect = w / h;
    planeCamera.updateProjectionMatrix();
  });
}

// Lazy-load 3D after page load / idle
function schedule3DInit() {
  if (typeof THREE === 'undefined') return;

  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => init3D());
  } else {
    setTimeout(init3D, 1000);
  }
}

window.addEventListener('load', () => {
  schedule3DInit();
  if (window.ScrollTrigger) {
    ScrollTrigger.refresh();
  }
});
