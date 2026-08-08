import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Sky, Sparkles, Box, Plane, Float, RenderTexture, PerspectiveCamera, Text } from '@react-three/drei';
import * as THREE from 'three';

// ─── MONITOR SCREEN (RenderTexture with pulsing loading bar) ─────────────────
function MonitorScreen({ taskCount, maxTasks }) {
  const progress = 1 - taskCount / maxTasks; // 0 → 1 as tasks are removed

  return (
    <RenderTexture attach="map" anisotropy={16}>
      <PerspectiveCamera makeDefault manual aspect={4.8 / 3.8} position={[0, 0, 5]} />
      <color attach="background" args={['#000000']} />

      {/* Loading bar background */}
      <mesh position={[0, -0.5, 0]}>
        <planeGeometry args={[3.5, 0.25]} />
        <meshBasicMaterial color="#111111" />
      </mesh>
      {/* Loading bar fill */}
      <mesh position={[progress * 1.75 - 1.75, -0.5, 0.01]} scale={[progress, 1, 1]}>
        <planeGeometry args={[3.5, 0.25]} />
        <meshBasicMaterial color="#ff7a00" />
      </mesh>

      {/* Text */}
      <Text
        position={[0, 0.4, 0]}
        fontSize={0.35}
        color="#ff7a00"
        font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff"
        textAlign="center"
      >
        {`${taskCount} tasks\nremaining`}
      </Text>

      <Text
        position={[0, -0.85, 0]}
        fontSize={0.22}
        color="#555555"
        font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff"
        textAlign="center"
      >
        {`${Math.round(progress * 100)}% cleared`}
      </Text>
    </RenderTexture>
  );
}

// ─── RETRO MONITOR SHELL ──────────────────────────────────────────────────────
function RetroMonitor({ opacity, taskCount, maxTasks }) {
  return (
    <group position={[0, 0, 0]}>
      {/* Casing */}
      <Box args={[6, 5, 4]} position={[0, 0, -2]} radius={0.2}>
        <meshStandardMaterial color="#e0ddcf" roughness={0.8} transparent opacity={opacity} />
      </Box>
      <Box args={[2.5, 1, 2.5]} position={[0, -2.5, -2]}>
        <meshStandardMaterial color="#d0cdbf" roughness={0.9} transparent opacity={opacity} />
      </Box>
      <Box args={[3.5, 0.2, 3.5]} position={[0, -3, -2]}>
        <meshStandardMaterial color="#e0ddcf" roughness={0.8} transparent opacity={opacity} />
      </Box>
      {/* Bezel */}
      <Box args={[5.2, 4.2, 0.1]} position={[0, 0, 0.05]}>
        <meshStandardMaterial color="#2d2c2a" roughness={0.6} transparent opacity={opacity} />
      </Box>
      {/* Screen — uses RenderTexture */}
      <mesh position={[0, 0, 0.12]}>
        <planeGeometry args={[4.8, 3.8]} />
        <meshBasicMaterial transparent opacity={opacity}>
          <MonitorScreen taskCount={taskCount} maxTasks={maxTasks} />
        </meshBasicMaterial>
      </mesh>
      {/* Ambient screen glow */}
      <pointLight position={[0, 0, 1]} intensity={opacity * 2} color="#ff7a00" distance={6} />
    </group>
  );
}

