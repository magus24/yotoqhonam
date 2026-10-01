import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Edges, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import type { ID, Room, RoomState } from '../../data/types';
import { ROOM_VISUALS, resolveRoomState } from '../../data/dutyQueue';
import { cn } from '../../lib/utils';
import {
  CORRIDOR_W,
  ROOM_D,
  ROOM_H,
  ROOM_W,
  buildRoute,
  getBounds,
  roomCentre,
  type RoutePoint,
} from './geometry';

export interface FloorSceneProps {
  rooms: Room[];
  queue: ID[];
  activeRoomId: ID | null;
  nextRoomId: ID | null;
  ownRoomId: ID | null;
  dutyStatus: string | null;
  selectedRoomId: ID | null;
  onSelect: (roomId: ID | null) => void;
  /** Landing hero runs a calm ambient camera drift instead of user controls. */
  mode: 'explore' | 'hero';
  reducedMotion: boolean;
  /** Mobile / touch devices: cheaper pixels and lighter materials. */
  compact?: boolean;
}

const stateOf = (room: Room, s: FloorSceneProps): RoomState =>
  resolveRoomState(room.id, {
    currentDutyRoomId: s.activeRoomId,
    nextDutyRoomId: s.nextRoomId,
    ownRoomId: s.ownRoomId,
    dutyStatus: s.dutyStatus as never,
  });

/* ================================================================== */
/* Room block                                                          */
/* ================================================================== */

function RoomBlock({
  room,
  state,
  selected,
  hovered,
  onHover,
  onClick,
  interactive,
  reducedMotion,
}: {
  room: Room;
  state: RoomState;
  selected: boolean;
  hovered: boolean;
  onHover: (v: boolean) => void;
  onClick: () => void;
  interactive: boolean;
  reducedMotion: boolean;
}) {
  const group = useRef<THREE.Group>(null);
  const visual = ROOM_VISUALS[state];
  const lift = state === 'duty_today' ? 0.55 : 0.16;
  const targetY = lift + (hovered ? 0.34 : 0) + (selected ? 0.16 : 0);

  useFrame((_, dt) => {
    if (!group.current) return;
    const k = reducedMotion ? 1 : 1 - Math.pow(0.001, dt);
    group.current.position.y += (targetY - group.current.position.y) * k;
  });

  const emphasise = state === 'duty_today' || selected || hovered;
  const capColor = visual.glow;

  return (
    <group position={[room.x, 0, room.z]}>
      {/* floor pad — the status footprint, visible even from a low angle */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]} receiveShadow={false}>
        <planeGeometry args={[ROOM_W + 0.7, ROOM_D + 0.7]} />
        <meshBasicMaterial
          color={visual.glow}
          transparent
          opacity={emphasise ? 0.16 : 0.055}
          depthWrite={false}
        />
      </mesh>

      {emphasise && !reducedMotion ? (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
          <ringGeometry args={[ROOM_W * 0.62, ROOM_W * 0.68, 48]} />
          <meshBasicMaterial color={visual.glow} transparent opacity={0.5} depthWrite={false} />
        </mesh>
      ) : null}

      <group ref={group} position={[0, targetY, 0]}>
        <mesh
          castShadow={false}
          receiveShadow={false}
          onPointerOver={interactive ? (e) => { e.stopPropagation(); onHover(true); } : undefined}
          onPointerOut={interactive ? (e) => { e.stopPropagation(); onHover(false); } : undefined}
          onClick={interactive ? (e) => { e.stopPropagation(); onClick(); } : undefined}
        >
          <boxGeometry args={[ROOM_W, ROOM_H, ROOM_D]} />
          <meshStandardMaterial
            color={visual.color}
            roughness={0.62}
            metalness={0.18}
            emissive={new THREE.Color(visual.glow)}
            emissiveIntensity={emphasise ? 0.34 : 0.1}
            transparent
            opacity={state === 'neutral' ? 0.62 : 0.95}
          />
          <Edges threshold={15} color={emphasise ? visual.glow : '#8FA0C0'} opacity={emphasise ? 0.85 : 0.28} transparent />
        </mesh>

        {/* glowing cap: the room's status, readable from directly above */}
        <mesh position={[0, ROOM_H / 2 + 0.014, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[ROOM_W * 0.82, ROOM_D * 0.8]} />
          <meshBasicMaterial color={capColor} transparent opacity={emphasise ? 0.85 : 0.3} />
        </mesh>

        {/* door notch facing the corridor */}
        <mesh position={[0, 0.62, room.z > 0 ? -ROOM_D / 2 - 0.03 : ROOM_D / 2 + 0.03]}>
          <boxGeometry args={[0.78, 1.24, 0.06]} />
          <meshStandardMaterial
            color="#05070d"
            emissive={new THREE.Color(visual.glow)}
            emissiveIntensity={state === 'duty_today' ? 0.5 : 0.12}
            roughness={0.8}
          />
        </mesh>
      </group>
    </group>
  );
}

