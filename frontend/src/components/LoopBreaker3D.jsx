import React, { useRef, useState, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html, QuadraticBezierLine, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

const defaultScenario = {
  fact: { text: "They haven't replied for 4 hours." },
  interpretation: { 
    text: "They're angry with me.", 
    explanation: "ADHD time blindness makes the wait feel permanent, leading to worst-case assumptions." 
  },
  emotion: { 
    text: "Anxiety / rejection sensitivity trigger", 
    explanation: "Rejection Sensitive Dysphoria (RSD) expects the worst, causing a real physical anxiety spike." 
  },
  prediction: { 
    text: "They're going to leave.", 
    explanation: "Emotional dysregulation amplifies the fear, turning a delayed text into a relationship ending." 
  },
  reaction: { 
    text: "I want to double text.", 
    explanation: "Impulsivity demands immediate reassurance to stop the anxiety." 
  }
};

// --- Custom Hook for Dragging ---
function useDragNode(onDrag, onDragEnd) {
  const [isDragging, setIsDragging] = useState(false);
  const { camera, size } = useThree();
  const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0); // Z=0 plane
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  const handlePointerDown = (e) => {
    e.stopPropagation();
    setIsDragging(true);
    e.target.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (!isDragging) return;
    const rect = e.target.getBoundingClientRect?.() || { left: 0, top: 0, width: size.width, height: size.height };
    const x = ((e.clientX - rect.left) / size.width) * 2 - 1;
    const y = -((e.clientY - rect.top) / size.height) * 2 + 1;
    mouse.set(x, y);

    raycaster.setFromCamera(mouse, camera);
    const intersectPoint = new THREE.Vector3();
    raycaster.ray.intersectPlane(plane, intersectPoint);
    
    if (intersectPoint) {
      onDrag(intersectPoint);
    }
  };

  const handlePointerUp = (e) => {
    setIsDragging(false);
    e.target.releasePointerCapture(e.pointerId);
    if (onDragEnd) onDragEnd();
  };

  return { isDragging, handlePointerDown, handlePointerMove, handlePointerUp };
}

// --- The Draggable Fact Node ---
function FactNode({ position, setPosition, onBreak, isBroken, data }) {
  const meshRef = useRef();
  
  const handleDrag = (pos) => {
    if (isBroken) return;
    const newX = Math.min(pos.x, -2);
    setPosition(new THREE.Vector3(newX, pos.y, 0));
    
    const dist = Math.abs(newX - 6);
    if (dist > 18) {
      onBreak();
    }
  };

  const { isDragging, handlePointerDown, handlePointerMove, handlePointerUp } = useDragNode(handleDrag);

  useFrame(() => {
    if (!isDragging && !isBroken && meshRef.current) {
      meshRef.current.position.lerp(new THREE.Vector3(-6, 2, 0), 0.05);
      setPosition(meshRef.current.position.clone());
    }
  });

  return (
    <group ref={meshRef} position={position}>
      <mesh 
        visible={false} 
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerOut={handlePointerUp}
      >
        <planeGeometry args={[10, 6]} />
        <meshBasicMaterial />
      </mesh>
      
      <Html center style={{ pointerEvents: 'none' }}>
        <div className={`flex flex-col items-center w-64 text-center transition-transform ${isDragging ? 'scale-105' : 'scale-100'} ${isDragging && !isBroken ? 'cursor-grabbing' : 'cursor-grab'}`}>
          <span className="text-white/50 text-[10px] tracking-[0.3em] uppercase mb-2 font-medium">Fact</span>
          <div className={`border px-6 py-4 rounded-xl text-white text-sm font-light w-full shadow-2xl backdrop-blur-md transition-colors duration-500 ${isBroken ? 'bg-white/10 border-white/20' : 'bg-blue-900/20 border-blue-400/40'} ${!isDragging && !isBroken ? 'animate-pulse' : ''}`}>
            {data?.text}
          </div>
          {!isBroken && (
            <div className="absolute -bottom-6 text-white/30 text-[9px] uppercase tracking-widest animate-fade-in-up">
              Drag Me Left
            </div>
          )}
        </div>
      </Html>
    </group>
  );
}

