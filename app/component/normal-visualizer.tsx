"use client";
import { createStreamAnalyser, drawCtx } from "@/app/component/visualizer";
import { useEffect, useRef, useState } from "react";

export default function NormalVisualizer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);

  const [isRecording, setIsRecording] = useState(false);

  // 오디오 시각화 설정
  const startRecording = async () => {
    try {
      // 이전 애니메이션 프레임 취소
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }

      // 오디오 컨텍스트 초기화
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext ||
          (window as any).webkitAudioContext)();
      }

      // 마이크 접근 권한 요청
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      const analyser = createStreamAnalyser({
        // 마이크
        stream,
        // AudioContext Web API
        audioContext: audioContextRef.current,
      });

      // 캔버스에 시각화 그리기
      const drawAudioBarAnime = () => {
        drawCtx({
          canvas: canvasRef.current!,
          analyser,
        });

        // 애니메이션 반복
        animationFrameIdRef.current = requestAnimationFrame(drawAudioBarAnime);
      };

      drawAudioBarAnime();
      setIsRecording(true);
    } catch (error) {
      console.error("마이크 접근 에러:", error);
    }
  };

  const stopRecording = () => {
    // 애니메이션 중지
    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
      animationFrameIdRef.current = null;
    }

    setIsRecording(false);
  };

  // 컴포넌트 정리
  useEffect(() => {
    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
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

      <div className="flex gap-4 h-32">
        <button
          onClick={isRecording ? stopRecording : startRecording}
          className={`px-6 py-3 rounded-md font-medium h-12 ${
            isRecording
              ? "bg-red-500 hover:bg-red-600"
              : "bg-blue-500 hover:bg-blue-600"
          } text-white transition-colors`}
        >
          {isRecording ? "마이크 중지" : "마이크 활성화"}
        </button>
      </div>
    </div>
  );
}