/* ================================================================== */
/* Corridor + handover route                                           */
/* ================================================================== */

function HandoverLine({ route, reducedMotion }: { route: RoutePoint[]; reducedMotion: boolean }) {
  const token = useRef<THREE.Mesh>(null);

  /**
   * The ring is closed: there are `route.length` hops, the last one returning
   * from the final room back to the first. Segments are pre-computed so the
   * travelling token can index them without a negative wrap.
   */
  const segments = useMemo(
    () =>
      route.map((p, i) => {
        const next = route[(i + 1) % route.length]!;
        return {
          from: p.position,
          to: next.position,
          mid: [
            (p.position[0] + next.position[0]) / 2,
            0.06,
            (p.position[2] + next.position[2]) / 2,
          ] as [number, number, number],
          length: Math.hypot(next.position[0] - p.position[0], next.position[2] - p.position[2]),
          angle: Math.atan2(next.position[0] - p.position[0], next.position[2] - p.position[2]),
          closesRing: (i + 1) % route.length === 0,
        };
      }),
    [route],
  );

  useFrame(({ clock }) => {
    if (!token.current || reducedMotion || segments.length === 0) return;
    const count = segments.length;
    const f = (clock.elapsedTime * 0.09) % count;
    const i = Math.min(count - 1, Math.floor(f));
    const local = f - i;
    const a = segments[i]!.from;
    const b = segments[i]!.to;
    token.current.position.set(
      THREE.MathUtils.lerp(a[0], b[0], local),
      0.14 + Math.sin(clock.elapsedTime * 3) * 0.02,
      THREE.MathUtils.lerp(a[2], b[2], local),
    );
  });

  if (route.length === 0) return null;

  return (
    <group>
      {segments.map((s, i) => (
        <mesh key={i} position={s.mid} rotation={[0, s.angle, 0]}>
          <boxGeometry args={[s.closesRing ? 0.05 : 0.075, 0.03, s.length]} />
          <meshBasicMaterial color="#F2B441" transparent opacity={s.closesRing ? 0.22 : 0.55} />
        </mesh>
      ))}

      {route.map((p) => (
        <mesh key={p.roomId} position={[p.position[0], 0.09, p.position[2]]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[p.isCurrent ? 0.3 : 0.19, 24]} />
          <meshBasicMaterial
            color={p.isCurrent ? '#F2B441' : '#5EEAD4'}
            transparent
            opacity={p.isCurrent ? 0.95 : 0.55}
          />
        </mesh>
      ))}

      {!reducedMotion ? (
        <mesh ref={token}>
          <sphereGeometry args={[0.1, 14, 14]} />
          <meshBasicMaterial color="#FCE7B6" />
        </mesh>
      ) : null}
    </group>
  );
}

function Corridor({ rooms, reducedMotion }: { rooms: Room[]; reducedMotion: boolean }) {
  const b = getBounds(rooms);
  const length = b.maxX - b.minX + 2.4;
  const centreX = b.centreX;

  // Sodium lamps down the middle of the corridor.
  const lamps = useMemo(() => {
    const count = Math.max(3, Math.round(length / 4.6));
    return Array.from({ length: count }, (_, i) => b.minX - 0.6 + ((length + 1.2) / count) * (i + 0.5));
  }, [length, b.minX]);

  return (
    <group>
      <mesh position={[centreX, -0.06, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow={false}>
        <planeGeometry args={[length, CORRIDOR_W]} />
        <meshStandardMaterial color="#131c2e" roughness={0.94} metalness={0.04} />
      </mesh>

      {/* corridor edge strips */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[centreX, 0.005, s * (CORRIDOR_W / 2)]}>
          <boxGeometry args={[length, 0.02, 0.05]} />
          <meshBasicMaterial color="#F2B441" transparent opacity={0.28} />
        </mesh>
      ))}

      {lamps.map((x) => (
        <group key={x} position={[x, 0, 0]}>
          <mesh position={[0, 0.9, 0]}>
            <boxGeometry args={[0.04, 1.8, 0.04]} />
            <meshBasicMaterial color="#3b4a68" />
          </mesh>
          <mesh position={[0, 1.8, 0]}>
            <sphereGeometry args={[0.13, 12, 12]} />
            <meshBasicMaterial color="#F7D08A" />
          </mesh>
          {!reducedMotion ? (
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.014, 0]}>
              <circleGeometry args={[1.1, 24]} />
              <meshBasicMaterial color="#F2B441" transparent opacity={0.05} depthWrite={false} />
            </mesh>
          ) : null}
        </group>
      ))}

      {/* stair core — gives the plan architectural credibility */}
      <group position={[b.minX - 1.5, 0, 0]}>
        <mesh position={[0, 1.3, 0]}>
          <boxGeometry args={[1.7, 2.6, CORRIDOR_W + 1.4]} />
          <meshStandardMaterial color="#1a2439" roughness={0.85} metalness={0.1} />
          <Edges threshold={15} color="#8FA0C0" opacity={0.3} transparent />
        </mesh>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[0, 0.85, s * (CORRIDOR_W / 2 + 0.71)]}>
            <boxGeometry args={[0.9, 1.7, 0.05]} />
            <meshStandardMaterial color="#05070d" emissive="#5EEAD4" emissiveIntensity={0.22} roughness={0.8} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

