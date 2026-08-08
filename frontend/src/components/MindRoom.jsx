import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sky, Cloud, Sparkles, Float } from '@react-three/drei';
import * as THREE from 'three';

// ─── 3D SCENE ────────────────────────────────────────────────────────────────

// A single dark chaos cloud that drifts and bobs erratically
function ChaosCloud({ position, speed, calmLevel }) {
  const groupRef = useRef(null);
  const baseY = position[1];

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    // Erratic bob — chaos = big amplitude, calm = fades out
    const chaos = 1 - calmLevel;
    groupRef.current.position.y = baseY + Math.sin(t * speed + position[0]) * 0.4 * chaos;
    groupRef.current.position.x = position[0] + Math.sin(t * speed * 0.5) * 0.6 * chaos;
    // Scale down as calm builds
    const targetScale = THREE.MathUtils.lerp(1, 0.0, calmLevel);
    groupRef.current.scale.setScalar(
      THREE.MathUtils.lerp(groupRef.current.scale.x, targetScale, delta * 1.5)
    );
  });

  return (
    <group ref={groupRef} position={position}>
      <Cloud opacity={0.85} speed={speed} width={5} depth={2} segments={12} color="#1e2a35" />
    </group>
  );
}

// A calm white/lavender cloud that fades IN as calm builds
function CalmCloud({ position, speed, calmLevel }) {
  const groupRef = useRef(null);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    groupRef.current.position.y = position[1] + Math.sin(t * speed * 0.3) * 0.3;
    // Fade in
    const targetScale = THREE.MathUtils.lerp(0.0, 1, calmLevel);
    groupRef.current.scale.setScalar(
      THREE.MathUtils.lerp(groupRef.current.scale.x, targetScale, delta * 1.2)
    );
  });

  return (
    <group ref={groupRef} position={position}>
      <Cloud opacity={0.75} speed={speed} width={8} depth={2} segments={18} color="#e8f4f8" />
    </group>
  );
}

// Rolling ground that shakes in chaos, stills in calm
function Ground({ calmLevel }) {
  const meshRef = useRef(null);
  const shakeRef = useRef(0);

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    const chaos = 1 - calmLevel;
    shakeRef.current = (Math.random() - 0.5) * 0.06 * chaos;
    meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, -2 + shakeRef.current, delta * 4);

    // Colour lerp: dark void → green jujube
    const darkColor = new THREE.Color('#1a1a1c');
    const greenColor = new THREE.Color('#9ABF17');
    meshRef.current.material.color.lerpColors(darkColor, greenColor, calmLevel);
  });

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]}>
      <sphereGeometry args={[50, 64, 64, 0, Math.PI * 2, 0, Math.PI / 4]} />
      <meshStandardMaterial color="#1a1a1c" roughness={0.8} />
    </mesh>
  );
}

// Red emergency light that pulses in chaos only
function ChaoticLight({ calmLevel }) {
  const lightRef = useRef(null);
  useFrame((state) => {
    if (!lightRef.current) return;
    const chaos = 1 - calmLevel;
    lightRef.current.intensity = (3 + Math.sin(state.clock.elapsedTime * 8) * 2) * chaos;
  });
  return <pointLight ref={lightRef} position={[0, 2, 2]} color="#ff0044" distance={25} />;
}

// Ambient light lerps from dim (chaos) to bright (calm)
function SceneLights({ calmLevel }) {
  const ambRef = useRef(null);
  const dirRef = useRef(null);
  useFrame((_, delta) => {
    if (ambRef.current) ambRef.current.intensity = THREE.MathUtils.lerp(ambRef.current.intensity, 0.1 + calmLevel * 0.8, delta * 2);
    if (dirRef.current) dirRef.current.intensity = THREE.MathUtils.lerp(dirRef.current.intensity, calmLevel * 1.8, delta * 2);
  });
  return (
    <>
      <ambientLight ref={ambRef} intensity={0.1} />
      <directionalLight ref={dirRef} position={[10, 10, 5]} intensity={0} color="#F3EEB6" />
    </>
  );
}

function Scene({ calmLevel }) {
  return (
    <>
      <SceneLights calmLevel={calmLevel} />
      <ChaoticLight calmLevel={calmLevel} />

      {/* Sky appears above 30% calm */}
      {calmLevel > 0.3 && (
        <Sky
          sunPosition={[100, 20, 100]}
          turbidity={THREE.MathUtils.lerp(10, 0.1, calmLevel)}
          rayleigh={0.5}
          mieCoefficient={0.005}
          mieDirectionalG={0.8}
        />
      )}

      <Ground calmLevel={calmLevel} />

      {/* === CHAOS CLOUDS (8 of them, disappear as calm builds) === */}
      <ChaosCloud position={[-3, 2, -5]}  speed={1.8} calmLevel={calmLevel} />
      <ChaosCloud position={[4,  3, -6]}  speed={2.2} calmLevel={calmLevel} />
      <ChaosCloud position={[0,  5, -4]}  speed={1.5} calmLevel={calmLevel} />
      <ChaosCloud position={[-5, 4, -8]}  speed={2.0} calmLevel={calmLevel} />
      <ChaosCloud position={[6,  1, -7]}  speed={1.3} calmLevel={calmLevel} />
      <ChaosCloud position={[-6, 6, -6]}  speed={2.5} calmLevel={calmLevel} />
      <ChaosCloud position={[2,  7, -9]}  speed={1.7} calmLevel={calmLevel} />
      <ChaosCloud position={[-2, 1, -3]}  speed={3.0} calmLevel={calmLevel} />

      {/* === CALM CLOUDS (7 fluffy white ones, appear as calm builds) === */}
      <Float speed={0.8} rotationIntensity={0} floatIntensity={1.5}>
        <CalmCloud position={[0,   8, -15]} speed={0.4} calmLevel={calmLevel} />
        <CalmCloud position={[-10, 6, -20]} speed={0.3} calmLevel={calmLevel} />
        <CalmCloud position={[10,  5, -18]} speed={0.5} calmLevel={calmLevel} />
        <CalmCloud position={[-5,  9, -25]} speed={0.35} calmLevel={calmLevel} />
        <CalmCloud position={[7,   7, -22]} speed={0.45} calmLevel={calmLevel} />
        <CalmCloud position={[-8,  4, -12]} speed={0.28} calmLevel={calmLevel} />
        <CalmCloud position={[3,  10, -28]} speed={0.5}  calmLevel={calmLevel} />
      </Float>

      {/* Sparkles appear when fully calm */}
      {calmLevel > 0.85 && (
        <Sparkles count={250} scale={22} size={2.5} speed={0.3} opacity={calmLevel - 0.85} color="#DDECF1" />
      )}
    </>
  );
}