// --- Static Node with Hover Explanation ---
function StaticNode({ type, data, position, colorClass, borderClass, isBroken, isActive }) {
  const groupRef = useRef();
  const [isHovered, setIsHovered] = useState(false);

  return (
    <group ref={groupRef} position={position}>
      {/* Invisible mesh for hover events */}
      <mesh 
        visible={false} 
        onPointerOver={() => setIsHovered(true)}
        onPointerOut={() => setIsHovered(false)}
      >
        <planeGeometry args={[10, 5]} />
        <meshBasicMaterial />
      </mesh>

      <Html center style={{ pointerEvents: 'none' }}>
        <div className="relative">
          <div className={`flex flex-col items-center w-56 text-center transition-all duration-1000 ${isBroken ? 'opacity-30 blur-[1px]' : 'opacity-100'} ${isActive || isHovered ? 'scale-105' : 'scale-100'}`}>
            <span className="text-white/50 text-[10px] tracking-[0.3em] uppercase mb-2 font-medium">{type}</span>
            <div className={`border px-6 py-4 rounded-xl text-white text-sm font-light w-full shadow-2xl backdrop-blur-md transition-all duration-500 ${isBroken ? 'bg-white/5 border-white/10' : `${colorClass} ${borderClass}`} ${isHovered && !isBroken ? 'ring-2 ring-white/30' : ''}`}>
              {data?.text}
            </div>
          </div>
          
          {/* Explanation Tooltip */}
          <div className={`absolute top-full left-1/2 -translate-x-1/2 mt-4 w-64 bg-black/80 border border-white/20 backdrop-blur-xl px-4 py-3 rounded-xl text-white/80 text-[11px] leading-relaxed text-center transition-all duration-300 pointer-events-none z-50 shadow-2xl ${isHovered && !isBroken ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}`}>
            {data?.explanation}
          </div>
        </div>
      </Html>
    </group>
  );
}

// --- Animated Connection Line ---
function AnimatedConnection({ start, end, color = "white", speed = 1, isBroken = false, isTension = false }) {
  const lineRef = useRef();
  const materialRef = useRef();
  
  useFrame(({ clock }) => {
    if (isBroken) return;
    const time = clock.elapsedTime;
    if (materialRef.current) {
      materialRef.current.dashOffset = -time * speed;
    }
  });

  const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
  const dir = new THREE.Vector3().subVectors(end, start).normalize();
  const normal = new THREE.Vector3(-dir.y, dir.x, 0).multiplyScalar(3);
  const control = mid.add(normal);

  return (
    <QuadraticBezierLine
      ref={lineRef}
      start={start}
      end={end}
      mid={control}
      color={color}
      lineWidth={isTension ? 1.5 : 2}
      dashed
      dashScale={20}
      dashSize={2}
      dashOffset={0}
      transparent
      opacity={isBroken ? 0 : (isTension ? 0.3 : 0.8)}
    >
      <lineDashedMaterial ref={materialRef} attach="material" color={color} linewidth={isTension ? 1.5 : 2} dashed dashSize={2} gapSize={4} transparent opacity={isBroken ? 0 : (isTension ? 0.3 : 0.8)} />
    </QuadraticBezierLine>
  );
}