/* ================================================================== */
/* Room number plates                                                  */
/*                                                                     */
/* These are ordinary DOM nodes that live OUTSIDE the WebGL canvas.    */
/* R3F only accepts three.js elements as canvas children, so the       */
/* projection runs inside the canvas and writes straight to these      */
/* nodes' transforms — one loop, no React re-renders, crisp text.      */
/* ================================================================== */

export type LabelRefs = React.MutableRefObject<Map<ID, HTMLDivElement>>;

function Projector({ rooms, labelRefs }: { rooms: Room[]; labelRefs: LabelRefs }) {
  const { camera, size } = useThree();
  const vec = useMemo(() => new THREE.Vector3(), []);

  useFrame(() => {
    for (const room of rooms) {
      const el = labelRefs.current.get(room.id);
      if (!el) continue;
      const [x, y, z] = roomCentre(room);
      vec.set(x, y + ROOM_H * 0.62, z).project(camera);
      const onScreen = vec.z < 1;
      el.style.opacity = onScreen ? '1' : '0';
      el.style.transform = `translate3d(${(vec.x * 0.5 + 0.5) * size.width}px, ${
        (-vec.y * 0.5 + 0.5) * size.height
      }px, 0) translate(-50%, -100%)`;
    }
  });

  return null;
}

function RoomLabelLayer({ rooms, labelRefs }: { rooms: Room[]; labelRefs: LabelRefs }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {rooms.map((room) => (
        <div
          key={room.id}
          ref={(el) => {
            if (el) labelRefs.current.set(room.id, el);
            else labelRefs.current.delete(room.id);
          }}
          style={{ opacity: 0 }}
          className="absolute left-0 top-0 rounded-lg border border-graphite-950/12 bg-ink-950/75 px-1.5 py-0.5 font-mono text-[11px] font-medium tracking-[0.14em] text-text backdrop-blur-sm transition-opacity duration-200"
        >
          {room.number}
        </div>
      ))}
    </div>
  );
}

/* ================================================================== */
/* Camera flight                                                       */
/* ================================================================== */