// ─── CHAOTIC TASK OBJECT ─────────────────────────────────────────────────────
function TaskObject({ index, totalTasks, isFinal, taskName }) {
  const meshRef = useRef(null);
  const randomSpeed  = useMemo(() => Math.random() * 2 + 1, []);
  const randomOffset = useMemo(() => Math.random() * Math.PI * 2, []);
  const color = useMemo(() => {
    const colors = ['#FFD166', '#EF476F', '#118AB2', '#06D6A0', '#475f77'];
    return colors[index % colors.length];
  }, [index]);

  const isPaper = index % 3 === 0;

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    if (isFinal) {
      // Zoom toward camera slowly
      meshRef.current.position.lerp(new THREE.Vector3(0, 0, 4), delta * 1.5);
      meshRef.current.rotation.y += delta * 0.3;
    } else {
      const time = state.clock.elapsedTime * randomSpeed + randomOffset;
      const radius = 2 + (index % 4);
      meshRef.current.position.x = Math.sin(time) * radius;
      meshRef.current.position.y = Math.cos(time * 1.3) * radius;
      meshRef.current.position.z = Math.sin(time * 0.8) * 2;
      meshRef.current.rotation.x += delta * randomSpeed;
      meshRef.current.rotation.y += delta * randomSpeed * 1.5;
    }
  });

  return (
    <mesh ref={meshRef}>
      {isPaper
        ? <boxGeometry args={[1.5, 2, 0.05]} />
        : <boxGeometry args={[1.2, 1.5, 0.2]} />
      }
      <meshStandardMaterial color={isFinal ? '#ff7a00' : color} roughness={0.5} emissive={isFinal ? '#ff7a00' : '#000000'} emissiveIntensity={isFinal ? 0.4 : 0} />
      {/* Task name label on the final object */}
      {isFinal && taskName && (
        <Text
          position={[0, 0, 0.15]}
          fontSize={0.18}
          color="#ffffff"
          font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff"
          maxWidth={1.3}
          textAlign="center"
        >
          {taskName}
        </Text>
      )}
    </mesh>
  );
}

// ─── CAMERA CONTROLLER ───────────────────────────────────────────────────────
function CameraController({ phase, setPhase }) {
  const { camera } = useThree();
  useFrame((state, delta) => {
    if (phase === 'approaching') {
      camera.position.lerp(new THREE.Vector3(0, 0, 0.5), delta * 1.5);
      // Use distance instead of fragile z threshold
      if (camera.position.distanceTo(new THREE.Vector3(0, 0, 0)) < 2) {
        setPhase('inside');
      }
    } else if (phase === 'inside' || phase === 'cleared') {
      camera.position.lerp(new THREE.Vector3(0, 0, 8), delta * 2);
    }
  });
  return null;
}

// ─── SCENE ───────────────────────────────────────────────────────────────────
function Scene({ taskCount, maxTasks, phase, setPhase, taskName }) {
  const isCalm = taskCount === 1;

  const tasks = useMemo(() => Array.from({ length: taskCount }).map((_, i) => i), [taskCount]);

  return (
    <>
      <CameraController phase={phase} setPhase={setPhase} />

      {phase === 'approaching' && (
        <>
          <ambientLight intensity={0.9} />
          <directionalLight position={[10, 20, 10]} intensity={1.2} />
          <Sky sunPosition={[100, 20, 100]} />
          <Plane args={[100, 100]} rotation={[-Math.PI / 2, 0, 0]} position={[0, -3, 0]}>
            <meshStandardMaterial color="#38b000" />
          </Plane>
          <Sparkles count={300} scale={30} size={5} opacity={1} color="#ffb703" position={[0, -1, 0]} />
          <Float speed={2} rotationIntensity={0.1} floatIntensity={0.2}>
            <RetroMonitor opacity={1} taskCount={taskCount} maxTasks={maxTasks} />
          </Float>
        </>
      )}

      {(phase === 'inside' || phase === 'cleared') && (
        <>
          <color attach="background" args={isCalm ? ['#87CEEB'] : ['#111113']} />
          <ambientLight intensity={isCalm ? 0.8 : 0.4} />
          <directionalLight position={[5, 5, 5]} intensity={1.5} color={isCalm ? '#F3EEB6' : '#ffffff'} />

          {isCalm && (
            <>
              <Sky sunPosition={[100, 20, 100]} />
              <Plane args={[100, 100]} rotation={[-Math.PI / 2, 0, 0]} position={[0, -3, 0]}>
                <meshStandardMaterial color="#38b000" />
              </Plane>
              <Sparkles count={350} scale={30} size={6} opacity={1} color="#ffb703" position={[0, -1, 0]} />
            </>
          )}

          {!isCalm && (
            <Sparkles count={400} scale={15} size={2} speed={2} opacity={0.25} color="#ffffff" />
          )}

          {tasks.map((i) => (
            <TaskObject
              key={i}
              index={i}
              totalTasks={taskCount}
              isFinal={isCalm && i === 0}
              taskName={isCalm ? taskName : null}
            />
          ))}
        </>
      )}
    </>
  );
}

