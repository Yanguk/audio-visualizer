"use client";
import { useEffect, useRef, useState } from "react";

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
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
      if (!mediaStreamRef.current) {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });

        mediaStreamRef.current = stream;
      }

      const analyser = createStreamAnalyser({
        // 마이크
        stream: mediaStreamRef.current,
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
          className="w-full h-auto bg-white rounded-2xl shadow-md"
        />
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

      <div className="mt-8 w-2xl">
        <h2>체크 리스트</h2>
        <ol>1. 주변 소음에 대한 케이스 (노멀라이징)</ol>
        <ol>2. 마지막 음성을 기준으로 녹음을 중지 시키기?</ol>
      </div>
    </div>
  );
}

function drawCtx({
  canvas,
  analyser,
}: {
  canvas: HTMLCanvasElement;
  analyser: AnalyserNode;
}) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // 데이터 배열 설정
  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);

  /** 오디오 데이터 가져오기!! */
  analyser.getByteFrequencyData(dataArray);

  // 캔버스 크기 가져오기
  const width = canvas.width;
  const height = canvas.height;

  // 캔버스 지우기
  ctx.clearRect(0, 0, width, height);

  const barCount = bufferLength / 2; // 표시할 바의 개수 (모든 주파수 데이터 사용)
  const barWidth = width / barCount; // 각 바의 너비
  const barMargin = 2; // 바 사이의 간격

  // 바 그리기
  for (let i = 0; i < barCount; i++) {
    const value = dataArray[i];

    const MAX_ANALYGER_VALUE = 255; // 최대 분석기 값
    const barHeight = (value / MAX_ANALYGER_VALUE) * height;

    const gradient = ctx.createLinearGradient(0, height - barHeight, 0, height);

    // 상단 색상
    gradient.addColorStop(0, `hsl(${210 + (i / barCount) * 50}, 100%, 70%)`);

    // 하단 색상
    gradient.addColorStop(1, `hsl(${240 + (i / barCount) * 50}, 100%, 50%)`);

    // 바 색상 지정하기
    ctx.fillStyle = gradient;

    // 바 그리기
    ctx.fillRect(
      i * barWidth + barMargin / 2,
      height - barHeight,
      barWidth - barMargin,
      barHeight,
    );
  }
}

// 오디오 분석기 설정
function createStreamAnalyser({
  stream,
  audioContext,
}: {
  stream: MediaStream;
  audioContext: AudioContext;
}) {
  const analyser = audioContext.createAnalyser();

  // 주파수 갯수 설정
  analyser.fftSize = 256;

  const source = audioContext.createMediaStreamSource(stream);

  source.connect(analyser);

  return analyser;
}
