import * as THREE from "https://esm.sh/three@0.165.0";
import { OrbitControls } from "https://esm.sh/three@0.165.0/examples/jsm/controls/OrbitControls.js";

/**
 * =========================================
 *  3D 动态沉浸式塔罗牌占卜 - 主逻辑文件
 *  技术：Three.js + OrbitControls + GSAP + Fetch API
 * =========================================
 */

const APP_STATE = {
  phase: "question", // question -> draw -> reveal -> reading
  userQuestion: "",
  hoveredCard: null,
  selectedCards: [], // [{mesh, cardData, role, isReversed}]
  lockInteraction: false,
  dragging: false
};

const ROLES = ["过去", "现在", "未来"];

// 78 张标准塔罗牌（含大阿卡那 + 小阿卡那）
const TAROT_CARD_NAMES = [
  "愚者", "魔术师", "女祭司", "皇后", "皇帝", "教皇", "恋人", "战车", "力量", "隐士", "命运之轮", "正义", "倒吊人", "死神", "节制", "恶魔", "高塔", "星星", "月亮", "太阳", "审判", "世界",
  "权杖王牌", "权杖二", "权杖三", "权杖四", "权杖五", "权杖六", "权杖七", "权杖八", "权杖九", "权杖十", "权杖侍从", "权杖骑士", "权杖王后", "权杖国王",
  "圣杯王牌", "圣杯二", "圣杯三", "圣杯四", "圣杯五", "圣杯六", "圣杯七", "圣杯八", "圣杯九", "圣杯十", "圣杯侍从", "圣杯骑士", "圣杯王后", "圣杯国王",
  "宝剑王牌", "宝剑二", "宝剑三", "宝剑四", "宝剑五", "宝剑六", "宝剑七", "宝剑八", "宝剑九", "宝剑十", "宝剑侍从", "宝剑骑士", "宝剑王后", "宝剑国王",
  "星币王牌", "星币二", "星币三", "星币四", "星币五", "星币六", "星币七", "星币八", "星币九", "星币十", "星币侍从", "星币骑士", "星币王后", "星币国王"
];

