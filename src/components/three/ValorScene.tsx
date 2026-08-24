"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

/**
 * Objeto 3D do Hero — uma representação abstrata de "valor":
 * um núcleo metálico escuro, uma casca geométrica verde-limão e anéis em órbita.
 *
 * Restrições assumidas: nada de texturas externas, poucas luzes, geometria
 * de baixa contagem e resposta suave ao cursor. Sob movimento reduzido a cena
 * é renderizada uma única vez, parada.
 */

type SceneProps = { reduceMotion: boolean };

const LIME = "#b7ff00";


/**
 * Ambiente procedural.
 *
 * Metal sem mapa de ambiente renderiza preto — em vez de carregar um HDRI,
 * o gradiente equirretangular é pintado em um canvas e passado pelo PMREM.
 * Custo: alguns kilobytes de memória, nenhuma requisição de rede.
 */
function ProceduralEnvironment() {
  const { gl, scene, invalidate } = useThree();

  useEffect(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 256;
    const context = canvas.getContext("2d");
    if (!context) return;

    const sky = context.createLinearGradient(0, 0, 0, 256);
    sky.addColorStop(0, "#4d5a55");
    sky.addColorStop(0.42, "#171d1a");
    sky.addColorStop(1, "#050505");
    context.fillStyle = sky;
    context.fillRect(0, 0, 512, 256);

    // Faixa verde-limão: o recorte que aparece nas bordas do metal.
    const rim = context.createLinearGradient(0, 96, 0, 168);
    rim.addColorStop(0, "rgba(183,255,0,0)");
    rim.addColorStop(0.5, "rgba(183,255,0,0.55)");
    rim.addColorStop(1, "rgba(183,255,0,0)");
    context.fillStyle = rim;
    context.fillRect(0, 96, 512, 72);

    // Fonte de luz principal, para o brilho especular.
    const key = context.createRadialGradient(150, 60, 4, 150, 60, 90);
    key.addColorStop(0, "rgba(255,255,255,0.95)");
    key.addColorStop(1, "rgba(255,255,255,0)");
    context.fillStyle = key;
    context.fillRect(60, 0, 180, 150);

    const texture = new THREE.CanvasTexture(canvas);
    texture.mapping = THREE.EquirectangularReflectionMapping;
    texture.colorSpace = THREE.SRGBColorSpace;

    const pmrem = new THREE.PMREMGenerator(gl);
    const target = pmrem.fromEquirectangular(texture);
    scene.environment = target.texture;
    // Sob frameloop "demand" o ambiente chega depois do primeiro quadro.
    invalidate();

    return () => {
      scene.environment = null;
      target.dispose();
      pmrem.dispose();
      texture.dispose();
    };
  }, [gl, invalidate, scene]);

  return null;
}

function Core({ reduceMotion }: SceneProps) {
  const group = useRef<THREE.Group>(null);
  const shell = useRef<THREE.LineSegments>(null);
  const pointer = useRef(new THREE.Vector2());
  const { invalidate } = useThree();

  const shellGeometry = useMemo(() => {
    const base = new THREE.IcosahedronGeometry(1.62, 1);
    const wire = new THREE.WireframeGeometry(base);
    base.dispose();
    return wire;
  }, []);

  useFrame((state, delta) => {
    if (reduceMotion) return;
    const t = state.clock.elapsedTime;

    // O ponteiro só inclina o conjunto; nunca o arrasta para fora do quadro.
    pointer.current.lerp(state.pointer, 0.045);

    if (group.current) {
      group.current.rotation.y += delta * 0.14;
      group.current.rotation.x = THREE.MathUtils.lerp(
        group.current.rotation.x,
        pointer.current.y * -0.22,
        0.06,
      );
      group.current.rotation.z = THREE.MathUtils.lerp(
        group.current.rotation.z,
        pointer.current.x * 0.12,
        0.06,
      );
      group.current.position.y = Math.sin(t * 0.55) * 0.09;
      group.current.position.x = THREE.MathUtils.lerp(
        group.current.position.x,
        pointer.current.x * 0.16,
        0.05,
      );
    }

    if (shell.current) {
      shell.current.rotation.y -= delta * 0.24;
      shell.current.rotation.x += delta * 0.06;
    }

    invalidate();
  });

  return (
    <group ref={group}>
      {/* Núcleo metálico */}
      <mesh castShadow={false} receiveShadow={false}>
        <sphereGeometry args={[1.12, 64, 48]} />
        <meshStandardMaterial
          color="#5a6560"
          metalness={1}
          roughness={0.24}
          envMapIntensity={1.5}
        />
      </mesh>

      {/* Casca geométrica em verde-limão */}
      <lineSegments ref={shell} geometry={shellGeometry}>
        <lineBasicMaterial color={LIME} transparent opacity={0.32} />
      </lineSegments>

      {/* Anéis em órbita: a leitura financeira do ciclo */}
      <mesh rotation={[Math.PI / 2.35, 0, 0.42]}>
        <torusGeometry args={[2.05, 0.008, 12, 160]} />
        <meshBasicMaterial color={LIME} transparent opacity={0.62} />
      </mesh>
      <mesh rotation={[Math.PI / 1.7, 0.5, -0.3]}>
        <torusGeometry args={[2.42, 0.005, 10, 160]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.16} />
      </mesh>

      {/* Marcador em órbita — o ponto de valor */}
      <mesh position={[2.05, 0, 0]}>
        <sphereGeometry args={[0.055, 20, 20]} />
        <meshBasicMaterial color={LIME} />
      </mesh>
    </group>
  );
}

function Dust({ reduceMotion }: SceneProps) {
  const points = useRef<THREE.Points>(null);

  const geometry = useMemo(() => {
    const count = 220;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      const radius = 2.8 + Math.random() * 2.6;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.cos(phi) * 0.55;
      positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return geo;
  }, []);

  useFrame((_, delta) => {
    if (reduceMotion || !points.current) return;
    points.current.rotation.y += delta * 0.035;
  });

  return (
    <points ref={points} geometry={geometry}>
      <pointsMaterial color={LIME} size={0.022} transparent opacity={0.5} sizeAttenuation />
    </points>
  );
}

export default function ValorScene({ reduceMotion }: SceneProps) {
  return (
    <Canvas
      camera={{ position: [0, 0.2, 6.2], fov: 42 }}
      dpr={[1, 1.75]}
      // Sob movimento reduzido a cena é desenhada uma vez e para.
      frameloop={reduceMotion ? "demand" : "always"}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      style={{ background: "transparent" }}
    >
      <ProceduralEnvironment />
      <ambientLight intensity={0.22} />
      {/* Luz principal fria + recorte verde-limão nas bordas do metal. */}
      <directionalLight position={[4, 5, 4]} intensity={1.8} color="#ffffff" />
      <pointLight position={[-4, -1.5, 2.5]} intensity={18} color={LIME} distance={14} />
      <pointLight position={[2.5, -3, -3]} intensity={12} color="#5a7a00" distance={16} />
      <Core reduceMotion={reduceMotion} />
      <Dust reduceMotion={reduceMotion} />
    </Canvas>
  );
}
