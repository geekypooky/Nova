import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sparkles, Text, MeshReflectorMaterial, Float, Environment, Sky } from '@react-three/drei';
import * as THREE from 'three';

// Nova's reframe lines after each crack — one per mirror
const CRACK_LINES = [
  "Is that actually what happened?",
  "That's RSD writing the story.",
  "Your brain filled in the blanks.",
  "They're living their life. Not plotting against you.",
  "That's a guess, not a fact.",
  "The mirror lies. You don't have to believe it.",
];

// ─── MIRROR ──────────────────────────────────────────────────────────────────
function Mirror({ position, rotation, thought, state, onCrack, onShatter, crackLine, index }) {
  const meshRef = useRef();
  const jitterOffset = useRef(Math.random() * Math.PI * 2);

  useFrame((state_, delta) => {
    if (!meshRef.current || state === 'shattered') return;
    const chaos = state === 'intact' ? 1 : 0.2;
    meshRef.current.position.y =
      position[1] + Math.sin(state_.clock.elapsedTime * 10 + jitterOffset.current) * 0.003 * chaos;
  });

  // Shattered → burst of sparkles
  if (state === 'shattered') {
    return (
      <Sparkles
        position={position}
        count={80}
        scale={4}
        size={5}
        speed={3}
        opacity={0.9}
        color="#ffffff"
      />
    );
  }

  // Cracked state — mirror dims and wobbles slightly
  const isCracked = state === 'cracked';

  return (
    <group position={position} rotation={rotation}>
      <mesh
        onClick={isCracked ? onShatter : onCrack}
        ref={meshRef}
        scale={isCracked ? [1, 1, 1] : [1, 1, 1]}
      >
        <planeGeometry args={[3, 5]} />
        <MeshReflectorMaterial
          blur={isCracked ? [800, 800] : [400, 400]}
          resolution={512}
          mixBlur={1}
          mixStrength={isCracked ? 4 : 12}
          roughness={isCracked ? 0.9 : 0.15}
          depthScale={1}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.4}
          color={isCracked ? '#550000' : '#333333'}
          metalness={isCracked ? 0.3 : 0.9}
        />
      </mesh>

      {/* Crack overlay when cracked */}
      {isCracked && (
        <mesh position={[0, 0, 0.01]}>
          <planeGeometry args={[3, 5]} />
          <meshBasicMaterial color="#ff0000" transparent opacity={0.15} />
        </mesh>
      )}

      {/* RSD Thought text */}
      {!isCracked && (
        <Float speed={3} rotationIntensity={0.15} floatIntensity={0.4} position={[0, 0, 0.5]}>
          <Text
            fontSize={0.28}
            color="#ff4757"
            font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff"
            maxWidth={2.5}
            textAlign="center"
          >
            {thought}
          </Text>
        </Float>
      )}

      {/* Crack line — appears after crack, before shatter */}
      {isCracked && crackLine && (
        <Float speed={2} rotationIntensity={0} floatIntensity={0.2} position={[0, 0, 0.5]}>
          <Text
            fontSize={0.24}
            color="#ffffff"
            font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff"
            maxWidth={2.5}
            textAlign="center"
          >
            {crackLine}
          </Text>
        </Float>
      )}

      {/* Hover ring (intact only) */}
      {!isCracked && (
        <mesh position={[0, 0, -0.05]}>
          <planeGeometry args={[3.2, 5.2]} />
          <meshBasicMaterial color="#ff4757" transparent opacity={0.06} />
        </mesh>
      )}
    </group>
  );
}

// ─── AUTO-ORBIT CAMERA ───────────────────────────────────────────────────────
function AutoOrbit({ phase }) {
  useFrame((state, delta) => {
    if (phase === 'cleared') return; // stop orbiting once cleared
    const t = state.clock.elapsedTime;
    state.camera.position.x = Math.sin(t * 0.2) * 0.8;
    state.camera.position.y = Math.cos(t * 0.1) * 0.3 + 0.2;
    state.camera.lookAt(0, 0, 0);
  });
  return null;
}

// ─── SCENE ───────────────────────────────────────────────────────────────────
function Scene({ mirrors, crackMirror, shatterMirror, phase, crackLines }) {
  const isCleared = phase === 'cleared';
  const isWhiteout = phase === 'whiteout';

  return (
    <>
      {isCleared ? (
        <>
          <color attach="background" args={['#f1f2f6']} />
          <ambientLight intensity={2} />
          <Sky sunPosition={[0, 10, -10]} turbidity={0.1} />
          <Float speed={1.5} rotationIntensity={0.05} floatIntensity={0.2}>
            <Text
              position={[0, 0.5, -3]}
              fontSize={0.38}
              color="#2f3542"
              font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff"
              maxWidth={5}
              textAlign="center"
            >
              {`The mirrors are gone.\nThey're just living their life.\nYou are safe.`}
            </Text>
          </Float>
          <Sparkles count={300} scale={22} size={3.5} speed={0.15} opacity={1} color="#ffffff" />
        </>
      ) : (
        <>
          <color attach="background" args={['#000000']} />
          <ambientLight intensity={isWhiteout ? 8 : 0.2} />
          <pointLight position={[0, 2, 0]} intensity={isWhiteout ? 20 : 2} color={isWhiteout ? '#ffffff' : '#4b4b4b'} />
          <Sparkles count={250} scale={14} size={0.8} speed={0.6} opacity={0.08} color="#ffffff" />

          {mirrors.map((mirror, index) => (
            <Mirror
              key={index}
              index={index}
              position={mirror.position}
              rotation={mirror.rotation}
              thought={mirror.thought}
              state={mirror.state}
              crackLine={crackLines[index]}
              onCrack={() => crackMirror(index)}
              onShatter={() => shatterMirror(index)}
            />
          ))}
          <Environment preset="city" />
        </>
      )}
      <AutoOrbit phase={phase} />
    </>
  );
}