// 78 张牌的真实公有域图源，来自 Wikimedia Commons 的 Rider-Waite-Smith 图像集。
const TAROT_IMAGE_FILES = [
  "The_Fool_(Rider-Waite_Smith_tarot_deck).png",
  "The_Magician_(Rider-Waite_Smith_tarot_deck).png",
  "The_High_Priestess_(Rider-Waite_Smith_tarot_deck).png",
  "The_Empress_(Rider-Waite_Smith_tarot_deck).png",
  "The_Emperor_(Rider-Waite_Smith_tarot_deck).png",
  "The_Hierophant_(Rider-Waite_Smith_tarot_deck).png",
  "The_Lovers_(Rider-Waite_Smith_tarot_deck).png",
  "The_Chariot_(Rider-Waite_Smith_tarot_deck).png",
  "Strength_(Rider-Waite_Smith_tarot_deck).png",
  "The_Hermit_(Rider-Waite_Smith_tarot_deck).png",
  "Wheel_of_Fortune_(Rider-Waite_Smith_tarot_deck).png",
  "Justice_(Rider-Waite_Smith_tarot_deck).png",
  "The_Hanged_Man_(Rider-Waite_Smith_tarot_deck).png",
  "Death_(Rider-Waite_Smith_tarot_deck).png",
  "Temperance_(Rider-Waite_Smith_tarot_deck).png",
  "The_Devil_(Rider-Waite_Smith_tarot_deck).png",
  "The_Tower_(Rider-Waite_Smith_tarot_deck).png",
  "The_Star_(Rider-Waite_Smith_tarot_deck).png",
  "The_Moon_(Rider-Waite_Smith_tarot_deck).png",
  "The_Sun_(Rider-Waite_Smith_tarot_deck).png",
  "Judgement_(Rider-Waite_Smith_tarot_deck).png",
  "The_World_(Rider-Waite_Smith_tarot_deck).png",
  "Ace_of_Wands_(Rider-Waite_Smith_tarot_deck).png",
  "Two_of_Wands_(Rider-Waite_Smith_tarot_deck).png",
  "Three_of_Wands_(Rider-Waite_Smith_tarot_deck).png",
  "Four_of_Wands_(Rider-Waite_Smith_tarot_deck).png",
  "Five_of_Wands_(Rider-Waite_Smith_tarot_deck).png",
  "Six_of_Wands_(Rider-Waite_Smith_tarot_deck).png",
  "Seven_of_Wands_(Rider-Waite_Smith_tarot_deck).png",
  "Eight_of_Wands_(Rider-Waite_Smith_tarot_deck).png",
  "Nine_of_Wands_(Rider-Waite_Smith_tarot_deck).png",
  "Ten_of_Wands_(Rider-Waite_Smith_tarot_deck).png",
  "Page_of_Wands_(Rider-Waite_Smith_tarot_deck).png",
  "Knight_of_Wands_(Rider-Waite_Smith_tarot_deck).png",
  "Queen_of_Wands_(Rider-Waite_Smith_tarot_deck).png",
  "King_of_Wands_(Rider-Waite_Smith_tarot_deck).png",
  "Ace_of_Cups_(Rider-Waite_Smith_tarot_deck).png",
  "Two_of_Cups_(Rider-Waite_Smith_tarot_deck).png",
  "Three_of_Cups_(Rider-Waite_Smith_tarot_deck).png",
  "Four_of_Cups_(Rider-Waite_Smith_tarot_deck).png",
  "Five_of_Cups_(Rider-Waite_Smith_tarot_deck).png",
  "Six_of_Cups_(Rider-Waite_Smith_tarot_deck).png",
  "Seven_of_Cups_(Rider-Waite_Smith_tarot_deck).png",
  "Eight_of_Cups_(Rider-Waite_Smith_tarot_deck).png",
  "Nine_of_Cups_(Rider-Waite_Smith_tarot_deck).png",
  "Ten_of_Cups_(Rider-Waite_Smith_tarot_deck).png",
  "Page_of_Cups_(Rider-Waite_Smith_tarot_deck).png",
  "Knight_of_Cups_(Rider-Waite_Smith_tarot_deck).png",
  "Queen_of_Cups_(Rider-Waite_Smith_tarot_deck).png",
  "King_of_Cups_(Rider-Waite_Smith_tarot_deck).png",
  "Ace_of_Swords_(Rider-Waite_Smith_tarot_deck).png",
  "Two_of_Swords_(Rider-Waite_Smith_tarot_deck).png",
  "Three_of_Swords_(Rider-Waite_Smith_tarot_deck).png",
  "Four_of_Swords_(Rider-Waite_Smith_tarot_deck).png",
  "Five_of_Swords_(Rider-Waite_Smith_tarot_deck).png",
  "Six_of_Swords_(Rider-Waite_Smith_tarot_deck).png",
  "Seven_of_Swords_(Rider-Waite_Smith_tarot_deck).png",
  "Eight_of_Swords_(Rider-Waite_Smith_tarot_deck).png",
  "Nine_of_Swords_(Rider-Waite_Smith_tarot_deck).png",
  "Ten_of_Swords_(Rider-Waite_Smith_tarot_deck).png",
  "Page_of_Swords_(Rider-Waite_Smith_tarot_deck).png",
  "Knight_of_Swords_(Rider-Waite_Smith_tarot_deck).png",
  "Queen_of_Swords_(Rider-Waite_Smith_tarot_deck).png",
  "King_of_Swords_(Rider-Waite_Smith_tarot_deck).png",
  "Ace_of_Pentacles_(Rider-Waite_Smith_tarot_deck).png",
  "Two_of_Pentacles_(Rider-Waite_Smith_tarot_deck).png",
  "Three_of_Pentacles_(Rider-Waite_Smith_tarot_deck).png",
  "Four_of_Pentacles_(Rider-Waite_Smith_tarot_deck).png",
  "Five_of_Pentacles_(Rider-Waite_Smith_tarot_deck).png",
  "Six_of_Pentacles_(Rider-Waite_Smith_tarot_deck).png",
  "Seven_of_Pentacles_(Rider-Waite_Smith_tarot_deck).png",
  "Eight_of_Pentacles_(Rider-Waite_Smith_tarot_deck).png",
  "Nine_of_Pentacles_(Rider-Waite_Smith_tarot_deck).png",
  "Ten_of_Pentacles_(Rider-Waite_Smith_tarot_deck).png",
  "Page_of_Pentacles_(Rider-Waite_Smith_tarot_deck).png",
  "Knight_of_Pentacles_(Rider-Waite_Smith_tarot_deck).png",
  "Queen_of_Pentacles_(Rider-Waite_Smith_tarot_deck).png",
  "King_of_Pentacles_(Rider-Waite_Smith_tarot_deck).png"
];