function CameraRig({
  rooms,
  targetRoomId,
  mode,
  reducedMotion,
  controlsRef,
}: {
  rooms: Room[];
  targetRoomId: ID | null;
  mode: 'explore' | 'hero';
  reducedMotion: boolean;
  controlsRef: React.MutableRefObject<any>;
}) {
  const { camera } = useThree();
  const b = getBounds(rooms);
  const flying = useRef(false);
  const goal = useRef(new THREE.Vector3());
  const lookGoal = useRef(new THREE.Vector3());
  const currentLook = useRef(new THREE.Vector3(b.centreX, 0, 0));
  const [idle, setIdle] = useState(0);

  /* Cinematic intro: the first time the floor is opened the camera starts
     high and wide and settles into the resting plan view. Runs once, so it
     never fights the user afterwards. */
  const intro = useRef(0);
  const introFrom = useRef(new THREE.Vector3());
  const introLook = useRef(new THREE.Vector3());
  const introSpan = useRef(1);

  // Re-derive the resting camera whenever the plan changes size.
  useEffect(() => {
    const span = Math.max(12, b.maxX - b.minX);
    const dist = span * (mode === 'hero' ? 0.92 : 1.06);
    goal.current.set(b.centreX + dist * 0.55, mode === 'hero' ? 15 : 14, dist * 0.72);
    lookGoal.current.set(b.centreX, 0, 0);
    if (targetRoomId) {
      const room = rooms.find((r) => r.id === targetRoomId);
      if (room) {
        goal.current.set(room.x + 7.5, 8.2, room.z + 9.5);
        lookGoal.current.set(room.x, 1.1, room.z);
      }
    }
    flying.current = !reducedMotion;
    setIdle((n) => n + 1);
  }, [targetRoomId, rooms, b.minX, b.maxX, b.centreX, mode, reducedMotion]);

  // Arm the one-shot intro whenever the plan is first opened.
  useEffect(() => {
    if (mode !== 'explore' || reducedMotion || targetRoomId) return;
    intro.current = 0;
    const span = Math.max(12, b.maxX - b.minX);
    introSpan.current = span;
    introFrom.current.set(b.centreX + span * 1.5, 34, span * 1.85);
    introLook.current.set(b.centreX, 0, 0);
    currentLook.current.set(b.centreX, 0, 0);
    camera.position.copy(introFrom.current);
  }, [mode, reducedMotion, targetRoomId, b.minX, b.maxX, b.centreX, camera]);

  // Once the flight lands, hand control back to the user.
  useEffect(() => {
    if (!flying.current) return;
    const t = setTimeout(() => {
      flying.current = false;
    }, 1100);
    return () => clearTimeout(t);
  }, [idle]);

  useFrame(({ clock }, dt) => {
    const k = reducedMotion ? 1 : 1 - Math.pow(0.0025, dt);

    if (mode === 'hero' && !targetRoomId) {
      // Slow cinematic drift; user never drives the hero camera.
      const t = clock.elapsedTime * 0.09;
      const span = Math.max(12, b.maxX - b.minX);
      camera.position.set(
        b.centreX + Math.sin(t) * span * 0.42 + span * 0.24,
        13.5 + Math.sin(t * 0.7) * 1.6,
        Math.cos(t * 0.8) * span * 0.6 + span * 0.36,
      );
      currentLook.current.lerp(new THREE.Vector3(b.centreX, 0, 0), k);
      camera.lookAt(currentLook.current);
      return;
    }

    if (flying.current) {
      // Intro takes over the whole move so the settle reads as one gesture.
      if (mode === 'explore' && intro.current < 1) {
        intro.current = Math.min(1, intro.current + dt / 2.1);
        const e = 1 - Math.pow(1 - intro.current, 3);
        camera.position.lerpVectors(introFrom.current, goal.current, e);
        currentLook.current.lerpVectors(introLook.current, lookGoal.current, e);
        camera.lookAt(currentLook.current);
        const ci = controlsRef.current;
        if (ci) {
          ci.target.copy(currentLook.current);
          ci.update();
        }
        if (intro.current >= 1) flying.current = false;
        return;
      }

      camera.position.lerp(goal.current, k);
      currentLook.current.lerp(lookGoal.current, k);
      camera.lookAt(currentLook.current);
      const c = controlsRef.current;
      if (c) {
        c.target.copy(currentLook.current);
        c.update();
      }
      if (camera.position.distanceTo(goal.current) < 0.15) flying.current = false;
    }
  });

  return null;
}

/* ================================================================== */
/* Scene                                                               */
/* ================================================================== */