// ─── COMPONENT ───────────────────────────────────────────────────────────────
export default function MirrorRoom({ onClose, userThought }) {
  const [phase, setPhase] = useState('anxious'); // 'anxious' | 'whiteout' | 'cleared'
  const [activeCrackIndex, setActiveCrackIndex] = useState(null);

  // Build 6 mirrors — first one uses the real user thought if available
  const buildMirrors = useMemo(() => {
    const genericThoughts = [
      "They're mad at you",
      "You talk too much",
      "They secretly hate you",
      "You're too intense",
      "Everyone is judging you",
      "You ruined the vibe",
    ];

    // Insert real thought at mirror 0 if provided
    if (userThought) {
      genericThoughts[0] = `"${userThought.slice(0, 60)}${userThought.length > 60 ? '...' : ''}"`;
    }

    return Array.from({ length: 6 }).map((_, i) => {
      const angle = (i / 6) * Math.PI * 2;
      const radius = 4.5;
      return {
        position: [Math.sin(angle) * radius, 0, Math.cos(angle) * radius],
        rotation: [0, angle + Math.PI, 0],
        thought: genericThoughts[i],
        state: 'intact', // 'intact' | 'cracked' | 'shattered'
      };
    });
  }, [userThought]);

  const [mirrors, setMirrors] = useState(buildMirrors);

  // Crack a mirror (first click)
  const crackMirror = (index) => {
    setMirrors(prev => prev.map((m, i) => i === index ? { ...m, state: 'cracked' } : m));
    setActiveCrackIndex(index);
  };

  // Shatter a mirror (second click after crack)
  const shatterMirror = (index) => {
    setMirrors(prev => prev.map((m, i) => i === index ? { ...m, state: 'shattered' } : m));
    setActiveCrackIndex(null);
  };

  // Check if all shattered → trigger whiteout → then cleared
  useEffect(() => {
    if (mirrors.every(m => m.state === 'shattered') && phase === 'anxious') {
      setPhase('whiteout');
      setTimeout(() => setPhase('cleared'), 1800);
    }
  }, [mirrors, phase]);

  const remaining = mirrors.filter(m => m.state !== 'shattered').length;
  const cracked = mirrors.find((m, i) => m.state === 'cracked');

  const getNarration = () => {
    if (phase === 'cleared') return "It's quiet now. There's nothing left to distort.";
    if (phase === 'whiteout') return "The mirrors are gone.";
    if (cracked) return CRACK_LINES[activeCrackIndex] + ' — click again to shatter it.';
    if (remaining === 6) return "Every mirror in here is showing you a lie. Click one to crack it.";
    if (remaining > 3)   return "That's not what they said. That's RSD talking. Break it.";
    if (remaining > 1)   return "Almost there. Just a few more lies to break.";
    return "One left.";
  };

  return (
    <div className="absolute inset-0 z-50 flex flex-col bg-black">
      <div className="absolute inset-0">
        <Canvas camera={{ position: [0, 0, 0.1], fov: 65 }}>
          <React.Suspense fallback={null}>
            <Scene
              mirrors={mirrors}
              crackMirror={crackMirror}
              shatterMirror={shatterMirror}
              phase={phase}
              crackLines={CRACK_LINES}
            />
          </React.Suspense>
        </Canvas>
      </div>

      {/* White flash overlay for whiteout phase */}
      {phase === 'whiteout' && (
        <div className="absolute inset-0 bg-white pointer-events-none animate-ping" style={{ animationDuration: '0.6s', animationIterationCount: 1 }} />
      )}

      {/* Skip */}
      <button
        onClick={onClose}
        className="absolute top-5 right-5 z-20 px-4 py-2 text-white/40 hover:text-white/80 text-sm font-medium transition-colors"
      >
        Skip ✕
      </button>

      {/* Mirror counter */}
      {phase === 'anxious' && (
        <div className="absolute top-5 left-5 z-20 flex gap-1.5">
          {mirrors.map((m, i) => (
            <div
              key={i}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-500 ${
                m.state === 'shattered' ? 'bg-white scale-75 opacity-40' :
                m.state === 'cracked'   ? 'bg-red-400 animate-pulse' :
                'bg-white/20'
              }`}
            />
          ))}
        </div>
      )}

      {/* Bottom narration */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-full max-w-2xl px-6 z-10 flex flex-col items-center gap-4 pointer-events-none">
        <div className={`backdrop-blur-xl border px-8 py-5 rounded-3xl shadow-xl text-center min-h-[80px] flex items-center justify-center transition-all duration-700 ${
          phase === 'cleared'
            ? 'bg-white/90 border-white/60'
            : 'bg-black/60 border-white/15'
        }`}>
          <p className={`text-lg font-medium leading-relaxed transition-colors duration-700 ${phase === 'cleared' ? 'text-[#2f3542]' : 'text-white/90'}`}>
            {getNarration()}
          </p>
        </div>

        {phase === 'cleared' && (
          <button
            onClick={onClose}
            className="pointer-events-auto px-10 py-4 bg-[#84BF93] hover:bg-[#72A680] text-white rounded-full font-bold tracking-wide shadow-[0_0_30px_rgba(132,191,147,0.5)] transition-all text-lg"
          >
            I'm Ready to Reply
          </button>
        )}
      </div>

      {/* Center aim dot */}
      {phase === 'anxious' && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-white/25 pointer-events-none" />
      )}
    </div>
  );
}
