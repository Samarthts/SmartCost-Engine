import React, { useEffect, useRef, useState, useId } from 'react';
import * as THREE from 'three';
import { ViewMode, CadPart, MaterialSpec, DfmPoint } from '../types';
import { 
  Eye, 
  Flame, 
  Grid, 
  Layers, 
  RotateCcw, 
  Maximize2, 
  Sliders, 
  Camera, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle,
  Ruler,
  Scissors,
  Upload,
  Info
} from 'lucide-react';

interface CadCanvasProps {
  part: CadPart;
  material: MaterialSpec;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  remediatedPointIds: string[];
  onToggleRemediation: (pointId: string) => void;
  onOpenDfmDetails: (point: DfmPoint) => void;
  onSelectHotspot?: (point: DfmPoint) => void;
}

export const CadCanvas: React.FC<CadCanvasProps> = ({
  part,
  material,
  viewMode,
  onViewModeChange,
  remediatedPointIds,
  onToggleRemediation,
  onOpenDfmDetails,
  onSelectHotspot,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const modelGroupRef = useRef<THREE.Group | null>(null);
  const clippingPlaneRef = useRef<THREE.Plane | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  const [isAutoRotate, setIsAutoRotate] = useState(true);
  const [sliceProgress, setSliceProgress] = useState(100);
  const [isSliceActive, setIsSliceActive] = useState(false);
  const [isMeasuring, setIsMeasuring] = useState(false);
  const [measurePoints, setMeasurePoints] = useState<THREE.Vector3[]>([]);
  const [measuredDistance, setMeasuredDistance] = useState<number | null>(null);
  const [activeHotspot, setActiveHotspot] = useState<DfmPoint | null>(null);
  const [hotspotScreenCoords, setHotspotScreenCoords] = useState<Record<string, { x: number; y: number; visible: boolean }>>({});
  const [notification, setNotification] = useState<string | null>(null);

  // Initialize Three.js Scene
  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f172a); // Slate-900 high contrast dark CAD canvas
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(160, 140, 210);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.localClippingEnabled = true;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Slicing Plane
    const clipPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 100);
    clippingPlaneRef.current = clipPlane;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight1.position.set(150, 200, 150);
    dirLight1.castShadow = true;
    dirLight1.shadow.mapSize.width = 1024;
    dirLight1.shadow.mapSize.height = 1024;
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x94a3b8, 0.6);
    dirLight2.position.set(-150, -100, -150);
    scene.add(dirLight2);

    const blueRimLight = new THREE.DirectionalLight(0x38bdf8, 0.8);
    blueRimLight.position.set(-100, 150, -100);
    scene.add(blueRimLight);

    // Floor Grid
    const gridHelper = new THREE.GridHelper(300, 30, 0x334155, 0x1e293b);
    gridHelper.position.y = -60;
    scene.add(gridHelper);

    // Interactive Model Group
    const modelGroup = new THREE.Group();
    scene.add(modelGroup);
    modelGroupRef.current = modelGroup;

    // Mouse Interaction (Orbit / Pan simulation)
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    let spherical = new THREE.Spherical().setFromVector3(camera.position);

    const handleMouseDown = (e: MouseEvent) => {
      isDragging = true;
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !cameraRef.current) return;
      const deltaX = e.clientX - previousMousePosition.x;
      const deltaY = e.clientY - previousMousePosition.y;

      if (e.buttons === 1) {
        // Orbit
        spherical.theta -= deltaX * 0.006;
        spherical.phi = Math.max(0.1, Math.min(Math.PI / 2 - 0.05, spherical.phi - deltaY * 0.006));
        camera.position.setFromSpherical(spherical);
        camera.lookAt(0, 0, 0);
      } else if (e.buttons === 2) {
        // Pan
        modelGroup.position.x += deltaX * 0.2;
        modelGroup.position.y -= deltaY * 0.2;
      }
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => {
      isDragging = false;
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      spherical.radius = Math.max(80, Math.min(450, spherical.radius + e.deltaY * 0.15));
      camera.position.setFromSpherical(spherical);
      camera.lookAt(0, 0, 0);
    };

    const dom = renderer.domElement;
    dom.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    dom.addEventListener('wheel', handleWheel, { passive: false });
    dom.addEventListener('contextmenu', (e) => e.preventDefault());

    // Resize Observer
    const resizeObserver = new ResizeObserver(() => {
      if (!container || !rendererRef.current || !cameraRef.current) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    });
    resizeObserver.observe(container);

    // Animation Loop
    let angle = 0;
    const animate = () => {
      animFrameIdRef.current = requestAnimationFrame(animate);

      if (isAutoRotate && !isDragging && modelGroupRef.current) {
        modelGroupRef.current.rotation.y += 0.003;
      }

      // Update Screen Coordinates for 3D Hotspot Badges
      if (cameraRef.current && modelGroupRef.current && container) {
        const coords: Record<string, { x: number; y: number; visible: boolean }> = {};
        const cWidth = container.clientWidth;
        const cHeight = container.clientHeight;

        part.dfmPoints.forEach((point) => {
          const v = new THREE.Vector3(
            point.location[0] * 50,
            point.location[1] * 50,
            point.location[2] * 50
          );
          v.applyMatrix4(modelGroupRef.current!.matrixWorld);
          v.project(cameraRef.current!);

          const x = (v.x * 0.5 + 0.5) * cWidth;
          const y = (-(v.y * 0.5) + 0.5) * cHeight;
          const visible = v.z < 1.0;

          coords[point.id] = { x, y, visible };
        });
        setHotspotScreenCoords(coords);
      }

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      resizeObserver.disconnect();
      dom.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      dom.removeEventListener('wheel', handleWheel);
      if (container.contains(dom)) container.removeChild(dom);
    };
  }, []);

  // Update Geometry & Shaders when Part, Material, ViewMode, or DFM Remediation Changes
  useEffect(() => {
    if (!modelGroupRef.current || !sceneRef.current) return;
    const group = modelGroupRef.current;
    
    // Clear previous geometries
    while (group.children.length > 0) {
      const obj = group.children[0] as THREE.Mesh;
      if (obj.geometry) obj.geometry.dispose();
      if (Array.isArray(obj.material)) {
        obj.material.forEach((m) => m.dispose());
      } else if (obj.material) {
        obj.material.dispose();
      }
      group.remove(obj);
    }

    // Build Realistic CAD Component Mesh based on active Part ID
    const isRemediatedFillet = remediatedPointIds.some(id => id.includes('fillet') || id.includes('burr'));
    const isRemediatedWall = remediatedPointIds.some(id => id.includes('wall') || id.includes('thickness'));
    const isRemediatedTolerance = remediatedPointIds.some(id => id.includes('tol') || id.includes('tool'));

    // Color computation
    const baseColor = new THREE.Color(material.colorHex);
    const metalness = material.category === 'metal' ? 0.85 : material.category === 'alloy' ? 0.95 : 0.05;
    const roughness = material.category === 'metal' ? 0.25 : material.category === 'alloy' ? 0.18 : 0.45;

    // Materials based on viewMode
    let meshMaterial: THREE.Material;

    if (viewMode === 'shaded') {
      meshMaterial = new THREE.MeshStandardMaterial({
        color: baseColor,
        metalness,
        roughness,
        clippingPlanes: isSliceActive && clippingPlaneRef.current ? [clippingPlaneRef.current] : [],
        clipShadows: true,
        side: THREE.DoubleSide,
      });
    } else if (viewMode === 'heatmap') {
      // Vertex Colors Material for Should-Cost Risk Heatmap
      meshMaterial = new THREE.MeshStandardMaterial({
        vertexColors: true,
        roughness: 0.35,
        metalness: 0.2,
        clippingPlanes: isSliceActive && clippingPlaneRef.current ? [clippingPlaneRef.current] : [],
        side: THREE.DoubleSide,
      });
    } else if (viewMode === 'xray') {
      meshMaterial = new THREE.MeshPhysicalMaterial({
        color: 0x38bdf8,
        metalness: 0.1,
        roughness: 0.1,
        transparent: true,
        opacity: 0.38,
        transmission: 0.85,
        ior: 1.4,
        clippingPlanes: isSliceActive && clippingPlaneRef.current ? [clippingPlaneRef.current] : [],
        side: THREE.DoubleSide,
        depthWrite: false,
      });
    } else {
      // Wireframe
      meshMaterial = new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        wireframe: true,
        clippingPlanes: isSliceActive && clippingPlaneRef.current ? [clippingPlaneRef.current] : [],
      });
    }

    // Generate Procedural High-Detail CAD Assemblies
    if (part.id === 'automotive-joint-housing') {
      // Main Center Housing Cylinder & Spherical Chamber
      const mainCylinderGeo = new THREE.CylinderGeometry(28, 32, 60, 48);
      // Flange Mounting Base Plate
      const flangeGeo = new THREE.BoxGeometry(
        isRemediatedWall ? 115 : 125, 
        isRemediatedWall ? 14 : 22, 
        85
      );
      // Internal Cavity Core (subtractive visual proxy)
      const internalBoreGeo = new THREE.CylinderGeometry(
        isRemediatedFillet ? 20 : 16, 
        isRemediatedFillet ? 20 : 16, 
        64, 
        36
      );
      // Upper Stepped Neck
      const neckGeo = new THREE.CylinderGeometry(22, 26, 30, 48);
      // 4 Bolt Mounting Holes
      const holeGeo = new THREE.CylinderGeometry(4.5, 4.5, 26, 24);

      // Apply Heatmap Vertex Colors if in Heatmap mode
      if (viewMode === 'heatmap') {
        applyHeatmapColors(mainCylinderGeo, 'cylinder', isRemediatedFillet);
        applyHeatmapColors(flangeGeo, 'boss', isRemediatedWall);
        applyHeatmapColors(neckGeo, 'neck', isRemediatedTolerance);
        applyHeatmapColors(internalBoreGeo, 'bore', isRemediatedFillet);
      }

      const mainMesh = new THREE.Mesh(mainCylinderGeo, meshMaterial);
      mainMesh.castShadow = true;
      mainMesh.receiveShadow = true;
      mainMesh.position.y = 10;
      group.add(mainMesh);

      const flangeMesh = new THREE.Mesh(flangeGeo, meshMaterial);
      flangeMesh.castShadow = true;
      flangeMesh.receiveShadow = true;
      flangeMesh.position.y = -22;
      group.add(flangeMesh);

      const neckMesh = new THREE.Mesh(neckGeo, meshMaterial);
      neckMesh.position.y = 48;
      neckMesh.castShadow = true;
      group.add(neckMesh);

      // 4 Flange Bolt Counterbores
      const holeOffsets = [
        [-45, -22, -28],
        [45, -22, -28],
        [-45, -22, 28],
        [45, -22, 28],
      ];
      holeOffsets.forEach(([hx, hy, hz]) => {
        const holeMesh = new THREE.Mesh(
          holeGeo,
          new THREE.MeshStandardMaterial({
            color: viewMode === 'heatmap' ? 0xef4444 : 0x1e293b,
            metalness: 0.9,
            roughness: 0.1,
          })
        );
        holeMesh.position.set(hx, hy, hz);
        group.add(holeMesh);
      });

      // Internal Bore Indicator in X-Ray / Slicing
      const internalBoreMesh = new THREE.Mesh(
        internalBoreGeo,
        new THREE.MeshStandardMaterial({
          color: isRemediatedFillet ? 0x10b981 : 0xef4444,
          roughness: 0.3,
          wireframe: viewMode === 'shaded',
          transparent: true,
          opacity: 0.8,
        })
      );
      internalBoreMesh.position.y = 12;
      group.add(internalBoreMesh);

      // Support Rib Gussets (visible when remediated wall thickness is activated)
      if (isRemediatedWall) {
        const ribGeo = new THREE.BoxGeometry(6, 32, 24);
        const rib1 = new THREE.Mesh(ribGeo, meshMaterial);
        rib1.position.set(28, -6, 0);
        rib1.rotation.z = -0.4;
        group.add(rib1);

        const rib2 = new THREE.Mesh(ribGeo, meshMaterial);
        rib2.position.set(-28, -6, 0);
        rib2.rotation.z = 0.4;
        group.add(rib2);
      }
    } else if (part.id === 'aerospace-truss-bracket') {
      // Aerospace Bracket Geometry
      const bracketBaseGeo = new THREE.BoxGeometry(140, 18, 55);
      const trussLeftGeo = new THREE.CylinderGeometry(14, 18, 90, 32);
      const trussRightGeo = new THREE.CylinderGeometry(14, 18, 90, 32);
      const crossBeamGeo = new THREE.BoxGeometry(90, 16, 35);
      const bearingEyeGeo = new THREE.TorusGeometry(20, 8, 24, 48);

      if (viewMode === 'heatmap') {
        applyHeatmapColors(bracketBaseGeo, 'base', isRemediatedWall);
        applyHeatmapColors(trussLeftGeo, 'truss', isRemediatedFillet);
        applyHeatmapColors(crossBeamGeo, 'beam', isRemediatedTolerance);
      }

      const baseMesh = new THREE.Mesh(bracketBaseGeo, meshMaterial);
      baseMesh.position.y = -35;
      group.add(baseMesh);

      const trussLeft = new THREE.Mesh(trussLeftGeo, meshMaterial);
      trussLeft.position.set(-35, 10, 0);
      trussLeft.rotation.z = 0.3;
      group.add(trussLeft);

      const trussRight = new THREE.Mesh(trussRightGeo, meshMaterial);
      trussRight.position.set(35, 10, 0);
      trussRight.rotation.z = -0.3;
      group.add(trussRight);

      const crossBeam = new THREE.Mesh(crossBeamGeo, meshMaterial);
      crossBeam.position.set(0, 42, 0);
      group.add(crossBeam);

      const eyeMesh = new THREE.Mesh(bearingEyeGeo, meshMaterial);
      eyeMesh.position.set(0, 62, 0);
      group.add(eyeMesh);
    } else {
      // Hydraulic Manifold Block
      const manifoldBlockGeo = new THREE.BoxGeometry(100, 85, 75);
      if (viewMode === 'heatmap') {
        applyHeatmapColors(manifoldBlockGeo, 'manifold', isRemediatedFillet);
      }
      const manifoldMesh = new THREE.Mesh(manifoldBlockGeo, meshMaterial);
      group.add(manifoldMesh);

      // Hydraulic port galleries
      const portOffsets = [
        [-30, 20, 38],
        [0, 20, 38],
        [30, 20, 38],
        [-25, -20, 38],
        [25, -20, 38],
      ];
      portOffsets.forEach(([px, py, pz]) => {
        const portGeo = new THREE.CylinderGeometry(8, 8, 20, 24);
        const portMesh = new THREE.Mesh(
          portGeo,
          new THREE.MeshStandardMaterial({
            color: isRemediatedFillet ? 0x10b981 : 0xf59e0b,
            metalness: 0.8,
          })
        );
        portMesh.rotation.x = Math.PI / 2;
        portMesh.position.set(px, py, pz);
        group.add(portMesh);
      });
    }

    // Add Sharp Technical Edge Outlines in Shaded Mode
    if (viewMode === 'shaded') {
      group.children.forEach((child) => {
        if (child instanceof THREE.Mesh && child.geometry) {
          const edgesGeo = new THREE.EdgesGeometry(child.geometry, 35);
          const line = new THREE.LineSegments(
            edgesGeo,
            new THREE.LineBasicMaterial({ color: 0x334155, linewidth: 1 })
          );
          child.add(line);
        }
      });
    }
  }, [part, material, viewMode, remediatedPointIds, isSliceActive]);

  // Slicing Plane Position Update
  useEffect(() => {
    if (!clippingPlaneRef.current) return;
    // Map sliceProgress (0-100) to plane constant (-60 to 70)
    const constant = -60 + (sliceProgress / 100) * 130;
    clippingPlaneRef.current.constant = isSliceActive ? constant : 200;
  }, [sliceProgress, isSliceActive]);

  // Helper to colorize mesh vertices based on Should-Cost risk severity
  function applyHeatmapColors(geometry: THREE.BufferGeometry, zoneType: string, isRemediated: boolean) {
    const count = geometry.attributes.position.count;
    const colors = new Float32Array(count * 3);
    const positions = geometry.attributes.position;

    for (let i = 0; i < count; i++) {
      const y = positions.getY(i);
      const x = positions.getX(i);
      const z = positions.getZ(i);

      let r = 0.1, g = 0.7, b = 0.3; // Default Cool Green / Optimal

      if (!isRemediated) {
        if (zoneType === 'cylinder' && y < 15 && Math.abs(x) < 22) {
          // Deep pocket corner fillet risk: Crimson Red
          r = 0.95; g = 0.15; b = 0.15;
        } else if (zoneType === 'boss' && Math.abs(x) > 35) {
          // Thick solid boss wall chunk: Intense Amber/Red
          r = 0.92; g = 0.35; b = 0.1;
        } else if (zoneType === 'neck' && y > 35) {
          // Tight tolerance bore: Golden Yellow
          r = 0.90; g = 0.75; b = 0.15;
        } else if (zoneType === 'manifold') {
          // Manifold intersection: Orange
          r = 0.88; g = 0.45; b = 0.15;
        }
      } else {
        // Remediated state: Optimized Cyan/Green
        r = 0.1; g = 0.85; b = 0.55;
      }

      colors[i * 3] = r;
      colors[i * 3 + 1] = g;
      colors[i * 3 + 2] = b;
    }

    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  }

  // Camera Reset
  const handleResetCamera = () => {
    if (!cameraRef.current || !modelGroupRef.current) return;
    cameraRef.current.position.set(160, 140, 210);
    cameraRef.current.lookAt(0, 0, 0);
    modelGroupRef.current.rotation.set(0, 0, 0);
    modelGroupRef.current.position.set(0, 0, 0);
    setNotification('Camera view centered');
    setTimeout(() => setNotification(null), 2000);
  };

  // Snapshot Capture
  const handleCaptureSnapshot = () => {
    if (!rendererRef.current) return;
    const dataUrl = rendererRef.current.domElement.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `CAD-${part.id}-${viewMode}.png`;
    link.href = dataUrl;
    link.click();
    setNotification('3D CAD Snapshot saved to downloads');
    setTimeout(() => setNotification(null), 2500);
  };

  return (
    <div id="cad-canvas-container" className="relative w-full h-full min-h-[460px] lg:min-h-[580px] bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col">
      {/* CAD Canvas Header Bar */}
      <div className="absolute top-0 left-0 right-0 z-20 flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-900/80 backdrop-blur-md border-b border-slate-800/80 text-white">
        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">Active 3D CAD Mesh Canvas</span>
          <span className="hidden sm:inline-block text-[11px] px-2 py-0.5 rounded-md bg-slate-800 text-cyan-400 font-mono border border-slate-700">
            {part.name.split(' (')[0]}
          </span>
          <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-mono border border-slate-700">
            {material.code}
          </span>
        </div>

        {/* View Mode Switcher Pills */}
        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            id="view-shaded-btn"
            onClick={() => onViewModeChange('shaded')}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg transition-all ${
              viewMode === 'shaded'
                ? 'bg-cyan-500 text-slate-950 font-semibold shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
            }`}
            title="Standard Metallic PBR Shaded CAD Surface"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Shaded Mesh</span>
          </button>

          <button
            id="view-heatmap-btn"
            onClick={() => onViewModeChange('heatmap')}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg transition-all ${
              viewMode === 'heatmap'
                ? 'bg-rose-500 text-white font-semibold shadow-lg shadow-rose-500/30 ring-2 ring-rose-400/50 animate-pulse'
                : 'text-rose-400 hover:text-rose-200 hover:bg-rose-950/40'
            }`}
            title="AI Cost Risk Heatmap highlighting over-engineered geometrical locations in red/amber"
          >
            <Flame className="w-3.5 h-3.5" />
            <span className="font-semibold">Cost Risk Heatmap</span>
          </button>

          <button
            id="view-wireframe-btn"
            onClick={() => onViewModeChange('wireframe')}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg transition-all ${
              viewMode === 'wireframe'
                ? 'bg-cyan-500 text-slate-950 font-semibold shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
            }`}
            title="Topological CAD Wireframe Lattice"
          >
            <Grid className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Wireframe</span>
          </button>

          <button
            id="view-xray-btn"
            onClick={() => onViewModeChange('xray')}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg transition-all ${
              viewMode === 'xray'
                ? 'bg-cyan-500 text-slate-950 font-semibold shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
            }`}
            title="Volumetric X-Ray Ghosting (inspect internal cavities)"
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">X-Ray</span>
          </button>
        </div>
      </div>

      {/* Primary 3D WebGL Canvas Mount */}
      <div
        id="cad-webgl-mount"
        ref={mountRef}
        className="w-full flex-1 cursor-grab active:cursor-grabbing bg-slate-950 relative"
      />

      {/* Floating 3D Hotspot Badges (AI Risk Alerts) */}
      {viewMode === 'heatmap' &&
        part.dfmPoints.map((point) => {
          const coord = hotspotScreenCoords[point.id];
          if (!coord || !coord.visible) return null;
          const isRemediated = remediatedPointIds.includes(point.id);

          return (
            <div
              key={point.id}
              style={{
                left: `${coord.x}px`,
                top: `${coord.y}px`,
                transform: 'translate(-50%, -50%)',
              }}
              className="absolute z-30 pointer-events-auto"
            >
              <button
                id={`hotspot-${point.id}`}
                onClick={() => onOpenDfmDetails(point)}
                className={`group relative flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-semibold shadow-2xl transition-all scale-100 hover:scale-110 ${
                  isRemediated
                    ? 'bg-emerald-500 text-slate-950 border border-emerald-300'
                    : 'bg-rose-600 text-white border border-rose-300 animate-bounce'
                }`}
              >
                {isRemediated ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : (
                  <AlertTriangle className="w-3.5 h-3.5" />
                )}
                <span>{isRemediated ? 'Remediated' : `+$${point.costImpactPerUnit.toFixed(2)} Risk`}</span>

                {/* Hover Tooltip Card */}
                <div className="absolute left-1/2 bottom-full mb-2 -translate-x-1/2 hidden group-hover:flex flex-col w-56 p-2.5 bg-slate-900/95 backdrop-blur-md rounded-xl border border-slate-700 text-left shadow-2xl text-white z-50">
                  <div className="text-[11px] font-bold text-rose-400 uppercase tracking-wider">{point.title}</div>
                  <div className="text-xs text-slate-300 mt-1 leading-snug">{point.currentSpec}</div>
                  <div className="mt-2 text-[11px] text-emerald-400 font-medium">➔ Remedy: {point.remedySpec}</div>
                  <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800">
                    <span>Cycle: -{point.cycleTimeSavedSec}s</span>
                    <span className="text-emerald-400 font-bold">Save ${point.costImpactPerUnit.toFixed(2)}/unit</span>
                  </div>
                </div>
              </button>
            </div>
          );
        })}

      {/* Heatmap Legend Bar (When Heatmap View is Active) */}
      {viewMode === 'heatmap' && (
        <div className="absolute top-16 left-4 z-20 p-2.5 bg-slate-900/90 backdrop-blur-md rounded-xl border border-slate-800 text-white text-xs max-w-xs shadow-xl">
          <div className="flex items-center justify-between mb-1.5 font-semibold text-slate-200">
            <span className="flex items-center gap-1 text-rose-400">
              <Flame className="w-3.5 h-3.5" />
              AI Cost Risk Intensity
            </span>
            <span className="text-[10px] text-slate-400">Geometry DFM Audit</span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-gradient-to-r from-emerald-500 via-amber-400 to-rose-600 shadow-inner" />
          <div className="flex justify-between text-[10px] text-slate-400 mt-1">
            <span>Optimal (Standard Tooling)</span>
            <span>Over-Engineered (EDM/Sink-Marks)</span>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-800 text-[11px] text-slate-300">
            {remediatedPointIds.length > 0 ? (
              <span className="text-emerald-400 font-medium">
                ✓ {remediatedPointIds.length} of {part.dfmPoints.length} risk zones remediated
              </span>
            ) : (
              <span className="text-rose-400 font-medium">
                ⚠ {part.dfmPoints.length} high-cost geometric features identified
              </span>
            )}
          </div>
        </div>
      )}

      {/* Slicing Cross-Section Tool Drawer */}
      {isSliceActive && (
        <div className="absolute top-16 right-4 z-20 p-3 bg-slate-900/90 backdrop-blur-md rounded-xl border border-slate-800 text-white text-xs shadow-xl w-64">
          <div className="flex items-center justify-between mb-2">
            <span className="flex items-center gap-1 text-cyan-400 font-semibold">
              <Scissors className="w-3.5 h-3.5" />
              Cross-Section Slicing Plane
            </span>
            <span className="font-mono text-[11px] text-slate-300">{sliceProgress}%</span>
          </div>
          <input
            id="slice-progress-slider"
            type="range"
            min="0"
            max="100"
            value={sliceProgress}
            onChange={(e) => setSliceProgress(Number(e.target.value))}
            className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
          />
          <div className="flex justify-between text-[10px] text-slate-400 mt-1">
            <span>Flange Base</span>
            <span>Stepped Neck</span>
          </div>
        </div>
      )}

      {/* Floating Canvas Control Toolbar */}
      <div className="absolute bottom-4 left-4 z-20 flex flex-wrap items-center gap-2">
        <button
          id="cad-autorotate-btn"
          onClick={() => setIsAutoRotate(!isAutoRotate)}
          className={`px-3 py-1.5 text-xs rounded-xl font-medium flex items-center gap-1.5 backdrop-blur-md border transition-all ${
            isAutoRotate
              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-lg'
              : 'bg-slate-900/80 text-slate-300 border-slate-700 hover:bg-slate-800'
          }`}
          title="Toggle Auto-Rotation"
        >
          <RotateCcw className={`w-3.5 h-3.5 ${isAutoRotate ? 'animate-spin' : ''}`} />
          <span>Auto-Spin</span>
        </button>

        <button
          id="cad-slice-toggle-btn"
          onClick={() => setIsSliceActive(!isSliceActive)}
          className={`px-3 py-1.5 text-xs rounded-xl font-medium flex items-center gap-1.5 backdrop-blur-md border transition-all ${
            isSliceActive
              ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-400 shadow-lg'
              : 'bg-slate-900/80 text-slate-300 border-slate-700 hover:bg-slate-800'
          }`}
          title="Inspect Internal Cavity via Slicing Plane"
        >
          <Scissors className="w-3.5 h-3.5" />
          <span>Slice Plane</span>
        </button>

        <button
          id="cad-reset-cam-btn"
          onClick={handleResetCamera}
          className="px-3 py-1.5 text-xs rounded-xl font-medium flex items-center gap-1.5 bg-slate-900/80 text-slate-300 border border-slate-700 hover:bg-slate-800 backdrop-blur-md"
          title="Reset Camera Orientation"
        >
          <Maximize2 className="w-3.5 h-3.5" />
          <span>Center View</span>
        </button>

        <button
          id="cad-snapshot-btn"
          onClick={handleCaptureSnapshot}
          className="px-3 py-1.5 text-xs rounded-xl font-medium flex items-center gap-1.5 bg-slate-900/80 text-slate-300 border border-slate-700 hover:bg-slate-800 backdrop-blur-md"
          title="Export 3D CAD Snapshot"
        >
          <Camera className="w-3.5 h-3.5" />
          <span>Snapshot</span>
        </button>
      </div>

      {/* Geometry Dimensions & Mass HUD Overlay */}
      <div className="absolute bottom-4 right-4 z-20 p-2.5 bg-slate-900/85 backdrop-blur-md rounded-xl border border-slate-800 text-white text-[11px] shadow-xl space-y-1">
        <div className="flex items-center justify-between gap-4 text-slate-400">
          <span>Bounding Box:</span>
          <span className="font-mono text-cyan-300 font-semibold">{part.boundingBox.x} × {part.boundingBox.y} × {part.boundingBox.z} mm</span>
        </div>
        <div className="flex items-center justify-between gap-4 text-slate-400">
          <span>Net Volume:</span>
          <span className="font-mono text-slate-200">{part.netVolumeCm3} cm³</span>
        </div>
        <div className="flex items-center justify-between gap-4 text-slate-400">
          <span>Raw Material Density:</span>
          <span className="font-mono text-slate-200">{material.densityGPerCm3} g/cm³</span>
        </div>
      </div>

      {/* Toast Notification */}
      {notification && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 px-4 py-2 bg-cyan-500 text-slate-950 font-semibold text-xs rounded-full shadow-2xl animate-fade-in">
          {notification}
        </div>
      )}
    </div>
  );
};
