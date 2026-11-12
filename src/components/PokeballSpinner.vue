<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";

const props = withDefaults(defineProps<{ size?: number }>(), { size: 96 });

const canvas = ref<HTMLCanvasElement | null>(null);
const useFallback = ref(false);

let dispose: (() => void) | null = null;
let unmounted = false;

// three.js is loaded on demand so it never weighs on the initial bundle
const start = async () => {
  const el = canvas.value;
  if (!el) return;
  try {
    const THREE = await import("three");
    if (unmounted) return;

    const renderer = new THREE.WebGLRenderer({ canvas: el, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(props.size, props.size, false);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 10);
    camera.position.set(0, 0, 5);
    scene.add(new THREE.AmbientLight(0xffffff, 1.1));
    const light = new THREE.DirectionalLight(0xffffff, 2.2);
    light.position.set(2, 3, 4);
    scene.add(light);

    const ball = new THREE.Group();
    const mat = (color: number) => new THREE.MeshStandardMaterial({ color, roughness: 0.35, metalness: 0.05 });
    const half = (color: number, start: number) =>
      new THREE.Mesh(new THREE.SphereGeometry(1, 40, 20, 0, Math.PI * 2, start, Math.PI / 2), mat(color));
    ball.add(half(0xdc2626, 0), half(0xf5f5f5, Math.PI / 2));

    const band = new THREE.Mesh(
      new THREE.CylinderGeometry(1.012, 1.012, 0.14, 48, 1, true),
      new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.5, side: THREE.DoubleSide }),
    );
    ball.add(band);

    // Front button, facing the camera
    const button = new THREE.Group();
    const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.1, 32), mat(0x111111));
    const core = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.14, 32), mat(0xf5f5f5));
    button.add(ring, core);
    button.rotation.x = Math.PI / 2;
    button.position.z = 0.97;
    ball.add(button);

    ball.rotation.x = 0.35;
    scene.add(ball);

    const render = () => renderer.render(scene, camera);
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let frame = 0;
    let visible = true;
    let last = performance.now();
    const tick = (now: number) => {
      ball.rotation.y += (now - last) * 0.0016;
      last = now;
      render();
      frame = requestAnimationFrame(tick);
    };
    const loop = () => {
      cancelAnimationFrame(frame);
      if (reduceMotion || !visible || document.hidden) return;
      last = performance.now();
      frame = requestAnimationFrame(tick);
    };

    // Pause when scrolled out of view or when the tab is hidden
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      loop();
    });
    observer.observe(el);
    document.addEventListener("visibilitychange", loop);

    ball.rotation.y = -0.6;
    render();
    loop();

    dispose = () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      document.removeEventListener("visibilitychange", loop);
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          (Array.isArray(obj.material) ? obj.material : [obj.material]).forEach((m) => m.dispose());
        }
      });
      renderer.dispose();
    };
  } catch {
    // No WebGL (or the chunk failed to load): fall back to the CSS spinner
    useFallback.value = true;
  }
};

onMounted(start);
onBeforeUnmount(() => {
  unmounted = true;
  dispose?.();
});
</script>

<template>
  <div
    class="inline-flex items-center justify-center"
    :style="{ width: `${size}px`, height: `${size}px` }"
    aria-hidden="true"
    data-testid="pokeball-spinner"
  >
    <div
      v-if="useFallback"
      class="rounded-full border-b-2 border-white motion-safe:animate-spin"
      :style="{ width: `${size / 2}px`, height: `${size / 2}px` }"
    ></div>
    <canvas v-else ref="canvas" :style="{ width: `${size}px`, height: `${size}px` }"></canvas>
  </div>
</template>