function ThoughtGraph({ appState, setAppState, scenario }) {
  const [factPos, setFactPos] = useState(new THREE.Vector3(-6, 2, 0));
  
  const nodes = {
    interp: new THREE.Vector3(6, 2, 0),
    emotion: new THREE.Vector3(8, -2, 0),
    predict: new THREE.Vector3(0, -5, 0),
    react: new THREE.Vector3(-8, -2, 0)
  };

  const isBroken = appState === 'CALM';
  const tension = Math.max(0, Math.abs(factPos.x - (-6))); 
  const isInteracting = tension > 1 && !isBroken;
  const speed = isBroken ? 0 : (isInteracting ? 0.5 : 2.5); 

  useEffect(() => {
    if (isInteracting && appState === 'RUMINATING') {
      setAppState('INTERACTING');
    } else if (!isInteracting && appState === 'INTERACTING') {
      setAppState('RUMINATING');
    }
  }, [isInteracting, appState, setAppState]);

  const handleBreak = () => {
    setAppState('CALM');
  };

  return (
    <group>
      {/* Nodes */}
      <FactNode position={factPos} setPosition={setFactPos} onBreak={handleBreak} isBroken={isBroken} data={scenario.fact} />
      <StaticNode type="Interpretation" data={scenario.interpretation} position={nodes.interp} colorClass="bg-red-900/20" borderClass="border-red-400/40" isBroken={isBroken} isActive={!isBroken} />
      <StaticNode type="Emotion" data={scenario.emotion} position={nodes.emotion} colorClass="bg-purple-900/20" borderClass="border-purple-400/40" isBroken={isBroken} isActive={!isBroken} />
      <StaticNode type="Prediction" data={scenario.prediction} position={nodes.predict} colorClass="bg-green-900/20" borderClass="border-green-400/40" isBroken={isBroken} isActive={!isBroken} />
      <StaticNode type="Reaction" data={scenario.reaction} position={nodes.react} colorClass="bg-orange-900/20" borderClass="border-orange-400/40" isBroken={isBroken} isActive={!isBroken} />

      {/* Connections */}
      <AnimatedConnection start={factPos} end={nodes.interp} color="#3b82f6" speed={speed} isBroken={isBroken} isTension={isInteracting} />
      <AnimatedConnection start={nodes.interp} end={nodes.emotion} color="#ef4444" speed={speed} isBroken={isBroken} isTension={isInteracting} />
      <AnimatedConnection start={nodes.emotion} end={nodes.predict} color="#a855f7" speed={speed} isBroken={isBroken} isTension={isInteracting} />
      <AnimatedConnection start={nodes.predict} end={nodes.react} color="#22c55e" speed={speed} isBroken={isBroken} isTension={isInteracting} />
      <AnimatedConnection start={nodes.react} end={factPos} color="#f97316" speed={speed} isBroken={isBroken} isTension={isInteracting} />
    </group>
  );
}

export default function LoopBreaker3D({ scenario = defaultScenario, onClose }) {
  const [appState, setAppState] = useState('RUMINATING'); // RUMINATING, INTERACTING, CALM

  const instructions = {
    'RUMINATING': "Click and drag the FACT node away to break the automatic chain.",
    'INTERACTING': "Keep pulling. Notice how the feeling slows down as you separate the fact from the interpretation.",
    'CALM': "The loop is broken."
  };

  return (
    <div className="relative w-full h-screen bg-[#020203] overflow-hidden font-sans select-none">
      <Canvas camera={{ position: [0, 0, 22], fov: 50 }} style={{ touchAction: 'none' }}>
        <ambientLight intensity={0.5} />
        <ThoughtGraph appState={appState} setAppState={setAppState} scenario={scenario} />
      </Canvas>
      
      {/* Top Header */}
      <div className="absolute top-12 left-0 w-full flex flex-col items-center pointer-events-none z-10">
        <h1 className="text-white/90 text-2xl font-light tracking-[0.2em] uppercase mb-3 drop-shadow-lg">
          Breaking the Loop
        </h1>
        <p className="text-white/40 text-sm font-light tracking-wide">
          Let's slow down what happened between the trigger and the reaction.
        </p>
      </div>

      {/* Bottom Context */}
      <div className="absolute bottom-16 left-0 w-full flex flex-col items-center z-10 pointer-events-none transition-opacity duration-1000">
        
        {appState === 'CALM' ? (
          <div className="flex flex-col items-center animate-fade-in-up w-full max-w-lg px-6">
            <p className="text-white/70 text-lg font-light text-center mb-6 leading-relaxed">
              Everything after the fact was your brain trying to predict what it meant.
              <br /><br />
              <span className="text-white/50 text-sm">
                That doesn't make the feeling fake.<br/>
                It means the feeling doesn't automatically make the prediction true.
              </span>
            </p>
            <button 
              onClick={() => {
                if (onClose) onClose();
                else window.location.reload();
              }}
              className="px-10 py-4 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-full tracking-widest text-xs uppercase font-semibold transition-all pointer-events-auto backdrop-blur-md shadow-2xl"
            >
              Continue with Nova
            </button>
          </div>
        ) : (
          <div className="bg-white/5 border border-white/10 backdrop-blur-md px-8 py-4 rounded-2xl animate-fade-in shadow-2xl">
            <p className="text-white/80 text-sm font-medium tracking-wide">
              {instructions[appState]}
            </p>
          </div>
        )}
      </div>
      
      {/* Subtle background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-900/5 rounded-full blur-[120px] pointer-events-none -z-10" />
    </div>
  );
}