// ─── UI OVERLAY ──────────────────────────────────────────────────────────────

export default function MindRoom({ onClose }) {
  // 0 = full chaos, 1 = full calm
  const [calmLevel, setCalmLevel] = useState(0);
  const isHoldingRef = useRef(false);
  const rafRef = useRef(null);
  const FILL_RATE = 0.007;  // how fast calm builds per frame (~60fps → ~8s to fill)
  const DECAY_RATE = 0.004; // how fast chaos returns when released

  // Animation loop: build or decay calmLevel
  const tick = useCallback(() => {
    setCalmLevel(prev => {
      const next = isHoldingRef.current
        ? Math.min(1, prev + FILL_RATE)
        : Math.max(0, prev - DECAY_RATE);
      return next;
    });
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [tick]);

  const startHold = () => { isHoldingRef.current = true; };
  const stopHold  = () => { isHoldingRef.current = false; };

  const isCalm = calmLevel >= 0.9;
  const pct = Math.round(calmLevel * 100);

  const getNarration = () => {
    if (calmLevel < 0.15) return 'Does this look familiar? This is your nervous system on overdrive.';
    if (calmLevel < 0.35) return 'This isn\'t your life. This is just your brain on emergency mode.';
    if (calmLevel < 0.55) return 'Keep breathing. Your brain is starting to believe you\'re safe.';
    if (calmLevel < 0.75) return 'See the clouds? They\'re lifting. Nothing in the real world changed.';
    if (calmLevel < 0.9)  return 'Almost there. Stay with it.';
    return 'You did it. Your brain just stopped telling your body it was an emergency. You\'re safe.';
  };

  return (
    <div className="absolute inset-0 z-50 flex flex-col bg-[#111113]">

      {/* 3D Canvas */}
      <div className="absolute inset-0">
        <Canvas camera={{ position: [0, 2, 10], fov: 60 }}>
          <Scene calmLevel={calmLevel} />
        </Canvas>
      </div>

      {/* Red pulse overlay during chaos */}
      {calmLevel < 0.3 && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(circle at center, rgba(255,0,68,0.08) 0%, transparent 70%)',
            animation: 'pulse 1.2s ease-in-out infinite',
          }}
        />
      )}

      {/* Skip button — top right */}
      <button
        onClick={onClose}
        className="absolute top-5 right-5 z-20 px-4 py-2 text-white/50 hover:text-white/90 text-sm font-medium transition-colors"
      >
        Skip ✕
      </button>

      {/* Bottom UI */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-full max-w-xl px-6 z-10 flex flex-col items-center gap-5">

        {/* Narration card */}
        <div className="bg-black/50 backdrop-blur-xl border border-white/10 px-7 py-5 rounded-3xl text-center min-h-[90px] flex items-center justify-center shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
          <p className="text-lg font-medium text-white/90 leading-relaxed transition-all duration-700">
            {getNarration()}
          </p>
        </div>

        {/* Calm progress bar */}
        <div className="w-full">
          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-100"
              style={{
                width: `${pct}%`,
                background: `linear-gradient(90deg, #ff0044 0%, #ff7a00 40%, #9ABF17 100%)`,
              }}
            />
          </div>
          <p className="text-center text-white/30 text-xs mt-1 tracking-widest font-medium uppercase">
            {pct < 10 ? 'Chaos' : pct < 50 ? 'Settling...' : pct < 90 ? 'Calming...' : 'Calm ✓'}
          </p>
        </div>

        {/* Hold button or exit */}
        {isCalm ? (
          <button
            onClick={onClose}
            className="px-10 py-4 bg-[#84BF93] hover:bg-[#72A680] text-white rounded-full font-bold tracking-wide shadow-[0_0_30px_rgba(132,191,147,0.5)] transition-all text-lg"
          >
            Return to Chat
          </button>
        ) : (
          <button
            onMouseDown={startHold}
            onMouseUp={stopHold}
            onMouseLeave={stopHold}
            onTouchStart={startHold}
            onTouchEnd={stopHold}
            className={`w-48 h-48 rounded-full font-bold text-white text-base tracking-wide select-none transition-all duration-150 flex flex-col items-center justify-center gap-1 shadow-[0_0_40px_rgba(0,0,0,0.6)] active:scale-95 ${
              isHoldingRef.current
                ? 'bg-[#9ABF17]/80 border-4 border-[#9ABF17] scale-105 shadow-[0_0_60px_rgba(154,191,23,0.6)]'
                : 'bg-white/10 border-4 border-white/20 hover:bg-white/15'
            }`}
            style={{ WebkitUserSelect: 'none' }}
          >
            <span className="text-4xl">🫁</span>
            <span className="text-sm font-bold mt-1">Hold to breathe</span>
            <span className="text-xs text-white/50 font-normal">release = chaos returns</span>
          </button>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
