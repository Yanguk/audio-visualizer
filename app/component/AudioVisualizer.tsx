"use client";
import { createStreamAnalyser, drawCtx } from "@/app/component/visualizer-util";
import { useEffect, useRef } from "react";

export default function AudioVisualizer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 오디오 시각화 설정
  useEffect(() => {
    let frameId: number | null = null;

    (async () => {
      const audioContext = new AudioContext();

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      const analyser = createStreamAnalyser({
        stream,
        audioContext,
      });

      const onframe = () => {
        if (canvasRef.current) {
          drawCtx({
            canvas: canvasRef.current,
            analyser,
          });
        }

        frameId = requestAnimationFrame(onframe);
      };

      onframe();
    })();

    return () => {
      frameId && cancelAnimationFrame(frameId);
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center size-full">
      <div className="w-full max-w-2xl mb-6">
        <canvas
          ref={canvasRef}
          width={800}
          height={300}
          className="w-full h-auto bg-white rounded-2xl shadow-md"
        />
      </div>
    </div>
  );
}
