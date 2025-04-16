"use client";
import { createStreamAnalyser, drawCtx } from "@/app/component/visualizer";
import { useEffect, useRef, useState } from "react";

export default function AutoStopVisualizer() {
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);

  const isRecording = !!analyser;

  // 오디오 시각화 설정
  const startRecording = async () => {
    // 마이크 접근 권한 요청
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
    });

    const audioContext = new AudioContext();

    const analyser = createStreamAnalyser({
      stream,
      audioContext,
    });

    setAnalyser(analyser);
  };

  const stopRecording = () => {
    setAnalyser(null);
  };

  return (
    <div className="flex flex-col items-center justify-center size-full">
      <div className="w-full max-w-2xl mb-6 h-[300px] flex items-center justify-center">
        {analyser ? <Indicator analyser={analyser} /> : "중지"}
      </div>

      <div className="flex gap-4 h-32 flex-col items-center">
        <h3>3 초후에 마지막 음성 기준 으로 3초뒤 중지</h3>

        <button
          onClick={isRecording ? stopRecording : startRecording}
          className={`px-6 py-3 rounded-md font-medium ${
            isRecording
              ? "bg-red-500 hover:bg-red-600"
              : "bg-blue-500 hover:bg-blue-600"
          } text-white transition-colors h-12`}
        >
          {isRecording ? "중지" : "시작"}
        </button>
      </div>
    </div>
  );
}

function Indicator({ analyser }: { analyser: AnalyserNode }) {
  const [soundVal, setSoundVal] = useState(0);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const onframe = () => {
      const normalizedVolume = normalizeVolume({ analyser });

      setSoundVal(normalizedVolume);

      frameRef.current = requestAnimationFrame(onframe);
    };

    onframe();

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [analyser]);

  // 원형 오디오 시각화 그리기

  return <div>{soundVal}</div>;
}

function normalizeVolume({
  analyser,
  /** 보정치 값으로 클수록 낮은 소리까지 증폭 */
  sensitivity = 2,
}: {
  analyser: AnalyserNode;
  sensitivity?: number;
}) {
  // 데이터 배열 설정
  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Float32Array(bufferLength);

  // 오디오의 볼륨을 0~1 사이의 값으로 정규화
  analyser.getFloatTimeDomainData(dataArray);

  const sum = dataArray.reduce((acc, value) => acc + value * value, 0);

  // 오디오 데이터 평균값 > 오디오의 대략적인 크기
  const rms = Math.sqrt(sum / bufferLength);

  // 증폭치 조절 (소수점 둘째 자리까지 제한)
  const normalizedVolume = Number(Math.min(1, rms * sensitivity).toFixed(2));

  return normalizedVolume;
}
