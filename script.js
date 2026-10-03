/**
 * ORAVEL — Pure Organic Apple Juice Experience
 * 
 * COORDINATED FULL-SCREEN 3D CINEMATIC ENGINE:
 * - HOME: Video-Based Cinematic Scroll (canvas-scrubbed timeline)
 * - STORY / FEATURES / ABOUT / CONTACT: Unified full-screen 3D scene where:
 *   [BOTTLE 3D MOVEMENT] + [TEXT/CONTENT 3D PARALLAX] + [ATMOSPHERE & ORBS] + [FLOATING BOTANICALS]
 *   move together in full synchrony as a single choreographed camera move.
 * 
 * Hardware-accelerated interpolation with requestAnimationFrame and full bidirectional scroll reversal.
 */

(function () {
  'use strict';

  // DOM Elements - Home Video System
  const video = document.getElementById('juiceVideo');
  const canvas = document.getElementById('videoCanvas');
  const ctx = canvas ? canvas.getContext('2d', { alpha: false, desynchronized: true }) : null;

  // DOM Elements - Section 2 (Story) Video System
  const storyVideo = document.getElementById('storyVideo');
  const storyCanvas = document.getElementById('storyVideoCanvas');
  const storyCtx = storyCanvas ? storyCanvas.getContext('2d', { alpha: false, desynchronized: true }) : null;
  
  const introBackdrop = document.getElementById('introBackdrop');
  const oravelBrandWrapper = document.getElementById('oravelBrandWrapper');
  const siteHeader = document.getElementById('siteHeader');
  const videoContainer = document.getElementById('videoContainer');
  const sceneOverlayStage = document.getElementById('sceneOverlayStage');
  const scrollCue = document.getElementById('scrollCue');
  const homeExitFade = document.getElementById('homeExitFade');

  const heroNode = document.getElementById('heroNode');
  const featureNodes = [
    document.getElementById('featureNode1'), // 01 FRESH (Right side)
    document.getElementById('featureNode2'), // 02 NATURAL (Left side)
    document.getElementById('featureNode3')  // 03 PURE APPLE (Right side)
  ];

  // DOM Elements - 3D Product System
  const global3dViewport = document.getElementById('global3dViewport');
  const product3dWrapper = document.getElementById('product3dWrapper');
  const product3d = document.getElementById('product3d');
  const productGlow = document.getElementById('productGlow');
  const productShadow = document.getElementById('productShadow');

  // Floating orchard parallax items
  const leaf1 = document.getElementById('leaf1');
  const leaf2 = document.getElementById('leaf2');
  const leaf3 = document.getElementById('leaf3');
  const bokeh1 = document.getElementById('bokeh1');
  const bokeh2 = document.getElementById('bokeh2');

  const navItems = document.querySelectorAll('.nav-item');
  const scrollButtons = document.querySelectorAll('[data-scroll-to]');

  // Home Video Scrub State
  let videoDuration = 0;
  let targetTime = 0;
  let currentTime = 0;
  let isSeeking = false;
  let pendingSeekTime = null;
  let hasIntroCompleted = false;

  // Story Video Scrub State
  let storyVideoDuration = 0;
  let storyTargetTime = 0;
  let storyCurrentTime = 0;
  let isStorySeeking = false;
  let pendingStorySeekTime = null;

  // 3D Product Transform Target & Current State (for smooth lerp)
  const productTarget = {
    x: 0,
    y: 0,
    z: -300,
    rotX: 0,
    rotY: 0,
    rotZ: 0,
    scale: 0.8,
    opacity: 0,
    glowOpacity: 0.5
  };

  const productCurrent = {
    x: 0,
    y: 0,
    z: -300,
    rotX: 0,
    rotY: 0,
    rotZ: 0,
    scale: 0.8,
    opacity: 0,
    glowOpacity: 0.5
  };

  // -------------------------------------------------------------
  // 1. ORAVEL OPENING LOGO INTRO SEQUENCE
  // -------------------------------------------------------------
  function runOravelLogoIntro() {
    if (!oravelBrandWrapper || !siteHeader) return;

    // Step 1: Center reveal
    setTimeout(() => {
      oravelBrandWrapper.classList.add('intro-reveal');
    }, 200);

    // Step 2: Dissolve clean backdrop
    setTimeout(() => {
      if (introBackdrop) {
        introBackdrop.classList.add('dissolved');
      }
    }, 1100);

    // Step 3: Logo settles into header
    setTimeout(() => {
      oravelBrandWrapper.classList.add('intro-settled');
      siteHeader.classList.add('visible');
      hasIntroCompleted = true;
      
      if (heroNode && (window.pageYOffset || document.documentElement.scrollTop) < 100) {
        heroNode.classList.add('active');
      }
    }, 1700);
  }

  // -------------------------------------------------------------
  // 2. CANVAS VIDEO RENDERING ENGINE (Hardware Accelerated for HOME)
  // -------------------------------------------------------------
  function resizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (canvas) {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      drawFrame();
    }
    if (storyCanvas) {
      storyCanvas.width = window.innerWidth * dpr;
      storyCanvas.height = window.innerHeight * dpr;
      drawStoryFrame();
    }
  }

  function drawFrame() {
    if (!ctx || !video || video.readyState < 2) return;

    const vWidth = video.videoWidth || 1920;
    const vHeight = video.videoHeight || 1080;
    const cWidth = canvas.width;
    const cHeight = canvas.height;

    const videoAspect = vWidth / vHeight;
    const canvasAspect = cWidth / cHeight;

    let drawWidth, drawHeight, drawX, drawY;

    if (canvasAspect > videoAspect) {
      drawWidth = cWidth;
      drawHeight = cWidth / videoAspect;
      drawX = 0;
      drawY = (cHeight - drawHeight) / 2;
    } else {
      drawHeight = cHeight;
      drawWidth = cHeight * videoAspect;
      drawX = (cWidth - drawWidth) / 2;
      drawY = 0;
    }

    ctx.drawImage(video, drawX, drawY, drawWidth, drawHeight);
  }

  function performSeek(time) {
    if (!video || isNaN(time) || videoDuration === 0) return;
    const safeTime = Math.max(0, Math.min(time, videoDuration - 0.03));

    if (isSeeking) {
      pendingSeekTime = safeTime;
      return;
    }

    if (Math.abs(video.currentTime - safeTime) > 0.01) {
      isSeeking = true;
      video.currentTime = safeTime;
    }
  }

  if (video) {
    video.addEventListener('seeked', () => {
      isSeeking = false;
      drawFrame();
      if (pendingSeekTime !== null) {
        const nextTime = pendingSeekTime;
        pendingSeekTime = null;
        performSeek(nextTime);
      }
    });
  }

  // -------------------------------------------------------------
  // 2b. STORY VIDEO RENDERING & SCRUB ENGINE (Section 2)
  // -------------------------------------------------------------
  function drawStoryFrame() {
    if (!storyCtx || !storyVideo || storyVideo.readyState < 2) return;

    const vWidth = storyVideo.videoWidth || 1920;
    const vHeight = storyVideo.videoHeight || 1080;
    const cWidth = storyCanvas.width;
    const cHeight = storyCanvas.height;

    const videoAspect = vWidth / vHeight;
    const canvasAspect = cWidth / cHeight;

    let drawWidth, drawHeight, drawX, drawY;

    if (canvasAspect > videoAspect) {
      drawWidth = cWidth;
      drawHeight = cWidth / videoAspect;
      drawX = 0;
      drawY = (cHeight - drawHeight) / 2;
    } else {
      drawHeight = cHeight;
      drawWidth = cHeight * videoAspect;
      drawX = (cWidth - drawWidth) / 2;
      drawY = 0;
    }

    storyCtx.drawImage(storyVideo, drawX, drawY, drawWidth, drawHeight);
  }

  function performStorySeek(time) {
    if (!storyVideo || isNaN(time) || storyVideoDuration === 0) return;
    const safeTime = Math.max(0, Math.min(time, storyVideoDuration - 0.03));

    if (isStorySeeking) {
      pendingStorySeekTime = safeTime;
      return;
    }

    if (Math.abs(storyVideo.currentTime - safeTime) > 0.01) {
      isStorySeeking = true;
      storyVideo.currentTime = safeTime;
    }
  }

  if (storyVideo) {
    storyVideo.addEventListener('seeked', () => {
      isStorySeeking = false;
      drawStoryFrame();
      if (pendingStorySeekTime !== null) {
        const nextTime = pendingStorySeekTime;
        pendingStorySeekTime = null;
        performStorySeek(nextTime);
      }
    });
  }

  // Helper: Linear interpolation
  function lerp(start, end, factor) {
    return start + (end - start) * factor;
  }

  // Helper: Clamp
  function clamp(val, min, max) {
    return Math.min(Math.max(val, min), max);
  }

  // -------------------------------------------------------------
  // 3. CONTINUOUS SCROLL MASTER CHOREOGRAPHY
  // -------------------------------------------------------------
  function onScrollChoreography() {
    const scrollY = window.pageYOffset || document.documentElement.scrollTop || 0;
    const windowH = window.innerHeight;
    const isMobile = window.innerWidth <= 960;
    
    // Virtual scrub height for Home video sequence
    const homeDistance = windowH * 3.8;
    const homeProgress = clamp(scrollY / homeDistance, 0, 1);

    // Map video timeline across Home scrub distance
    if (videoDuration > 0) {
      targetTime = homeProgress * videoDuration;
    }

    // Hide scroll cue once user starts scrolling
    if (scrollCue) {
      scrollCue.style.opacity = scrollY > 60 ? '0' : '1';
    }

    // ---------------------------------------------------------
    // HOME SECTION: Hero & Feature Overlays (Video scrub timeline)
    // ---------------------------------------------------------
    if (hasIntroCompleted) {
      if (homeProgress < 0.10) {
        heroNode.classList.add('active');
      } else {
        heroNode.classList.remove('active');
      }

      if (homeProgress >= 0.12 && homeProgress < 0.38) {
        featureNodes[0].classList.add('active');
      } else {
        featureNodes[0].classList.remove('active');
      }

      if (homeProgress >= 0.39 && homeProgress < 0.68) {
        featureNodes[1].classList.add('active');
      } else {
        featureNodes[1].classList.remove('active');
      }

      if (homeProgress >= 0.69 && homeProgress <= 0.96) {
        featureNodes[2].classList.add('active');
      } else {
        featureNodes[2].classList.remove('active');
      }
    }

    // ---------------------------------------------------------
    // SECTION TRANSITION: HOME -> STORY
    // Strictly isolate Video to Home. Fade out video as Story approaches.
    // ---------------------------------------------------------
    const storyEl = document.getElementById('story');
    const featuresEl = document.getElementById('features');
    const aboutEl = document.getElementById('about');
    const contactEl = document.getElementById('contact');

    let inHome = true;
    let storyRectTop = 99999;
    if (storyEl) {
      storyRectTop = storyEl.getBoundingClientRect().top;
    }

    if (storyRectTop <= windowH) {
      const transitionProgress = clamp((windowH - storyRectTop) / windowH, 0, 1);
      
      if (sceneOverlayStage) {
        sceneOverlayStage.style.opacity = (1 - transitionProgress).toString();
      }
      if (homeExitFade) {
        homeExitFade.style.opacity = (transitionProgress * 1.0).toString();
      }
      
      if (transitionProgress >= 0.85) {
        inHome = false;
        if (videoContainer) {
          videoContainer.style.opacity = '0';
          videoContainer.style.visibility = 'hidden';
        }
      } else {
        if (videoContainer) {
          videoContainer.style.opacity = (1 - transitionProgress * 0.9).toString();
          videoContainer.style.visibility = 'visible';
        }
      }
    } else {
      inHome = true;
      if (sceneOverlayStage) sceneOverlayStage.style.opacity = '1';
      if (homeExitFade) homeExitFade.style.opacity = '0';
      if (videoContainer) {
        videoContainer.style.opacity = '1';
        videoContainer.style.visibility = 'visible';
      }
    }

    // Activate Global 3D Viewport & Global Cinematic Background once we enter 3D zones
    const globalCinematicBg = document.getElementById('globalCinematicBg');
    if (globalCinematicBg) {
      if (!inHome || storyRectTop <= windowH * 0.9) {
        globalCinematicBg.classList.add('active');
      } else {
        globalCinematicBg.classList.remove('active');
      }
    }

    if (global3dViewport) {
      if (!inHome || storyRectTop <= windowH * 0.9) {
        global3dViewport.classList.add('active');
      } else {
        global3dViewport.classList.remove('active');
      }
    }

    // ---------------------------------------------------------
    // 3D PRODUCT TRANSFORM CHOREOGRAPHY ACROSS INNER SECTIONS
    // ---------------------------------------------------------
    update3DProductState(scrollY, windowH, isMobile, storyEl, featuresEl, aboutEl, contactEl);

    // Update Coordinated Content Parallax & Scene Progress
    updateStory3DTrack(storyEl, windowH, isMobile);
    updateFeatures3DTrack(featuresEl, windowH, isMobile);
    updateAbout3DTrack(aboutEl, windowH, isMobile);
    updateContact3DTrack(contactEl, windowH, isMobile);

    // Active Navigation Highlight
    updateActiveNav(scrollY, homeDistance);
  }

  // -------------------------------------------------------------
  // 4. FULL-SCREEN 3D PRODUCT MULTI-SECTION COORDINATOR
  // Dynamic Alternating Bottle Movement: LEFT -> RIGHT -> LEFT -> RIGHT
  // -------------------------------------------------------------
  function update3DProductState(scrollY, windowH, isMobile, storyEl, featuresEl, aboutEl, contactEl) {
    if (!storyEl) return;

    const storyRect = storyEl.getBoundingClientRect();
    const featuresRect = featuresEl ? featuresEl.getBoundingClientRect() : { top: 99999, height: 0 };
    const aboutRect = aboutEl ? aboutEl.getBoundingClientRect() : { top: 99999, height: 0 };
    const contactRect = contactEl ? contactEl.getBoundingClientRect() : { top: 99999, height: 0 };

    const xOffset = isMobile ? 0 : 320;

    // SECTION 1: HOME (Product hidden in depth)
    if (storyRect.top > windowH) {
      productTarget.opacity = 0;
      productTarget.z = -500;
      productTarget.scale = 0.6;
      productTarget.rotY = 0;
      productTarget.x = 0;
      productTarget.y = 0;
      return;
    }

    // SECTION 2: TRANSITION INTO STORY (Home bottom -> Story top: Bottle moves to LEFT)
    if (storyRect.top > 0) {
      const enterProg = clamp((windowH - storyRect.top) / windowH, 0, 1);
      productTarget.opacity = enterProg;
      productTarget.x = lerp(0, -xOffset, enterProg);
      productTarget.y = lerp(50, 0, enterProg);
      productTarget.z = lerp(-400, 40, enterProg);
      productTarget.scale = lerp(0.75, 1.05, enterProg);
      productTarget.rotY = lerp(-20, 14, enterProg);
      productTarget.rotX = lerp(10, -2, enterProg);
      productTarget.rotZ = 0;
      productTarget.glowOpacity = enterProg * 0.6;
      return;
    }

    // SECTION 3: STORY TRACK (4 SCENES ALTERNATING LEFT -> RIGHT -> LEFT -> RIGHT)
    const storyTravel = storyEl.offsetHeight - windowH;
    if (storyTravel > 0 && -storyRect.top <= storyTravel) {
      const p = clamp(-storyRect.top / storyTravel, 0, 1);
      productTarget.opacity = 1;

      if (p < 0.25) {
        // SCENE 01: "OUR STORY" — Bottle LEFT, Content RIGHT
        const localP = p / 0.25;
        productTarget.x = -xOffset;
        productTarget.y = lerp(0, -10, localP);
        productTarget.z = lerp(40, 100, localP);
        productTarget.rotY = lerp(14, 10, localP);
        productTarget.rotX = lerp(-2, -4, localP);
        productTarget.rotZ = 0;
        productTarget.scale = lerp(1.05, 1.10, localP);
      } else if (p < 0.50) {
        // SCENE 02: "FROM THE ORCHARD" — Bottle moves LEFT -> RIGHT, Content LEFT
        const localP = (p - 0.25) / 0.25;
        productTarget.x = lerp(-xOffset, xOffset, localP);
        productTarget.y = lerp(-10, 15, localP);
        productTarget.z = lerp(100, 60, localP);
        productTarget.rotY = lerp(10, -18, localP);
        productTarget.rotX = lerp(-4, 5, localP);
        productTarget.rotZ = lerp(0, -3, localP);
        productTarget.scale = lerp(1.10, 1.05, localP);
      } else if (p < 0.75) {
        // SCENE 03: "THE CRAFT" — Bottle moves RIGHT -> LEFT, Content RIGHT
        const localP = (p - 0.50) / 0.25;
        productTarget.x = lerp(xOffset, -xOffset, localP);
        productTarget.y = lerp(15, -10, localP);
        productTarget.z = lerp(60, 90, localP);
        productTarget.rotY = lerp(-18, 22, localP);
        productTarget.rotX = lerp(5, -5, localP);
        productTarget.rotZ = lerp(-3, 3, localP);
        productTarget.scale = lerp(1.05, 1.10, localP);
      } else {
        // SCENE 04: "PURE IN EVERY DROP" — Bottle moves LEFT -> RIGHT, Content LEFT
        const localP = (p - 0.75) / 0.25;
        productTarget.x = lerp(-xOffset, xOffset, localP);
        productTarget.y = lerp(-10, 0, localP);
        productTarget.z = lerp(90, 120, localP);
        productTarget.rotY = lerp(22, -10, localP);
        productTarget.rotX = lerp(-5, 0, localP);
        productTarget.rotZ = lerp(3, 0, localP);
        productTarget.scale = lerp(1.10, 1.15, localP);
      }
      return;
    }

    // SECTION 4: FEATURES TRACK (4 SCENES ALTERNATING LEFT -> RIGHT -> LEFT -> RIGHT)
    const featuresTravel = featuresEl ? featuresEl.offsetHeight - windowH : 0;
    if (featuresEl && featuresTravel > 0 && featuresRect.top <= 0 && -featuresRect.top <= featuresTravel) {
      const p = clamp(-featuresRect.top / featuresTravel, 0, 1);
      productTarget.opacity = 1;

      const featX = isMobile ? 0 : 340;

      if (p < 0.25) {
        // FEATURE 01: FRESH — Bottle moves RIGHT -> LEFT, Content RIGHT
        const localP = p / 0.25;
        productTarget.x = lerp(xOffset, -featX, localP);
        productTarget.y = lerp(0, 10, localP);
        productTarget.z = lerp(120, 100, localP);
        productTarget.rotY = lerp(-10, 18, localP);
        productTarget.rotX = lerp(0, 4, localP);
        productTarget.rotZ = -2;
        productTarget.scale = lerp(1.15, 1.08, localP);
      } else if (p < 0.50) {
        // FEATURE 02: NATURAL — Bottle moves LEFT -> RIGHT, Content LEFT
        const localP = (p - 0.25) / 0.25;
        productTarget.x = lerp(-featX, featX, localP);
        productTarget.y = lerp(10, -15, localP);
        productTarget.z = lerp(100, 120, localP);
        productTarget.rotY = lerp(18, -20, localP);
        productTarget.rotX = lerp(4, -4, localP);
        productTarget.rotZ = 2;
        productTarget.scale = lerp(1.08, 1.06, localP);
      } else if (p < 0.75) {
        // FEATURE 03: PURE — Bottle moves RIGHT -> LEFT, Content RIGHT
        const localP = (p - 0.50) / 0.25;
        productTarget.x = lerp(featX, -featX, localP);
        productTarget.y = lerp(-15, 0, localP);
        productTarget.z = lerp(120, 110, localP);
        productTarget.rotY = lerp(-20, 18, localP);
        productTarget.rotX = lerp(-4, 0, localP);
        productTarget.rotZ = 0;
        productTarget.scale = lerp(1.06, 1.10, localP);
      } else {
        // FEATURE 04: QUALITY — Bottle moves LEFT -> RIGHT, Content LEFT
        const localP = (p - 0.75) / 0.25;
        productTarget.x = lerp(-featX, featX, localP);
        productTarget.y = lerp(0, -10, localP);
        productTarget.z = lerp(110, 140, localP);
        productTarget.rotY = lerp(18, -12, localP);
        productTarget.rotX = 0;
        productTarget.rotZ = 0;
        productTarget.scale = lerp(1.10, 1.16, localP);
      }
      return;
    }

    // SECTION 5: ABOUT SECTION — Bottle moves RIGHT -> LEFT, Content RIGHT
    const aboutTravel = aboutEl ? aboutEl.offsetHeight - windowH : 0;
    if (aboutEl && aboutTravel > 0 && aboutRect.top <= 0 && -aboutRect.top <= aboutTravel) {
      const p = clamp(-aboutRect.top / aboutTravel, 0, 1);
      const aboutX = isMobile ? 0 : 330;
      productTarget.opacity = 1;
      productTarget.x = lerp(isMobile ? 0 : 340, -aboutX, p);
      productTarget.y = Math.cos(p * Math.PI * 2) * 15;
      productTarget.z = lerp(140, 90, p);
      productTarget.rotY = lerp(-12, 16, p);
      productTarget.rotX = Math.sin(p * Math.PI) * 5;
      productTarget.rotZ = Math.sin(p * Math.PI * 2) * 2;
      productTarget.scale = lerp(1.16, 1.08, p);
      return;
    }

    // SECTION 6: CONTACT SECTION — Bottle moves LEFT -> RIGHT, Content LEFT
    const contactTravel = contactEl ? contactEl.offsetHeight - windowH : 0;
    if (contactEl && contactRect.top <= windowH) {
      const enterProg = clamp((windowH - contactRect.top) / (windowH + (contactTravel > 0 ? contactTravel : windowH)), 0, 1);
      const contactX = isMobile ? 0 : 330;
      productTarget.opacity = 1;
      productTarget.x = lerp(isMobile ? 0 : -330, contactX, enterProg);
      productTarget.y = lerp(15, -10, enterProg);
      productTarget.z = lerp(90, 160, enterProg);
      productTarget.rotY = lerp(16, -10, enterProg);
      productTarget.rotX = lerp(4, 0, enterProg);
      productTarget.rotZ = 0;
      productTarget.scale = lerp(1.08, 1.18, enterProg);
      productTarget.glowOpacity = lerp(0.5, 0.85, enterProg);
    }
  }

  // -------------------------------------------------------------
  // 5. INNER SECTION EDITORIAL SCENE CONTROLLERS (Synchronized Content Motion)
  // -------------------------------------------------------------
  // -------------------------------------------------------------
  // 5. INNER SECTION EDITORIAL SCENE CONTROLLERS (Synchronized Content Motion & Background Camera)
  // -------------------------------------------------------------
  function updateStory3DTrack(storyEl, windowH, isMobile) {
    if (!storyEl) return;
    const rect = storyEl.getBoundingClientRect();
    const totalTravel = storyEl.offsetHeight - windowH;
    if (totalTravel <= 0) return;

    const progress = clamp(-rect.top / totalTravel, 0, 1);
    const storyCards = storyEl.querySelectorAll('.cinematic-scene-card');
    const totalScenes = storyCards.length;
    if (totalScenes === 0) return;

    // 1. Scroll-Driven Story Video Scrubbing Effect
    if (storyVideoDuration > 0) {
      storyTargetTime = progress * storyVideoDuration;
    }

    // Background Movement
    const storyBg = document.getElementById('storyEnvBg');
    if (storyBg) {
      const bgScale = 1.00 + progress * 0.035;
      storyBg.style.transform = `scale(${bgScale.toFixed(4)})`;
    }

    let activeIdx = Math.floor(progress * totalScenes);
    if (activeIdx >= totalScenes) activeIdx = totalScenes - 1;

    // Alternating side movement directions:
    // Scene 0: "OUR STORY" -> enters from LEFT (-80px -> 0)
    // Scene 1: "THE HARVEST / FROM THE ORCHARD" -> enters from RIGHT (+80px -> 0)
    // Scene 2: "THE CRAFT" -> enters from LEFT (-80px -> 0)
    // Scene 3: "PURE IN EVERY DROP" -> enters from RIGHT (+80px -> 0)
    const entryDirections = [-1, 1, -1, 1]; // -1 = from left, +1 = from right

    storyCards.forEach((card, idx) => {
      const sceneRel = progress * totalScenes - idx; // 0 to 1 when entering, 1 when active center
      const localP = clamp(sceneRel, 0, 1);
      const dir = entryDirections[idx] || (idx % 2 === 0 ? -1 : 1);
      const contentBox = card.querySelector('.scene-content-box');

      if (idx === activeIdx) {
        card.classList.add('active');
        card.classList.remove('past');
        
        // Controlled horizontal movement (e.g., from -70px to 0 to +15px)
        if (contentBox) {
          const moveFactor = isMobile ? 30 : 70;
          // As scene progresses from 0 to 1:
          // localP goes 0 -> 1. At localP = 0.5 (center of scene), transX = 0.
          const transX = (1 - localP * 1.6) * (dir * moveFactor);
          const transY = (localP - 0.5) * -18;
          const transZ = (1 - Math.abs(localP - 0.5)) * 20;
          const rotY = (localP - 0.5) * (dir * 2);
          
          contentBox.style.transform = `translate3d(${transX.toFixed(2)}px, ${transY.toFixed(2)}px, ${transZ.toFixed(2)}px) rotateY(${rotY.toFixed(2)}deg)`;
          contentBox.style.opacity = '1';
        }
      } else if (idx < activeIdx) {
        card.classList.remove('active');
        card.classList.add('past');
        if (contentBox) {
          contentBox.style.transform = `translate3d(${-dir * (isMobile ? 30 : 60)}px, -30px, -20px)`;
          contentBox.style.opacity = '0';
        }
      } else {
        card.classList.remove('active');
        card.classList.remove('past');
        if (contentBox) {
          contentBox.style.transform = `translate3d(${dir * (isMobile ? 35 : 75)}px, 30px, -20px)`;
          contentBox.style.opacity = '0';
        }
      }
    });

    const progressFill = document.querySelector('#storyProgress .progress-bar-fill');
    const sceneIdxSpan = document.querySelector('#storyProgress .current-scene-idx');
    if (progressFill) progressFill.style.width = `${((activeIdx + 1) / totalScenes) * 100}%`;
    if (sceneIdxSpan) sceneIdxSpan.textContent = `0${activeIdx + 1}`;

    // Parallax shift for atmospheric orbs
    const orbs = storyEl.querySelectorAll('.ambient-visual-circle');
    orbs.forEach((orb, i) => {
      const dir = i % 2 === 0 ? 1 : -1;
      orb.style.transform = `translateY(${(progress - 0.5) * 80 * dir}px)`;
    });
  }

  function updateFeatures3DTrack(featuresEl, windowH, isMobile) {
    if (!featuresEl) return;
    const rect = featuresEl.getBoundingClientRect();
    const totalTravel = featuresEl.offsetHeight - windowH;
    if (totalTravel <= 0) return;

    const progress = clamp(-rect.top / totalTravel, 0, 1);
    const featureCards = featuresEl.querySelectorAll('.cinematic-scene-card');
    const totalScenes = featureCards.length;
    if (totalScenes === 0) return;

    // 1. Cinematic Full-Screen Background Movement (Subtle camera zoom)
    const featuresBg = document.getElementById('featuresEnvBg');
    if (featuresBg) {
      const bgScale = 1.00 + progress * 0.035;
      featuresBg.style.transform = `scale(${bgScale.toFixed(4)})`;
    }

    let activeIdx = Math.floor(progress * totalScenes);
    if (activeIdx >= totalScenes) activeIdx = totalScenes - 1;

    // Feature spatial trajectory configuration:
    // Feature 01: Enters from depth + left, rotates slightly, settles in left focus
    // Feature 02: Feature 01 recedes back; Feature 02 enters from depth + right with opposite yaw
    // Feature 03: Feature 02 recedes; Feature 03 surges forward through center with high-depth scale
    // Feature 04: Feature 03 recedes; Feature 04 moves forward in 3D perspective to settle
    const entryDirections = [-1, 1, -1, 1]; // X offset direction

    featureCards.forEach((card, idx) => {
      // Continuous relative progress through this scene's window:
      // idx - 0.5 to idx + 0.5 (where idx is center/peak)
      const sceneCenter = (idx + 0.5) / totalScenes;
      const sceneRadius = 0.5 / totalScenes;
      const distFromCenter = (progress - sceneCenter) / sceneRadius; // -1 (entering) to 0 (peak) to +1 (exiting)

      const dir = entryDirections[idx] || (idx % 2 === 0 ? -1 : 1);
      const contentBox = card.querySelector('.scene-content-box');

      // Card is in view if -1.1 <= distFromCenter <= 1.1
      if (distFromCenter >= -1.15 && distFromCenter <= 1.15) {
        card.classList.add('active');
        card.classList.remove('past');

        // Smooth Gaussian-like opacity peak around center
        const absDist = Math.abs(distFromCenter);
        const cardOpacity = clamp(1 - Math.pow(absDist, 1.6), 0, 1);
        const cardBlur = Math.max(0, (absDist - 0.3) * 14);

        card.style.opacity = cardOpacity.toFixed(3);
        card.style.filter = cardBlur > 0.1 ? `blur(${cardBlur.toFixed(1)}px)` : 'none';
        card.style.visibility = cardOpacity > 0.01 ? 'visible' : 'hidden';
        card.style.pointerEvents = absDist < 0.4 ? 'auto' : 'none';

        if (contentBox) {
          const moveFactorX = isMobile ? 35 : (idx >= 2 ? 0 : 80);
          
          // When distFromCenter < 0 (entering from scroll down): starts with offset and negative Z
          // When distFromCenter = 0 (peak): 0 offset, positive Z, 0 rotation
          // When distFromCenter > 0 (exiting to next feature): pushes away in opposite direction
          const transX = distFromCenter * dir * -moveFactorX;
          const transY = distFromCenter * -30;
          const transZ = (1 - absDist) * 60 - (absDist * 80); // peaks forward at +60px, falls back to -80px
          const scale = 0.88 + (1 - absDist) * 0.16; // 0.88 -> 1.04 -> 0.88
          const rotY = distFromCenter * dir * -7; // subtle cinematic rotation
          const rotX = distFromCenter * 4;

          contentBox.style.transform = `translate3d(${transX.toFixed(2)}px, ${transY.toFixed(2)}px, ${transZ.toFixed(2)}px) scale(${scale.toFixed(3)}) rotateY(${rotY.toFixed(2)}deg) rotateX(${rotX.toFixed(2)}deg)`;
          contentBox.style.opacity = cardOpacity.toFixed(3);
        }
      } else {
        card.classList.remove('active');
        if (distFromCenter > 1.15) {
          card.classList.add('past');
        } else {
          card.classList.remove('past');
        }
        card.style.opacity = '0';
        card.style.visibility = 'hidden';
        card.style.filter = 'blur(14px)';
        card.style.pointerEvents = 'none';

        if (contentBox) {
          const exitDir = distFromCenter > 0 ? -dir : dir;
          contentBox.style.transform = `translate3d(${exitDir * 60}px, ${distFromCenter > 0 ? -40 : 40}px, -120px) scale(0.85)`;
          contentBox.style.opacity = '0';
        }
      }
    });

    const progressFill = document.querySelector('#featuresProgress .progress-bar-fill');
    const sceneIdxSpan = document.querySelector('#featuresProgress .current-scene-idx');
    if (progressFill) progressFill.style.width = `${((activeIdx + 1) / totalScenes) * 100}%`;
    if (sceneIdxSpan) sceneIdxSpan.textContent = `0${activeIdx + 1}`;

    const orbs = featuresEl.querySelectorAll('.ambient-visual-circle');
    orbs.forEach((orb, i) => {
      const dir = i % 2 === 0 ? 1 : -1;
      orb.style.transform = `translateY(${(progress - 0.5) * 70 * dir}px)`;
    });
  }

  function updateAbout3DTrack(aboutEl, windowH, isMobile) {
    if (!aboutEl) return;
    const rect = aboutEl.getBoundingClientRect();
    const card = aboutEl.querySelector('.cinematic-scene-card');
    if (!card) return;

    const totalTravel = aboutEl.offsetHeight - windowH;
    const progress = totalTravel > 0 ? clamp(-rect.top / totalTravel, 0, 1) : clamp((windowH - rect.top) / (windowH * 1.5), 0, 1);

    // 1. Cinematic Full-Screen Background Movement (Subtle Anchored Slow Camera Zoom: 1.00 -> 1.035)
    const aboutBg = document.getElementById('aboutEnvBg');
    if (aboutBg && rect.top <= windowH && rect.bottom >= 0) {
      const bgScale = 1.00 + progress * 0.035;
      aboutBg.style.transform = `scale(${bgScale.toFixed(4)})`;
    }

    if (rect.top <= windowH * 0.75 && rect.bottom >= 0) {
      card.classList.add('active');
      const contentBox = card.querySelector('.about-content-box');
      if (contentBox) {
        // Controlled horizontal reveal from left to center
        const moveFactor = isMobile ? 25 : 60;
        const transX = (1 - clamp(progress * 1.4, 0, 1)) * -moveFactor;
        const transY = (progress - 0.5) * -16;
        const transZ = (1 - Math.abs(progress - 0.5)) * 18;
        contentBox.style.transform = `translate3d(${transX.toFixed(2)}px, ${transY.toFixed(2)}px, ${transZ.toFixed(2)}px)`;
      }

      // Progressive staggered reveal for pillars
      const pillars = aboutEl.querySelectorAll('.about-pillar');
      pillars.forEach((pillar, pIdx) => {
        const pillarThreshold = 0.25 + pIdx * 0.12;
        if (progress >= pillarThreshold) {
          pillar.style.opacity = '1';
          pillar.style.transform = 'translate3d(0, 0, 0)';
        } else {
          const pSub = clamp(progress / pillarThreshold, 0, 1);
          pillar.style.opacity = (pSub * 0.9).toFixed(2);
          pillar.style.transform = `translate3d(0, ${(1 - pSub) * 16}px, 0)`;
        }
      });

    } else if (rect.top > windowH * 0.75) {
      card.classList.remove('active');
    }

    const orbs = aboutEl.querySelectorAll('.ambient-visual-circle');
    if (rect.top < windowH && rect.bottom > 0) {
      const factor = (windowH - rect.top) / (windowH + aboutEl.offsetHeight);
      orbs.forEach((orb, i) => {
        const dir = i % 2 === 0 ? 1 : -1;
        orb.style.transform = `translateY(${(factor - 0.5) * 60 * dir}px)`;
      });
    }
  }

  function updateContact3DTrack(contactEl, windowH, isMobile) {
    if (!contactEl) return;
    const rect = contactEl.getBoundingClientRect();
    const card = contactEl.querySelector('.cinematic-scene-card');
    if (!card) return;

    const totalTravel = contactEl.offsetHeight - windowH;
    const progress = totalTravel > 0 ? clamp(-rect.top / totalTravel, 0, 1) : clamp((windowH - rect.top) / (windowH * 1.5), 0, 1);

    // 1. Cinematic Full-Screen Background Movement (Subtle Anchored Slow Camera Zoom: 1.00 -> 1.035)
    const contactBg = document.getElementById('contactEnvBg');
    if (contactBg && rect.top <= windowH && rect.bottom >= 0) {
      const bgScale = 1.00 + progress * 0.035;
      contactBg.style.transform = `scale(${bgScale.toFixed(4)})`;
    }

    if (rect.top <= windowH * 0.75 && rect.bottom >= 0) {
      card.classList.add('active');
      const contentBox = card.querySelector('.finale-content-box');
      if (contentBox) {
        // "LET'S CONNECT" smooth horizontal reveal from right to center
        const moveFactor = isMobile ? 25 : 55;
        const transX = (1 - clamp(progress * 1.4, 0, 1)) * moveFactor;
        const transY = (progress - 0.5) * -12;
        const transZ = (1 - Math.abs(progress - 0.5)) * 18;
        contentBox.style.transform = `translate3d(${transX.toFixed(2)}px, ${transY.toFixed(2)}px, ${transZ.toFixed(2)}px)`;
      }
    } else if (rect.top > windowH * 0.75) {
      card.classList.remove('active');
    }

    const orbs = contactEl.querySelectorAll('.ambient-visual-circle');
    if (rect.top < windowH && rect.bottom > 0) {
      const factor = (windowH - rect.top) / (windowH + contactEl.offsetHeight);
      orbs.forEach((orb, i) => {
        const dir = i % 2 === 0 ? 1 : -1;
        orb.style.transform = `translateY(${(factor - 0.5) * 60 * dir}px)`;
      });
    }
  }

  function updateActiveNav(scrollY, homeDistance) {
    const sections = ['home', 'story', 'features', 'about', 'contact'];
    let currentActive = 'home';

    if (scrollY < homeDistance - 120) {
      currentActive = 'home';
    } else {
      sections.slice(1).forEach((id) => {
        const el = document.getElementById(id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= window.innerHeight * 0.45 && rect.bottom >= window.innerHeight * 0.15) {
            currentActive = id;
          }
        }
      });
    }

    navItems.forEach((link) => {
      if (link.getAttribute('data-target') === currentActive) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }

  // -------------------------------------------------------------
  // 6. CONTINUOUS RENDER LOOP (Hardware Accelerated Lerp)
  // -------------------------------------------------------------
  function renderLoop() {
    // 1. Smooth Video Scrub Lerp for Home
    if (videoDuration > 0) {
      const diff = targetTime - currentTime;
      if (Math.abs(diff) > 0.005) {
        currentTime += diff * 0.20;
        performSeek(currentTime);
      }
    }

    // 1b. Smooth Video Scrub Lerp for Story (Section 2)
    if (storyVideoDuration > 0) {
      const storyDiff = storyTargetTime - storyCurrentTime;
      if (Math.abs(storyDiff) > 0.005) {
        storyCurrentTime += storyDiff * 0.20;
        performStorySeek(storyCurrentTime);
      }
    }

    // 2. Smooth 3D Product Transform Lerp (Story, Features, About, Contact)
    const lerpFactor = 0.12;
    productCurrent.x = lerp(productCurrent.x, productTarget.x, lerpFactor);
    productCurrent.y = lerp(productCurrent.y, productTarget.y, lerpFactor);
    productCurrent.z = lerp(productCurrent.z, productTarget.z, lerpFactor);
    productCurrent.rotX = lerp(productCurrent.rotX, productTarget.rotX, lerpFactor);
    productCurrent.rotY = lerp(productCurrent.rotY, productTarget.rotY, lerpFactor);
    productCurrent.rotZ = lerp(productCurrent.rotZ, productTarget.rotZ, lerpFactor);
    productCurrent.scale = lerp(productCurrent.scale, productTarget.scale, lerpFactor);
    productCurrent.opacity = lerp(productCurrent.opacity, productTarget.opacity, lerpFactor);
    productCurrent.glowOpacity = lerp(productCurrent.glowOpacity, productTarget.glowOpacity, lerpFactor);

    if (product3dWrapper) {
      const transformString = `translate3d(${productCurrent.x.toFixed(2)}px, ${productCurrent.y.toFixed(2)}px, ${productCurrent.z.toFixed(2)}px) ` +
        `rotateX(${productCurrent.rotX.toFixed(2)}deg) rotateY(${productCurrent.rotY.toFixed(2)}deg) rotateZ(${productCurrent.rotZ.toFixed(2)}deg) ` +
        `scale(${productCurrent.scale.toFixed(3)})`;
      
      product3dWrapper.style.transform = transformString;
      product3dWrapper.style.opacity = productCurrent.opacity.toFixed(3);
    }

    if (productGlow) {
      productGlow.style.opacity = productCurrent.glowOpacity.toFixed(3);
    }

    // 3. Floating Orchard Leaves 3D Parallax Drift
    const time = performance.now() * 0.001;
    if (leaf1) {
      const l1X = productCurrent.x * -0.35 + Math.sin(time * 0.8) * 15;
      const l1Y = productCurrent.y * -0.25 + Math.cos(time * 0.6) * 12;
      const l1Rot = Math.sin(time * 0.7) * 12;
      leaf1.style.transform = `translate3d(${l1X}px, ${l1Y}px, 60px) rotate(${l1Rot}deg)`;
    }
    if (leaf2) {
      const l2X = productCurrent.x * 0.3 + Math.cos(time * 0.9) * 18;
      const l2Y = productCurrent.y * 0.35 + Math.sin(time * 0.7) * 14;
      const l2Rot = Math.cos(time * 0.8) * -15;
      leaf2.style.transform = `translate3d(${l2X}px, ${l2Y}px, -40px) rotate(${l2Rot}deg)`;
    }
    if (leaf3) {
      const l3X = productCurrent.x * -0.2 + Math.sin(time * 1.1) * 10;
      const l3Y = productCurrent.y * 0.25 + Math.cos(time * 0.9) * 10;
      leaf3.style.transform = `translate3d(${l3X}px, ${l3Y}px, -80px)`;
    }
    if (bokeh1) {
      bokeh1.style.transform = `translate3d(${productCurrent.x * 0.2}px, ${productCurrent.y * 0.2}px, 0)`;
    }
    if (bokeh2) {
      bokeh2.style.transform = `translate3d(${productCurrent.x * -0.2}px, ${productCurrent.y * -0.2}px, 0)`;
    }

    requestAnimationFrame(renderLoop);
  }

  // -------------------------------------------------------------
  // 7. SMOOTH BUTTONS & NAVIGATION INTERACTIONS
  // -------------------------------------------------------------
  function setupInteractions() {
    navItems.forEach((link) => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = link.getAttribute('data-target');
        scrollToTarget(targetId);
      });
    });

    scrollButtons.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const target = btn.getAttribute('data-scroll-to');
        scrollToTarget(target);
      });
    });
  }

  function scrollToTarget(target) {
    if (target === 'home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      const el = document.getElementById(target);
      if (el) {
        const top = el.getBoundingClientRect().top + (window.pageYOffset || document.documentElement.scrollTop);
        window.scrollTo({ top: top, behavior: 'smooth' });
      }
    }
  }

  // -------------------------------------------------------------
  // INITIALIZATION
  // -------------------------------------------------------------
  function init() {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas, { passive: true });
    window.addEventListener('scroll', onScrollChoreography, { passive: true });

    setupInteractions();

    const onMeta = () => {
      videoDuration = video.duration || 0;
      video.currentTime = 0.01;
      targetTime = 0;
      currentTime = 0;
      onScrollChoreography();
      drawFrame();
    };

    if (video) {
      if (video.readyState >= 1) {
        onMeta();
      } else {
        video.addEventListener('loadedmetadata', onMeta);
        video.addEventListener('canplay', onMeta, { once: true });
      }
      video.addEventListener('loadeddata', drawFrame);
    }

    const onStoryMeta = () => {
      storyVideoDuration = storyVideo.duration || 0;
      storyVideo.currentTime = 0.01;
      storyTargetTime = 0;
      storyCurrentTime = 0;
      onScrollChoreography();
      drawStoryFrame();
    };

    if (storyVideo) {
      if (storyVideo.readyState >= 1) {
        onStoryMeta();
      } else {
        storyVideo.addEventListener('loadedmetadata', onStoryMeta);
        storyVideo.addEventListener('canplay', onStoryMeta, { once: true });
      }
      storyVideo.addEventListener('loadeddata', drawStoryFrame);
    }

    runOravelLogoIntro();
    initNonHomeVideoBackgrounds();
    requestAnimationFrame(renderLoop);
  }

  function initNonHomeVideoBackgrounds() {
    const envLayers = document.querySelectorAll('.global-cinematic-bg, .cinematic-env-layer');
    envLayers.forEach((layer) => {
      const vPrimary = layer.querySelector('.video-primary');
      const vSecondary = layer.querySelector('.video-secondary');

      if (!vPrimary || !vSecondary) return;

      vPrimary.play().catch(() => {});

      let isSwitchingToSecondary = false;
      let isSwitchingToPrimary = false;

      const playSecondary = () => {
        if (isSwitchingToSecondary) return;
        isSwitchingToSecondary = true;
        isSwitchingToPrimary = false;

        vSecondary.currentTime = 0;
        const p = vSecondary.play();
        if (p !== undefined) {
          p.then(() => {
            vPrimary.style.opacity = '0';
            vSecondary.style.opacity = '1';
          }).catch(() => {
            vPrimary.style.opacity = '0';
            vSecondary.style.opacity = '1';
          });
        } else {
          vPrimary.style.opacity = '0';
          vSecondary.style.opacity = '1';
        }
      };

      const playPrimary = () => {
        if (isSwitchingToPrimary) return;
        isSwitchingToPrimary = true;
        isSwitchingToSecondary = false;

        vPrimary.currentTime = 0;
        const p = vPrimary.play();
        if (p !== undefined) {
          p.then(() => {
            vSecondary.style.opacity = '0';
            vPrimary.style.opacity = '1';
          }).catch(() => {
            vSecondary.style.opacity = '0';
            vPrimary.style.opacity = '1';
          });
        } else {
          vSecondary.style.opacity = '0';
          vPrimary.style.opacity = '1';
        }
      };

      vPrimary.addEventListener('ended', playSecondary);
      vSecondary.addEventListener('ended', playPrimary);

      vPrimary.addEventListener('timeupdate', () => {
        if (vPrimary.duration && vPrimary.currentTime >= vPrimary.duration - 0.25) {
          playSecondary();
        }
      });
      vSecondary.addEventListener('timeupdate', () => {
        if (vSecondary.duration && vSecondary.currentTime >= vSecondary.duration - 0.25) {
          playPrimary();
        }
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
