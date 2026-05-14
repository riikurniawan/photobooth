import { For, Show, createSignal, onCleanup } from 'solid-js';
import type { Component } from 'solid-js';

type CameraState = 'idle' | 'requesting' | 'active' | 'error';
type LayoutTemplate = {
  id: string;
  name: string;
  slots: number;
  badge: string;
};
type LayoutRenderStyle = {
  background: string;
  title: string;
  titleColor: string;
  titleSize: number;
  footerText: string;
  footerColor: string;
  slotHeight: number;
  slotGap: number;
  slotBackground: string;
  slotBorder: string;
};

const layoutTemplates: LayoutTemplate[] = [
  { id: 'classic-4', name: 'Classic 4', slots: 4, badge: 'New Layout' },
  { id: 'solace-3', name: 'Solace 3', slots: 3, badge: 'Soft Frame' },
  { id: 'mono-2', name: 'Mono 2', slots: 2, badge: 'Try It Now' },
];
const layoutRenderStyles: Record<string, LayoutRenderStyle> = {
  'classic-4': {
    background: '#f8f6ef',
    title: 'photobooth',
    titleColor: '#111111',
    titleSize: 40,
    footerText: 'photobooth',
    footerColor: '#111111',
    slotHeight: 220,
    slotGap: 14,
    slotBackground: '#ffffff',
    slotBorder: '#111111',
  },
  'solace-3': {
    background: '#8f0000',
    title: 'solace',
    titleColor: '#ffffff',
    titleSize: 44,
    footerText: 'by photobooth',
    footerColor: '#ffffff',
    slotHeight: 260,
    slotGap: 12,
    slotBackground: '#ffffff',
    slotBorder: '#5b0000',
  },
  'mono-2': {
    background: '#f2f2f2',
    title: 'photobooth',
    titleColor: '#111111',
    titleSize: 32,
    footerText: 'photobooth',
    footerColor: '#111111',
    slotHeight: 340,
    slotGap: 14,
    slotBackground: '#ffffff',
    slotBorder: '#111111',
  },
};

const loadImageFromDataUrl = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Failed to load captured image.'));
    image.src = src;
  });
const blobToDataUrl = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
        return;
      }
      reject(new Error('Failed to convert image blob to data URL.'));
    };
    reader.onerror = () => reject(new Error('Failed reading image blob.'));
    reader.readAsDataURL(blob);
  });
const isValidShotData = (value: string | null): value is string =>
  typeof value === 'string' && value.startsWith('data:image/') && value.length > 100;