function buildCommonsFileUrl(fileName) {
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(fileName)}`;
}

const backImageUrl = buildCommonsFileUrl("Jean Dodal Tarot reverse.jpg");

// 将 78 张牌映射为真实图源 URL。
const TAROT_DECK = TAROT_CARD_NAMES.map((name, index) => ({
  id: index,
  name,
  imageUrl: buildCommonsFileUrl(TAROT_IMAGE_FILES[index]),
  backImageUrl
}));

const sceneContainer = document.getElementById("scene-container");
const questionPanel = document.getElementById("question-panel");
const drawPanel = document.getElementById("draw-panel");
const readingPanel = document.getElementById("reading-panel");
const questionInput = document.getElementById("question-input");
const startBtn = document.getElementById("start-btn");
const drawTip = document.getElementById("draw-tip");
const slotPast = document.getElementById("slot-past");
const slotPresent = document.getElementById("slot-present");
const slotFuture = document.getElementById("slot-future");
const readingMedia = document.getElementById("reading-media");
const readingContent = document.getElementById("reading-content");
const historyBtn = document.getElementById("history-btn");
const resetBtn = document.getElementById("reset-btn");
const historyPanel = document.getElementById("history-panel");
const historyCloseBtn = document.getElementById("history-close-btn");
const historyList = document.getElementById("history-list");
const historyDetail = document.getElementById("history-detail");
const loadingMask = document.getElementById("loading-mask");
const loadingText = document.getElementById("loading-text");

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x080b1d, 0.018);

const camera = new THREE.PerspectiveCamera(56, window.innerWidth / window.innerHeight, 0.1, 300);
camera.position.set(0, 3, 26);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
sceneContainer.appendChild(renderer.domElement);

// OrbitControls 负责全景拖拽浏览，让用户能查看牌阵的背面与侧面。
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enablePan = false;
controls.minDistance = 14;
controls.maxDistance = 40;
controls.rotateSpeed = 0.85;
controls.target.set(0, 0, 0);

const ambientLight = new THREE.AmbientLight(0x9aa2ff, 0.3);
scene.add(ambientLight);

const hemiLight = new THREE.HemisphereLight(0x66d0ff, 0x160d2d, 0.45);
scene.add(hemiLight);

const keyLight = new THREE.PointLight(0xffddaa, 1.8, 120, 2);
keyLight.position.set(0, 8, 10);
scene.add(keyLight);

const cyanLight = new THREE.PointLight(0x66d0ff, 1.4, 130, 2);
cyanLight.position.set(-16, 4, 6);
scene.add(cyanLight);

const roseLight = new THREE.PointLight(0xf59ec8, 1.3, 130, 2);
roseLight.position.set(16, 3, -8);
scene.add(roseLight);

const textureLoader = new THREE.TextureLoader();
const cardMaterialCache = new Map();
const cardFaceTextureCache = new Map();
const cardFaceTexturePromiseCache = new Map();
let sharedBackTexturePromise = null;
const cardMeshes = [];
const slotAnchors = [];
const pointer = { x: 0, y: 0 };
const mouseNDC = new THREE.Vector2(999, 999);
const raycaster = new THREE.Raycaster();
const clock = new THREE.Clock();
const HISTORY_STORAGE_KEY = "tarot3d_session_history";

const crystalBall = createCrystalBall();
const nebulaShell = createNebulaShell();
const starsLayerA = createStarLayer(3200, 135, 0xb6ceff, 0.12);
const starsLayerB = createStarLayer(1800, 90, 0xf8b8de, 0.09);
const magicCircle = createMagicCircle();
createConstellationWeb();
createSlotAnchors();
let sessionHistory = loadSessionHistory();
let selectedHistoryIndex = -1;

function createNebulaTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext("2d");

  const bg = ctx.createRadialGradient(512, 512, 120, 512, 512, 560);
  bg.addColorStop(0, "#2e2b65");
  bg.addColorStop(0.45, "#172645");
  bg.addColorStop(1, "#040611");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 1024, 1024);

  for (let i = 0; i < 70; i += 1) {
    const x = Math.random() * 1024;
    const y = Math.random() * 1024;
    const r = 90 + Math.random() * 260;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    const c1 = i % 2 === 0 ? "rgba(102,208,255,0.18)" : "rgba(245,158,200,0.16)";
    g.addColorStop(0, c1);
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  return new THREE.CanvasTexture(canvas);
}

function createNebulaShell() {
  const tex = createNebulaTexture();
  tex.colorSpace = THREE.SRGBColorSpace;
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(140, 64, 64),
    new THREE.MeshBasicMaterial({ map: tex, side: THREE.BackSide, transparent: true, opacity: 0.95 })
  );
  scene.add(mesh);
  return mesh;
}

function createCrystalBall() {
  const group = new THREE.Group();

  const outer = new THREE.Mesh(
    new THREE.SphereGeometry(8.2, 64, 64),
    new THREE.MeshPhysicalMaterial({
      color: 0xa6c9ff,
      transmission: 0.95,
      transparent: true,
      opacity: 0.22,
      roughness: 0.1,
      metalness: 0.05,
      ior: 1.28,
      thickness: 1.3,
      emissive: 0x1a2b58,
      emissiveIntensity: 0.25
    })
  );

  const innerGlow = new THREE.Mesh(
    new THREE.SphereGeometry(7.2, 48, 48),
    new THREE.MeshBasicMaterial({ color: 0x66d0ff, transparent: true, opacity: 0.07, blending: THREE.AdditiveBlending })
  );

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(8.55, 0.08, 24, 220),
    new THREE.MeshStandardMaterial({ color: 0xd7b56d, emissive: 0xd7b56d, emissiveIntensity: 0.55, roughness: 0.2, metalness: 0.8 })
  );
  ring.rotation.x = Math.PI / 2;

  group.add(outer);
  group.add(innerGlow);
  group.add(ring);
  group.position.set(0, 0.4, -1.5);
  scene.add(group);
  return group;
}

function createStarLayer(count, spread, color, size) {
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i += 1) {
    positions[i * 3] = (Math.random() - 0.5) * spread;
    positions[i * 3 + 1] = (Math.random() - 0.5) * spread * 0.7;
    positions[i * 3 + 2] = (Math.random() - 0.5) * spread;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const mat = new THREE.PointsMaterial({
    color,
    size,
    transparent: true,
    opacity: 0.92,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const points = new THREE.Points(geo, mat);
  scene.add(points);
  return points;
}

function createConstellationWeb() {
  const stars = [];
  for (let i = 0; i < 22; i += 1) {
    stars.push(new THREE.Vector3((Math.random() - 0.5) * 46, (Math.random() - 0.5) * 28 + 9, (Math.random() - 0.5) * 34 - 20));
  }

  const lineMat = new THREE.LineBasicMaterial({ color: 0x7bc9ff, transparent: true, opacity: 0.32 });
  for (let i = 1; i < stars.length; i += 1) {
    const geo = new THREE.BufferGeometry().setFromPoints([stars[i - 1], stars[i]]);
    scene.add(new THREE.Line(geo, lineMat));
  }
}

function createMagicCircle() {
  const group = new THREE.Group();
  const outer = new THREE.Mesh(
    new THREE.RingGeometry(5.8, 7.2, 140),
    new THREE.MeshStandardMaterial({
      color: 0x2f4f8f,
      emissive: 0x66d0ff,
      emissiveIntensity: 0.4,
      transparent: true,
      opacity: 0.45,
      roughness: 0.25,
      metalness: 0.55,
      side: THREE.DoubleSide
    })
  );
  outer.rotation.x = -Math.PI / 2;
  group.add(outer);

  const rune = new THREE.Mesh(
    new THREE.TorusGeometry(6.45, 0.045, 16, 220),
    new THREE.MeshStandardMaterial({ color: 0xf0cc8b, emissive: 0xf0cc8b, emissiveIntensity: 0.45, roughness: 0.2, metalness: 0.75 })
  );
  rune.rotation.x = -Math.PI / 2;
  group.add(rune);

  group.position.set(0, -4.8, 0);
  scene.add(group);
  return group;
}

function createSlotAnchors() {
  const slotXs = [7.2, 9.55, 7.2];
  const slotYs = [4.2, 0.7, -2.8];
  for (let i = 0; i < 3; i += 1) {
    const anchor = new THREE.Object3D();
    anchor.position.set(slotXs[i], slotYs[i], 6.4);
    scene.add(anchor);
    slotAnchors.push(anchor);
  }
}

function createCardBackTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 896;
  const ctx = canvas.getContext("2d");

  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, "#1d2d57");
  gradient.addColorStop(1, "#0b1025");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = "#d7b56d";
  ctx.lineWidth = 9;
  ctx.strokeRect(24, 24, canvas.width - 48, canvas.height - 48);

  ctx.strokeStyle = "rgba(102, 208, 255, 0.82)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(canvas.width / 2, canvas.height / 2, 170, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = "#f4dca8";
  ctx.font = "bold 58px Cinzel";
  ctx.textAlign = "center";
  ctx.fillText("TAROT", canvas.width / 2, canvas.height / 2 + 18);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

async function loadSharedBackTexture() {
  if (!sharedBackTexturePromise) {
    sharedBackTexturePromise = textureLoader.loadAsync(backImageUrl)
      .then((texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.wrapS = THREE.ClampToEdgeWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        return texture;
      })
      .catch((error) => {
        console.warn("统一背面图加载失败，改用程序化背面。", error);
        return createCardBackTexture();
      });
  }

  return sharedBackTexturePromise;
}

function createFallbackFrontTexture(cardName) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 896;
  const ctx = canvas.getContext("2d");

  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, "#f8f3e8");
  gradient.addColorStop(1, "#d9d2bc");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#2e315a";
  ctx.fillRect(28, 28, canvas.width - 56, canvas.height - 56);

  ctx.fillStyle = "#f4dca8";
  ctx.font = "bold 44px ZCOOL XiaoWei";
  ctx.textAlign = "center";
  ctx.fillText("韦特塔罗", canvas.width / 2, 130);

  ctx.strokeStyle = "#66d0ff";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(canvas.width / 2, 180);
  ctx.lineTo(canvas.width / 2, 640);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(canvas.width / 2, 410, 120, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = "#ffffff";
  ctx.font = "34px ZCOOL XiaoWei";
  wrapText(ctx, cardName, canvas.width / 2, 740, 410, 44);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createPlaceholderFaceTexture(cardName) {
  return createFallbackFrontTexture(cardName);
}

function wrapText(ctx, text, centerX, startY, maxWidth, lineHeight) {
  const chars = text.split("");
  let line = "";
  let y = startY;
  for (const ch of chars) {
    const testLine = line + ch;
    if (ctx.measureText(testLine).width > maxWidth && line.length > 0) {
      ctx.fillText(line, centerX, y);
      line = ch;
      y += lineHeight;
    } else {
      line = testLine;
    }
  }
  if (line) {
    ctx.fillText(line, centerX, y);
  }
}

async function ensureCardFaceTexture(cardData) {
  if (cardFaceTextureCache.has(cardData.id)) {
    return cardFaceTextureCache.get(cardData.id);
  }

  if (cardFaceTexturePromiseCache.has(cardData.id)) {
    return cardFaceTexturePromiseCache.get(cardData.id);
  }

  const promise = textureLoader.loadAsync(cardData.imageUrl)
    .then((texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.wrapS = THREE.ClampToEdgeWrapping;
      texture.wrapT = THREE.ClampToEdgeWrapping;
      cardFaceTextureCache.set(cardData.id, texture);

      const materials = cardMaterialCache.get(cardData.id);
      if (materials && materials[4]) {
        materials[4].map = texture;
        materials[4].needsUpdate = true;
      }

      return texture;
    })
    .catch((error) => {
      console.warn(`卡牌正面加载失败，使用本地占位纹理: ${cardData.name}`, error);
      const fallback = createFallbackFrontTexture(cardData.name);
      cardFaceTextureCache.set(cardData.id, fallback);

      const materials = cardMaterialCache.get(cardData.id);
      if (materials && materials[4]) {
        materials[4].map = fallback;
        materials[4].needsUpdate = true;
      }

      return fallback;
    });

  cardFaceTexturePromiseCache.set(cardData.id, promise);
  return promise;
}

async function getCardMaterials(cardData, sharedBackTexture) {
  if (cardMaterialCache.has(cardData.id)) {
    return cardMaterialCache.get(cardData.id);
  }

  const backTexture = sharedBackTexture || createCardBackTexture();
  const frontTexture = cardFaceTextureCache.get(cardData.id) || createPlaceholderFaceTexture(cardData.name);

  // BoxGeometry 六个面材质顺序：+x, -x, +y, -y, +z(front), -z(back)
  const edgeMat = new THREE.MeshStandardMaterial({ color: 0x181c34, roughness: 0.7, metalness: 0.25 });
  const frontMat = new THREE.MeshStandardMaterial({ map: frontTexture, roughness: 0.92, metalness: 0.05 });
  const backMat = new THREE.MeshStandardMaterial({
    map: backTexture,
    roughness: 0.8,
    metalness: 0.12,
    emissive: 0x1a2b58,
    emissiveIntensity: 0.24
  });

  const mats = [edgeMat, edgeMat, edgeMat, edgeMat, frontMat, backMat];
  cardMaterialCache.set(cardData.id, mats);
  return mats;
}

async function createFullCardGalaxy() {
  const count = TAROT_DECK.length;
  const golden = Math.PI * (3 - Math.sqrt(5));
  const baseRadius = 12.5;
  const sharedBackTexture = await loadSharedBackTexture();

  for (let i = 0; i < count; i += 1) {
    const cardData = TAROT_DECK[i];
    const mats = await getCardMaterials(cardData, sharedBackTexture);
    const card = new THREE.Mesh(new THREE.BoxGeometry(1.95, 3.35, 0.06), mats);

    const y = 1 - (i / (count - 1)) * 2;
    const radiusAtY = Math.sqrt(1 - y * y);
    const theta = golden * i * 1.35;
    const wobble = Math.sin(i * 1.73) * 1.6;
    const radius = baseRadius + wobble;

    const x = Math.cos(theta) * radiusAtY * radius;
    const z = Math.sin(theta) * radiusAtY * radius;
    const posY = y * 9.4;
    card.position.set(x, posY, z);

    // 让牌背朝向球外，牌面朝向球心，便于后续翻牌展示对比。
    const outward = card.position.clone().normalize();
    card.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, -1), outward);

    card.userData = {
      cardData,
      isSelected: false,
      floatSeed: Math.random() * Math.PI * 2,
      basePos: card.position.clone(),
      baseQuaternion: card.quaternion.clone(),
      glow: null
    };

    const glow = new THREE.Mesh(
      new THREE.BoxGeometry(2.1, 3.5, 0.1),
      new THREE.MeshBasicMaterial({ color: 0x66d0ff, transparent: true, opacity: 0, side: THREE.BackSide })
    );
    card.add(glow);
    card.userData.glow = glow;

    scene.add(card);
    cardMeshes.push(card);
  }
}

function onPointerMove(event) {
  pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
  mouseNDC.set(pointer.x, pointer.y);
}

let downPoint = { x: 0, y: 0 };
function onPointerDown(event) {
  downPoint = { x: event.clientX, y: event.clientY };
  APP_STATE.dragging = false;
}

function onPointerUp(event) {
  const dx = Math.abs(event.clientX - downPoint.x);
  const dy = Math.abs(event.clientY - downPoint.y);
  APP_STATE.dragging = dx + dy > 5;
}

async function onPointerClick() {
  if (APP_STATE.phase !== "draw" || APP_STATE.lockInteraction || APP_STATE.dragging) {
    return;
  }

  raycaster.setFromCamera(mouseNDC, camera);
  const intersects = raycaster.intersectObjects(cardMeshes, false);
  const hit = intersects.find((entry) => !entry.object.userData.isSelected);
  if (!hit) {
    return;
  }

  const cardMesh = hit.object;
  const nextRole = ROLES[APP_STATE.selectedCards.length];
  if (!nextRole) {
    return;
  }

  APP_STATE.lockInteraction = true;
  cardMesh.userData.isSelected = true;

  const picked = {
    mesh: cardMesh,
    cardData: cardMesh.userData.cardData,
    role: nextRole,
    isReversed: Math.random() < 0.5,
    faceReadyPromise: ensureCardFaceTexture(cardMesh.userData.cardData)
  };
  APP_STATE.selectedCards.push(picked);
  updateSelectedSlots();

  await animateCardToSlot(picked, APP_STATE.selectedCards.length - 1);
  APP_STATE.lockInteraction = false;

  if (APP_STATE.selectedCards.length === 3) {
    APP_STATE.phase = "reveal";
    controls.enabled = false;
    drawTip.textContent = "三张牌已飞入右侧解读区，正在汇聚牌意并生成解读...";
    await askAIForReading();
    APP_STATE.phase = "reading";
  }
}

async function animateCardToSlot(picked, slotIndex) {
  const card = picked.mesh;
  const endPos = slotAnchors[slotIndex].position.clone();
  const startPos = card.position.clone();
  const c1 = startPos.clone().add(new THREE.Vector3(0, 4.2, 0));
  const c2 = endPos.clone().add(new THREE.Vector3(0, 2.8, -2.2));

  await new Promise((resolve) => {
    const progress = { t: 0 };
    const tl = gsap.timeline({ onComplete: resolve });

    tl.to(progress, {
      t: 1,
      duration: 1.35,
      ease: "power3.inOut",
      onUpdate: () => {
        const pos = cubicBezier(startPos, c1, c2, endPos, progress.t);
        card.position.copy(pos);
      }
    }, 0);

    // 飞行过程中保持牌背朝向镜头，让背面先完成空间位移。
    tl.to(card.rotation, {
      x: 0,
      y: Math.PI,
      z: 0,
      duration: 1.0,
      ease: "power2.out"
    }, 0);

    tl.to(card.scale, {
      x: 1.22,
      y: 1.22,
      z: 1.22,
      duration: 0.55,
      yoyo: true,
      repeat: 1,
      ease: "sine.inOut"
    }, 0.18);
  });

  // 等待正面真实纹理加载完成，避免翻开后仍是纯色/文字占位。
  await picked.faceReadyPromise;

  await new Promise((resolve) => {
    const tl = gsap.timeline({ onComplete: resolve });

    // 真正的 3D 翻牌动画：沿 Y 轴 180 度旋转，背面翻到正面。
    tl.to(card.rotation, {
      y: 0,
      z: picked.isReversed ? Math.PI : 0,
      duration: 0.95,
      ease: "back.out(1.35)"
    }, 0);

    tl.to(card.position, {
      x: endPos.x,
      y: endPos.y,
      z: endPos.z,
      duration: 0.18,
      yoyo: true,
      repeat: 1,
      ease: "sine.inOut"
    }, 0.15);
  });
}

function cubicBezier(p0, p1, p2, p3, t) {
  const k = 1 - t;
  return new THREE.Vector3(
    k * k * k * p0.x + 3 * k * k * t * p1.x + 3 * k * t * t * p2.x + t * t * t * p3.x,
    k * k * k * p0.y + 3 * k * k * t * p1.y + 3 * k * t * t * p2.y + t * t * t * p3.y,
    k * k * k * p0.z + 3 * k * k * t * p1.z + 3 * k * t * t * p2.z + t * t * t * p3.z
  );
}

function updateSelectedSlots() {
  const [past, present, future] = APP_STATE.selectedCards;
  slotPast.textContent = past ? `过去：${past.cardData.name}（${past.isReversed ? "逆位" : "正位"}）` : "过去：待抽取";
  slotPresent.textContent = present ? `现在：${present.cardData.name}（${present.isReversed ? "逆位" : "正位"}）` : "现在：待抽取";
  slotFuture.textContent = future ? `未来：${future.cardData.name}（${future.isReversed ? "逆位" : "正位"}）` : "未来：待抽取";
  renderReadingGallery();
}

function renderReadingGallery() {
  if (!readingMedia) {
    return;
  }

  readingMedia.innerHTML = APP_STATE.selectedCards.map((item, index) => `
    <article class="reading-card ${item.isReversed ? "reversed" : ""}">
      <img src="${item.cardData.imageUrl}" alt="${item.cardData.name}" loading="lazy" />
      <div class="reading-card-info">
        <div class="reading-card-role">${item.role}</div>
        <div class="reading-card-name">${index + 1}. ${item.cardData.name}</div>
        <div class="reading-card-state">${item.isReversed ? "逆位" : "正位"}</div>
      </div>
    </article>
  `).join("");
}

function loadSessionHistory() {
  try {
    const raw = sessionStorage.getItem(HISTORY_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.warn("读取占卜记录失败，已忽略。", error);
    return [];
  }
}

function saveSessionHistory() {
  sessionStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(sessionHistory));
}

function formatHistoryTime(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function buildHistorySummary(record) {
  return record.cards.map((item) => `${item.role}:${item.name}${item.isReversed ? "(逆)" : "(正)"}`).join(" · ");
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderHistoryPanel() {
  if (!historyList || !historyDetail) {
    return;
  }

  if (!sessionHistory.length) {
    historyList.innerHTML = '<div class="history-empty">当前会话还没有任何占卜记录。</div>';
    historyDetail.innerHTML = '<p class="history-empty">完成一次占卜后，详情会自动保存在这里。</p>';
    return;
  }

  historyList.innerHTML = sessionHistory.map((record, index) => `
    <div class="history-item ${index === selectedHistoryIndex ? "active" : ""}" data-history-index="${index}">
      <div class="history-item-title">${record.question}</div>
      <div class="history-item-meta">${formatHistoryTime(record.createdAt)}</div>
      <div class="history-item-meta">${buildHistorySummary(record)}</div>
    </div>
  `).join("");

  const activeRecord = sessionHistory[selectedHistoryIndex] || sessionHistory[sessionHistory.length - 1];
  if (activeRecord) {
    selectedHistoryIndex = sessionHistory.indexOf(activeRecord);
    historyDetail.innerHTML = `
      <div class="history-detail-title">${escapeHtml(activeRecord.question)}</div>
      <div class="history-item-meta">${escapeHtml(formatHistoryTime(activeRecord.createdAt))}</div>
      <div class="history-detail-cards">
        ${activeRecord.cards.map((item) => `
          <div class="history-detail-card ${item.isReversed ? "reversed" : ""}">
            <img src="${escapeHtml(item.imageUrl)}" alt="${escapeHtml(item.name)}" />
            <div>
              <div>${escapeHtml(item.role)} · ${escapeHtml(item.name)}</div>
              <div class="history-item-meta">${item.isReversed ? "逆位" : "正位"}</div>
            </div>
          </div>
        `).join("")}
      </div>
      <p style="white-space: pre-wrap; line-height: 1.72;">${escapeHtml(activeRecord.reading)}</p>
    `;
  }
}

function openHistoryPanel() {
  historyPanel.classList.add("active");
  renderHistoryPanel();
}

function closeHistoryPanel() {
  historyPanel.classList.remove("active");
}

function saveCurrentReadingToHistory(answerText) {
  const record = {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    createdAt: Date.now(),
    question: APP_STATE.userQuestion,
    reading: answerText,
    cards: APP_STATE.selectedCards.map((item) => ({
      role: item.role,
      name: item.cardData.name,
      imageUrl: item.cardData.imageUrl,
      isReversed: item.isReversed
    }))
  };

  sessionHistory.unshift(record);
  sessionHistory = sessionHistory.slice(0, 12);
  selectedHistoryIndex = 0;
  saveSessionHistory();
  renderHistoryPanel();
}

async function resetCurrentReading() {
  if (APP_STATE.lockInteraction || !loadingMask.classList.contains("hidden")) {
    return;
  }

  closeHistoryPanel();
  APP_STATE.phase = "question";
  APP_STATE.userQuestion = "";
  APP_STATE.hoveredCard = null;
  APP_STATE.lockInteraction = true;
  controls.enabled = false;

  await new Promise((resolve) => {
    const tl = gsap.timeline({ onComplete: resolve });

    APP_STATE.selectedCards.forEach((item) => {
      item.mesh.userData.isSelected = false;
      tl.to(item.mesh.position, {
        x: item.mesh.userData.basePos.x,
        y: item.mesh.userData.basePos.y,
        z: item.mesh.userData.basePos.z,
        duration: 0.9,
        ease: "power3.inOut"
      }, 0);
      tl.to(item.mesh.quaternion, {
        x: item.mesh.userData.baseQuaternion.x,
        y: item.mesh.userData.baseQuaternion.y,
        z: item.mesh.userData.baseQuaternion.z,
        w: item.mesh.userData.baseQuaternion.w,
        duration: 0.9,
        ease: "power3.inOut"
      }, 0);
      tl.to(item.mesh.scale, { x: 1, y: 1, z: 1, duration: 0.6, ease: "power2.out" }, 0);
    });
  });

  APP_STATE.selectedCards = [];
  questionInput.value = "";
  questionPanel.classList.add("active");
  drawPanel.classList.remove("active");
  readingPanel.classList.remove("active");
  readingContent.textContent = "等待你抽取三张牌后，这里将出现你的专属解读...";
  drawTip.textContent = "请从牌阵中依次选择 3 张牌，代表过去、现在、未来。";
  readingMedia.innerHTML = "";
  updateSelectedSlots();
  controls.enabled = true;
  APP_STATE.lockInteraction = false;
}

function updateHoverEffect() {
  if (APP_STATE.phase !== "draw") {
    APP_STATE.hoveredCard = null;
    return;
  }

  raycaster.setFromCamera(mouseNDC, camera);
  const intersects = raycaster.intersectObjects(cardMeshes, false);
  const top = intersects.find((entry) => !entry.object.userData.isSelected)?.object || null;
  APP_STATE.hoveredCard = top;

  for (const card of cardMeshes) {
    const isHover = card === APP_STATE.hoveredCard;
    const targetScale = card.userData.isSelected ? 1.22 : (isHover ? 1.1 : 1);
    card.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.16);
    const glowOpacity = isHover ? 0.38 : 0;
    card.userData.glow.material.opacity += (glowOpacity - card.userData.glow.material.opacity) * 0.2;
  }
}

async function askAIForReading() {
  if (loadingText) {
    loadingText.textContent = "正在连通宇宙能量，倾听星辰的指引...";
  }
  loadingMask.classList.remove("hidden");

  try {
    const answer = await requestReadingFromServer();
    await typewriterOutput(readingContent, answer, 18);
    drawTip.textContent = "解读完成，可刷新页面重新占卜。";
    saveCurrentReadingToHistory(answer);
  } catch (error) {
    const reasonText = getAiFailureReason(error);
    const errorMessage = [
      "未能连通塔罗神谕接口。",
      `失败原因：${reasonText}`,
      "请检查 Vercel 环境变量 DEEPSEEK_API_KEY、部署日志和接口可用性后重试。"
    ].join("\n");

    await typewriterOutput(readingContent, errorMessage, 16);
    drawTip.textContent = "解读请求失败，请修复服务端配置后重试。";
    console.error("/api/tarot 调用失败", error);
  } finally {
    loadingMask.classList.add("hidden");
  }
}

function getAiFailureReason(error) {
  if (!error) {
    return "未知错误";
  }

  if (typeof error.message === "string" && error.message) {
    if (error.message.includes("Failed to fetch")) {
      return "网络请求失败或本地 /api/tarot 未就绪";
    }

    if (error.message.includes("HTTP 401")) {
      return "服务端 API Key 无效或未授权";
    }

    if (error.message.includes("HTTP 429")) {
      return "接口限流，请稍后重试";
    }

    if (error.message.includes("HTTP 404")) {
      return "接口地址错误";
    }

    return error.message;
  }

  return "请求失败";
}
async function requestReadingFromServer() {
  const payload = {
    question: APP_STATE.userQuestion,
    cards: APP_STATE.selectedCards.map((item) => ({
      role: item.role,
      name: item.cardData.name,
      isReversed: item.isReversed
    }))
  };

  const response = await fetch("/api/tarot", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const responseText = await response.text();
  let responseData = null;
  if (responseText) {
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = null;
    }
  }

  if (!response.ok) {
    const reason = responseData?.error || responseText || "请求失败";
    throw new Error(`HTTP ${response.status}: ${reason}`);
  }

  const data = responseData || {};
  if (!data?.text) {
    throw new Error("/api/tarot 返回空结果");
  }

  return data.text;
}

async function typewriterOutput(targetEl, text, speed = 24) {
  targetEl.textContent = "";
  for (let i = 0; i < text.length; i += 1) {
    targetEl.textContent += text[i];
    await delay(speed);
  }
}

function startDrawPhase() {
  const input = questionInput.value.trim();
  if (!input) {
    questionInput.focus();
    questionInput.placeholder = "请先输入你想占卜的问题...";
    return;
  }

  APP_STATE.userQuestion = input;
  APP_STATE.phase = "draw";
  questionPanel.classList.remove("active");
  drawPanel.classList.add("active");
  readingPanel.classList.add("active");
  controls.enabled = true;
  readingContent.textContent = "请拖动旋转整个牌阵，从 78 张悬浮塔罗牌中抽取三张。";
  renderReadingGallery();
}

function animate() {
  const t = clock.getElapsedTime();

  controls.update();
  nebulaShell.rotation.y = t * 0.01;
  nebulaShell.rotation.x = Math.sin(t * 0.03) * 0.03;

  crystalBall.rotation.y = t * 0.08;
  crystalBall.position.y = 0.4 + Math.sin(t * 0.9) * 0.12;
  crystalBall.children[1].material.opacity = 0.05 + Math.sin(t * 1.5) * 0.02;

  starsLayerA.rotation.y = t * 0.02;
  starsLayerA.rotation.x = Math.sin(t * 0.05) * 0.02;
  starsLayerB.rotation.y = -t * 0.015;
  starsLayerB.rotation.z = Math.sin(t * 0.04) * 0.03;

  magicCircle.rotation.y = t * 0.2;
  magicCircle.children.forEach((child, idx) => {
    if (child.material && "emissiveIntensity" in child.material) {
      child.material.emissiveIntensity = 0.32 + Math.sin(t * 1.3 + idx) * 0.1;
    }
  });

  // 全量牌阵漂浮：每张牌围绕初始点做轻微悬浮和角度扰动，构成银河感。
  cardMeshes.forEach((card, i) => {
    if (card.userData.isSelected) {
      return;
    }
    const seed = card.userData.floatSeed;
    card.position.x = card.userData.basePos.x + Math.cos(t * 0.55 + seed + i * 0.02) * 0.16;
    card.position.y = card.userData.basePos.y + Math.sin(t * 0.72 + seed) * 0.18;
    card.position.z = card.userData.basePos.z + Math.sin(t * 0.61 + seed + i * 0.01) * 0.16;

    const wobble = 0.03;
    card.quaternion.copy(card.userData.baseQuaternion);
    card.rotateX(Math.sin(t * 0.5 + seed) * wobble);
    card.rotateY(Math.cos(t * 0.45 + seed) * wobble);
  });

  updateHoverEffect();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

window.addEventListener("mousemove", onPointerMove);
window.addEventListener("pointerdown", onPointerDown);
window.addEventListener("pointerup", onPointerUp);
window.addEventListener("click", onPointerClick);
window.addEventListener("resize", onResize);
startBtn.addEventListener("click", startDrawPhase);
historyBtn.addEventListener("click", openHistoryPanel);
historyCloseBtn.addEventListener("click", closeHistoryPanel);
resetBtn.addEventListener("click", resetCurrentReading);
historyList.addEventListener("click", (event) => {
  const item = event.target.closest(".history-item");
  if (!item) {
    return;
  }

  const index = Number(item.dataset.historyIndex);
  if (Number.isNaN(index)) {
    return;
  }

  selectedHistoryIndex = index;
  renderHistoryPanel();
});
questionInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    startDrawPhase();
  }
});

(async function bootstrap() {
  if (!window.gsap) {
    console.warn("GSAP 未加载，飞牌动画将退化。请检查 index.html 中的 gsap 脚本。");
  }
  animate();
  // 不阻塞首屏渲染，边显示场景边异步构建 78 张牌阵。
  createFullCardGalaxy();
  renderHistoryPanel();
})();