function Scene(props: FloorSceneProps) {
  const { rooms, mode, reducedMotion, selectedRoomId, onSelect } = props;
  const [hoveredId, setHoveredId] = useState<ID | null>(null);
  const controlsRef = useRef<any>(null);
  const route = useMemo(
    () => buildRoute(rooms, props.queue, props.activeRoomId),
    [rooms, props.queue, props.activeRoomId],
  );

  const handleHover = (v: boolean, id: ID) => setHoveredId(v ? id : null);

  return (
    <>
      <ambientLight intensity={0.55} color="#8FA8D8" />
      <hemisphereLight args={['#9fb6e8', '#05070d', 0.7]} />
      <directionalLight position={[14, 20, 10]} intensity={0.9} color="#ffe9c4" />
      <directionalLight position={[-16, 8, -12]} intensity={0.45} color="#5EEAD4" />

      <mesh position={[0, -0.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[90, 60]} />
        <meshStandardMaterial color="#080b14" roughness={1} />
      </mesh>

      <Corridor rooms={rooms} reducedMotion={reducedMotion} />
      <HandoverLine route={route} reducedMotion={reducedMotion} />

      {rooms.map((room) => (
        <RoomBlock
          key={room.id}
          room={room}
          state={stateOf(room, props)}
          selected={selectedRoomId === room.id}
          hovered={hoveredId === room.id}
          interactive={mode === 'explore'}
          onHover={(v) => handleHover(v, room.id)}
          onClick={() => onSelect(selectedRoomId === room.id ? null : room.id)}
          reducedMotion={reducedMotion}
        />
      ))}

      <CameraRig
        rooms={rooms}
        targetRoomId={selectedRoomId}
        mode={mode}
        reducedMotion={reducedMotion}
        controlsRef={controlsRef}
      />

      {mode === 'explore' ? (
        <OrbitControls
          ref={controlsRef}
          makeDefault
          enablePan={false}
          enableDamping
          dampingFactor={0.08}
          minDistance={7}
          maxDistance={40}
          minPolarAngle={0.18}
          maxPolarAngle={Math.PI / 2.25}
          target={[getBounds(rooms).centreX, 0, 0]}
        />
      ) : null}
    </>
  );
}

/* ================================================================== */
/* Public wrapper                                                      */
/* ================================================================== */

export function FloorScene(props: FloorSceneProps & { labelRefs: LabelRefs }) {
  const { gl, scene, size } = useThree();

  // No shadow maps anywhere in this scene — nothing casts one.
  useEffect(() => {
    gl.shadowMap.enabled = false;
    scene.background = null;
  }, [gl, scene]);

  return (
    <>
      <Scene {...props} />
      <Projector rooms={props.rooms} labelRefs={props.labelRefs} />
      <ResponsiveFov width={size.width} />
    </>
  );
}

function ResponsiveFov({ width }: { width: number }) {
  const { camera } = useThree();
  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    if (!cam.isPerspectiveCamera) return;
    cam.fov = width < 640 ? 54 : width < 1024 ? 46 : 40;
    cam.updateProjectionMatrix();
  }, [camera, width]);
  return null;
}

/* ================================================================== */
/* Canvas shell with visibility gating                                 */
/* ================================================================== */

export function FloorCanvas(props: FloorSceneProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const labelRefs = useRef<Map<ID, HTMLDivElement>>(new Map());
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const el = hostRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([entry]) => setVisible(Boolean(entry?.isIntersecting)), {
      rootMargin: '160px',
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Rendering stops entirely when the canvas scrolls out of view.
  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) setVisible(false);
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  // Mobile GPUs get a tighter budget: fewer pixels, no shadow map.
  const [compact, setCompact] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px), (pointer: coarse)');
    const sync = () => setCompact(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  const dpr: [number, number] =
    props.mode === 'hero'
      ? compact
        ? [1, 1.25]
        : [1, 1.5]
      : compact
        ? [1, props.reducedMotion ? 1 : 1.35]
        : [1, props.reducedMotion ? 1.25 : 1.75];

  return (
    <div ref={hostRef} className="absolute inset-0">
      <Canvas
        dpr={dpr}
        frameloop={visible ? 'always' : 'never'}
        gl={{ antialias: !compact, alpha: true, powerPreference: 'high-performance' }}
        camera={{ fov: 40, position: [14, 14, 18], near: 0.5, far: 220 }}
        style={{ touchAction: 'pan-y' }}
      >
        <FloorScene {...props} labelRefs={labelRefs} compact={compact} />
      </Canvas>
      {props.mode === 'explore' ? <RoomLabelLayer rooms={props.rooms} labelRefs={labelRefs} /> : null}
    </div>
  );
}

/* ================================================================== */
/* Hover / selected readout — HTML, so the text is crisp and selectable */
/* ================================================================== */

export function RoomReadout({
  room,
  state,
  residents,
  onOpen,
  className,
}: {
  room: Room | null;
  state: RoomState;
  residents: number;
  onOpen?: () => void;
  className?: string;
}) {
  if (!room) {
    return (
      <div className={cn('panel-quiet px-4 py-3', className)}>
        <p className="text-sm text-text-mist">Pick a room to inspect it</p>
      </div>
    );
  }
  const v = ROOM_VISUALS[state];
  return (
    <div className={cn('panel px-4 py-3.5', className)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="plate">ROOM {room.number}</p>
          <p className="mt-2.5 text-sm font-medium text-text">
            {residents} {residents === 1 ? 'resident' : 'residents'}
          </p>
        </div>
        <div className="text-right">
          <span className="inline-flex items-center gap-1.5 text-2xs font-semibold" style={{ color: v.glow }}>
            <span className="size-1.5 rounded-full" style={{ background: v.glow }} />
            {v.label.toUpperCase()}
          </span>
          <p className="mt-1.5 max-w-[13ch] text-2xs leading-relaxed text-text-dim">{v.description}</p>
        </div>
      </div>
      {onOpen ? (
        <button onClick={onOpen} className="btn-ghost btn-sm mt-3 w-full">
          Open room {room.number}
        </button>
      ) : null}
    </div>
  );
}