const Home: Component = () => {
  const [cameraState, setCameraState] = createSignal<CameraState>('idle');
  const [cameraMessage, setCameraMessage] = createSignal('Click Start Camera to open your live preview.');
  const [cameraStream, setCameraStream] = createSignal<MediaStream | null>(null);
  const [isInverted, setIsInverted] = createSignal(false);
  const [selectedLayoutId, setSelectedLayoutId] = createSignal(layoutTemplates[0].id);
  const [capturedShots, setCapturedShots] = createSignal<string[]>([]);
  const [isCapturing, setIsCapturing] = createSignal(false);
  const [isVideoReady, setIsVideoReady] = createSignal(false);
  let videoRef: HTMLVideoElement | undefined;

  const selectedLayout = () => layoutTemplates.find((layout) => layout.id === selectedLayoutId()) ?? layoutTemplates[0];
  const requiredShots = () => selectedLayout().slots;
  const validShots = () => capturedShots().filter((shot) => isValidShotData(shot));
  const capturedCount = () => validShots().length;
  const remainingShots = () => Math.max(requiredShots() - capturedCount(), 0);

  const stopCamera = () => {
    const currentStream = cameraStream();
    if (currentStream) {
      currentStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }

    if (videoRef) {
      videoRef.srcObject = null;
    }

    setCameraState('idle');
    setCameraMessage('Camera stopped. Click Start Camera when you are ready again.');
    setIsInverted(false);
    setIsVideoReady(false);
  };

  const selectLayout = (layoutId: string) => {
    setSelectedLayoutId(layoutId);
    setCapturedShots([]);
    const layoutName = layoutTemplates.find((layout) => layout.id === layoutId)?.name ?? 'layout';
    setCameraMessage(`Selected ${layoutName}. Start camera and capture ${requiredShots()} shots.`);
  };

  const startCamera = async () => {
    if (cameraState() === 'requesting' || cameraState() === 'active') {
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraState('error');
      setCameraMessage('This browser does not support camera access.');
      return;
    }

    setCameraState('requesting');
    setCameraMessage('Requesting camera access...');
    setIsVideoReady(false);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: false,
      });

      setCameraStream(stream);

      if (videoRef) {
        videoRef.srcObject = stream;
        await videoRef.play();
        setIsVideoReady(true);
      }

      setCameraState('active');
      setCameraMessage('Camera is live. Choose your layout and start snapping photos.');
    } catch (error) {
      if (error instanceof DOMException && error.name === 'NotAllowedError') {
        setCameraMessage('Camera permission denied. Please allow access and try again.');
      } else if (error instanceof DOMException && error.name === 'NotFoundError') {
        setCameraMessage('No camera device detected. Connect a camera and try again.');
      } else {
        setCameraMessage('Could not access your camera. Please allow permission and try again.');
      }
      setCameraState('error');
    }
  };

  const capturePhoto = async () => {
    if (cameraState() !== 'active' || !videoRef) {
      setCameraMessage('Start camera first before capturing photos.');
      return;
    }
    if (isCapturing()) {
      return;
    }

    if (remainingShots() === 0) {
      setCameraMessage('Layout is full. Clear shots or select another layout.');
      return;
    }

    const width = videoRef.videoWidth;
    const height = videoRef.videoHeight;
    if (width <= 0 || height <= 0) {
      setCameraMessage('Camera preview is not ready yet. Please wait a moment.');
      return;
    }

    setIsCapturing(true);
    try {
      const stream = cameraStream();
      const track = stream?.getVideoTracks()[0];
      let shotData: string | null = null;

      if (track && typeof ImageCapture !== 'undefined') {
        const imageCapture = new ImageCapture(track);
        if (typeof imageCapture.takePhoto === 'function') {
          try {
            const photoBlob = await imageCapture.takePhoto();
            if (!isInverted()) {
              shotData = await blobToDataUrl(photoBlob);
            } else {
              const source = await loadImageFromDataUrl(await blobToDataUrl(photoBlob));
              const canvas = document.createElement('canvas');
              canvas.width = source.width;
              canvas.height = source.height;
              const context = canvas.getContext('2d');
              if (!context) {
                setCameraMessage('Unable to process photo capture. Try again.');
                return;
              }
              context.translate(source.width, 0);
              context.scale(-1, 1);
              context.drawImage(source, 0, 0, source.width, source.height);
              shotData = canvas.toDataURL('image/jpeg', 0.95);
            }
          } catch (error) {
            if (error instanceof Error) {
              console.error(error.message);
            }
          }
        }
      }

      if (!shotData) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext('2d');
        if (!context) {
          setCameraMessage('Unable to process photo capture. Try again.');
          return;
        }
        if (isInverted()) {
          context.translate(width, 0);
          context.scale(-1, 1);
        }
        context.drawImage(videoRef, 0, 0, width, height);
        shotData = canvas.toDataURL('image/jpeg', 0.95);
      }

      if (!isValidShotData(shotData)) {
        setCameraMessage('Capture failed. Please keep still and try again.');
        return;
      }

      setCapturedShots((previous) => {
        const next = [...previous, shotData];
        const left = Math.max(requiredShots() - next.length, 0);
        if (left === 0) {
          setCameraMessage(`${selectedLayout().name} is complete. You can retake or change layout.`);
        } else {
          setCameraMessage(`Photo saved. Capture ${left} more shot${left > 1 ? 's' : ''}.`);
        }
        return next;
      });
    } catch {
      setCameraMessage('Capture failed. Please wait for preview and try again.');
    } finally {
      setIsCapturing(false);
    }
  };

  const resetCapturedShots = () => {
    setCapturedShots([]);
    setCameraMessage(`Cleared shots. Capture ${requiredShots()} new photos for ${selectedLayout().name}.`);
  };

  const saveSelectedStrip = async () => {
    const shotsForSave = validShots();
    if (shotsForSave.length === 0) {
      setCameraMessage('Capture at least one photo before saving.');
      return;
    }

    const layout = selectedLayout();
    const style = layoutRenderStyles[layout.id] ?? layoutRenderStyles['classic-4'];
    const slotWidth = 540;
    const slotHeight = style.slotHeight;
    const gap = style.slotGap;
    const padding = 20;
    const titleBand = 46;
    const footerBand = 30;

    const canvas = document.createElement('canvas');
    canvas.width = slotWidth + padding * 2;
    canvas.height = padding + titleBand + layout.slots * slotHeight + (layout.slots - 1) * gap + footerBand + padding;
    const context = canvas.getContext('2d');

    if (!context) {
      setCameraMessage('Could not generate strip image.');
      return;
    }

    context.fillStyle = style.background;
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = '#111111';
    context.lineWidth = 6;
    context.strokeRect(3, 3, canvas.width - 6, canvas.height - 6);

    context.fillStyle = style.titleColor;
    context.font = `bold ${style.titleSize}px Inter, system-ui, sans-serif`;
    context.textAlign = 'center';
    context.fillText(style.title, canvas.width / 2, padding + 30);

    try {
      const shots = shotsForSave.slice(0, layout.slots);
      for (let index = 0; index < layout.slots; index += 1) {
        const slotX = padding;
        const slotY = padding + titleBand + index * (slotHeight + gap);

        context.fillStyle = style.slotBackground;
        context.fillRect(slotX, slotY, slotWidth, slotHeight);
        context.strokeStyle = style.slotBorder;
        context.lineWidth = 3;
        context.strokeRect(slotX, slotY, slotWidth, slotHeight);

        const shot = shots[index];
        if (!shot) {
          context.fillStyle = '#4a4a4a';
          context.font = 'bold 18px Inter, system-ui, sans-serif';
          context.fillText(`Shot ${index + 1}`, slotX + slotWidth / 2, slotY + slotHeight / 2 + 6);
          continue;
        }

        const image = await loadImageFromDataUrl(shot);
        const scale = Math.max(slotWidth / image.width, slotHeight / image.height);
        const drawWidth = image.width * scale;
        const drawHeight = image.height * scale;
        const drawX = slotX + (slotWidth - drawWidth) / 2;
        const drawY = slotY + (slotHeight - drawHeight) / 2;
        context.drawImage(image, drawX, drawY, drawWidth, drawHeight);
      }

      context.fillStyle = style.footerColor;
      context.font = 'bold 14px Inter, system-ui, sans-serif';
      context.fillText(style.footerText, canvas.width / 2, canvas.height - padding);

      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = `photobooth-${layout.id}-${Date.now()}.png`;
      link.click();
      setCameraMessage('Strip saved to your device.');
    } catch {
      setCameraMessage('Failed to save strip. Please try again.');
    }
  };

  onCleanup(() => {
    const currentStream = cameraStream();
    if (currentStream) {
      currentStream.getTracks().forEach((track) => track.stop());
    }
  });

  return (
    <section class="home-showcase">
      <div class="home-hero">
        <div class="photo-strip photo-strip-left" aria-hidden="true">
          <div class="photo-cell shot-a"></div>
          <div class="photo-cell shot-b"></div>
          <div class="photo-cell shot-c"></div>
        </div>

        <div class="hero-center">
          <p class="hero-kicker">Capture the moment, cherish the magic.</p>
          <h1 class="hero-title">photobooth</h1>
          <p class="hero-copy">
            Start your camera in one click, pick your favorite layout, then save your strip instantly.
          </p>

          <div class="hero-actions">
            <button
              type="button"
              class="cta-primary"
              onClick={startCamera}
              disabled={cameraState() === 'requesting' || cameraState() === 'active'}
            >
              {cameraState() === 'requesting'
                ? 'Starting...'
                : cameraState() === 'active'
                  ? 'Camera Active'
                  : 'Start Camera'}
            </button>
            <Show when={cameraState() === 'active'}>
              <button
                type="button"
                class="cta-capture"
                onClick={() => {
                  void capturePhoto();
                }}
                disabled={remainingShots() === 0 || isCapturing() || !isVideoReady()}
              >
                {isCapturing()
                  ? 'Capturing...'
                  : !isVideoReady()
                    ? 'Preview Loading...'
                    : remainingShots() === 0
                      ? 'Layout Full'
                      : 'Capture Photo'}
              </button>
            </Show>
            <Show when={cameraState() === 'active'}>
              <button type="button" class="cta-secondary" onClick={() => setIsInverted(!isInverted())}>
                {isInverted() ? 'Normal View' : 'Invert Camera'}
              </button>
            </Show>
            <Show when={cameraState() === 'active'}>
              <button type="button" class="cta-stop" onClick={stopCamera}>
                Stop Camera
              </button>
            </Show>
            <Show when={capturedCount() > 0}>
              <button type="button" class="cta-reset" onClick={resetCapturedShots}>
                Clear Shots
              </button>
            </Show>
          </div>
          <p class="camera-status">{cameraMessage()}</p>
          <div class="camera-preview-wrap">
            <video
              ref={(el) => {
                videoRef = el;
              }}
              class={`camera-preview ${cameraState() === 'active' ? 'is-visible' : 'is-hidden'} ${isInverted() ? 'is-inverted' : ''}`}
              autoplay
              playsinline
              muted
              onLoadedData={() => setIsVideoReady(true)}
            />
            <Show when={cameraState() !== 'active'}>
              <div class="camera-placeholder">Live camera preview will appear here.</div>
            </Show>
          </div>
        </div>

        <div class="photo-strip photo-strip-right" aria-hidden="true">
          <div class="photo-cell shot-d"></div>
          <div class="photo-cell shot-e"></div>
          <div class="photo-cell shot-f"></div>
        </div>
      </div>

      <div class="layout-workspace">
        <div class="layout-options">
          <p class="layout-heading">Choose Layout</p>
          <div class="layout-option-grid">
            <For each={layoutTemplates}>
              {(layout) => (
                <button
                  type="button"
                  class={`layout-option ${selectedLayoutId() === layout.id ? 'is-selected' : ''}`}
                  onClick={() => selectLayout(layout.id)}
                >
                  <span class="layout-badge">{layout.badge}</span>
                  <span class="layout-name">{layout.name}</span>
                  <span class="layout-slots">{layout.slots} shots</span>
                </button>
              )}
            </For>
          </div>
        </div>

        <div class="layout-preview-panel">
          <p class="layout-heading">
            Selected Strip: {selectedLayout().name} ({capturedCount()}/{requiredShots()})
          </p>
          <div class={`strip-preview layout-${selectedLayoutId()} slots-${requiredShots()}`}>
            <For each={Array.from({ length: requiredShots() })}>
              {(_, index) => (
                <div class="strip-slot">
                  <Show
                    when={validShots()[index()]}
                    fallback={<span class="strip-placeholder">Shot {index() + 1}</span>}
                  >
                    {(image) => <img src={image()} alt={`Captured shot ${index() + 1}`} class="strip-image" />}
                  </Show>
                </div>
              )}
            </For>
          </div>
          <div class="layout-actions">
            <button type="button" class="cta-save" onClick={saveSelectedStrip} disabled={capturedCount() === 0}>
              Save Strip
            </button>
          </div>
        </div>
      </div>

      <div class="guide-grid">
        <article class="guide-card">
          <p class="guide-step">Step 1</p>
          <h3>Enable Camera</h3>
          <p>Click Start Camera and allow browser camera permission to preview yourself.</p>
        </article>
        <article class="guide-card">
          <p class="guide-step">Step 2</p>
          <h3>Choose Layout</h3>
          <p>Select your strip style, frame color, and number of shots before countdown starts.</p>
        </article>
        <article class="guide-card">
          <p class="guide-step">Step 3</p>
          <h3>Snap & Download</h3>
          <p>Take photos, review your strip, and download or print it instantly for sharing.</p>
        </article>
      </div>
    </section>
  );
};

export default Home;