// ─── COMPONENT ───────────────────────────────────────────────────────────────
const MAX_TASKS = 25;

export default function TaskMountain({ onClose, taskName }) {
  const [taskCount, setTaskCount] = useState(MAX_TASKS);
  const [phase, setPhase] = useState('watching');

  useEffect(() => {
    if (taskCount === 1 && phase === 'inside') {
      setPhase('cleared');
    }
  }, [taskCount, phase]);

  const handleDropTask = () => {
    setTaskCount(prev => Math.max(1, prev - 3));
  };

  const getNarration = () => {
    if (phase === 'watching') return "This is what your brain looks like right now. All of it, swirling. Let's go inside.";
    if (phase === 'approaching') return 'Entering your mind...';
    if (taskCount > 18) return 'Look at all this. No wonder you can\'t pick one thing.';
    if (taskCount > 12) return 'You don\'t have to carry all of this right now. Start pulling them out.';
    if (taskCount > 6)  return 'Keep going. We just need to find the ONE thing.';
    if (taskCount > 1)  return 'Almost there.';
    return taskName
      ? `There it is. Just this one — "${taskName}". Nothing else exists right now.`
      : 'There it is. Just this one thing. Nothing else exists right now.';
  };

  return (
    <div className="absolute inset-0 z-50 flex flex-col bg-[#111113]">
      <div className="absolute inset-0">
        <Canvas camera={{ position: [0, 0, 12], fov: 50 }}>
          <Scene taskCount={taskCount} maxTasks={MAX_TASKS} phase={phase} setPhase={setPhase} taskName={taskName} />
        </Canvas>
      </div>

      {/* Skip */}
      <button
        onClick={onClose}
        className="absolute top-5 right-5 z-20 px-4 py-2 text-white/40 hover:text-white/80 text-sm font-medium transition-colors"
      >
        Skip ✕
      </button>

      {/* Task count badge */}
      {(phase === 'inside' || phase === 'cleared') && taskCount > 1 && (
        <div className="absolute top-5 left-5 z-20 bg-black/50 backdrop-blur-md border border-white/10 px-5 py-2 rounded-full">
          <span className="text-white/60 text-xs font-bold tracking-widest uppercase">{taskCount} tasks swirling</span>
        </div>
      )}

      {/* Narration + Buttons */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-full max-w-xl px-6 z-10 flex flex-col items-center gap-4">
        <div className="bg-white/90 backdrop-blur-xl border border-white/50 px-8 py-5 rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.15)] text-center min-h-[90px] flex items-center justify-center">
          <p className="text-lg font-medium text-[#2c3e50] leading-relaxed transition-all duration-700">
            {getNarration()}
          </p>
        </div>

        <div className="flex gap-4">
          {phase === 'watching' ? (
            <button
              onClick={() => setPhase('approaching')}
              className="px-8 py-4 bg-[#84BF93] hover:bg-[#72A680] text-white rounded-full font-bold shadow-lg transition-all"
            >
              Enter My Mind
            </button>
          ) : phase === 'approaching' ? null
          : taskCount > 1 ? (
            <button
              onClick={handleDropTask}
              className="px-8 py-4 bg-white hover:bg-gray-50 text-[#FF7A00] border-2 border-[#FF7A00] rounded-full font-bold shadow-lg transition-all hover:shadow-[0_0_20px_rgba(255,122,0,0.4)]"
            >
              Pull Out 3 Tasks
            </button>
          ) : (
            <button
              onClick={onClose}
              className="px-10 py-4 bg-[#9ABF17] hover:bg-[#86A814] text-white rounded-full font-bold shadow-[0_0_30px_rgba(154,191,23,0.5)] transition-all text-lg"
            >
              Start This Task
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
