"use client";
import { useEffect, useRef, useState } from "react";

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isRecording, setIsRecording] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);

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
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      // 오디오 분석기 설정
      const audioContext = audioContextRef.current;
      const analyser = audioContext.createAnalyser();
      analyserRef.current = analyser;
      analyser.fftSize = 256;
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      setIsRecording(true);

      // 애니메이션 시작
      draw();
    } catch (error) {
      console.error("마이크 접근 에러:", error);
    }
  };

  const stopRecording = () => {
    // 스트림 중지
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
    }

    // 애니메이션 중지
    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
      animationFrameIdRef.current = null;
    }

    setIsRecording(false);
  };

  // 캔버스에 시각화 그리기
  const draw = () => {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;

    if (!canvas || !analyser) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 캔버스 크기 설정
    const width = canvas.width;
    const height = canvas.height;

    // 데이터 배열 설정
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    // 오디오 데이터 가져오기
    analyser.getByteFrequencyData(dataArray);

    // 캔버스 지우기
    ctx.clearRect(0, 0, width, height);

    // 바 형태로 그리기
    const drawBars = () => {
      const barCount = bufferLength / 2; // 표시할 바의 개수 (모든 주파수 데이터 사용)
      const barWidth = width / barCount; // 각 바의 너비
      const barMargin = 2; // 바 사이의 간격

      // 바 그리기
      for (let i = 0; i < barCount; i++) {
        // 데이터 값에 따라 바의 높이 계산 (0-255 범위의 값을 캔버스 높이에 맞게 조정)
        const value = dataArray[i];
        const barHeight = (value / 255) * height;

        // 주파수에 따른 색상 계산 (낮은 주파수는 파란색, 높은 주파수는 빨간색)
        const hue = (i / barCount) * 200; // 파란색(240)에서 빨간색(0)으로 변경

        // 바 그리기
        ctx.fillStyle = `hsl(${240 - hue}, 100%, 50%)`;
        ctx.fillRect(
          i * barWidth + barMargin / 2,
          height - barHeight,
          barWidth - barMargin,
          barHeight,
        );
      }
    };

    drawBars();

    // 애니메이션 반복
    animationFrameIdRef.current = requestAnimationFrame(draw);
  };

  // 컴포넌트 정리
  useEffect(() => {
    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }

      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-100">
      <h1 className="text-3xl font-bold mb-6">음성 스펙트럼 시각화</h1>
      <div className="w-full max-w-2xl mb-6">
        <canvas
          ref={canvasRef}
          width={800}
          height={300}
          className="w-full h-auto bg-white rounded-md shadow-md"
        ></canvas>
      </div>
      <div className="flex gap-4">
        <button
          onClick={isRecording ? stopRecording : startRecording}
          className={`px-6 py-3 rounded-md font-medium ${
            isRecording
              ? "bg-red-500 hover:bg-red-600"
              : "bg-blue-500 hover:bg-blue-600"
          } text-white transition-colors`}
        >
          {isRecording ? "녹음 중지" : "마이크 활성화"}
        </button>
      </div>
    </div>
  );
}
