"use client";
import { createStreamAnalyser } from "@/app/component/visualizer";
import { useThrottledValue } from "@/app/hooks/useThrottledValue";
import { cn } from "@/app/utils/cn";
import { useEffect, useRef, useState } from "react";

/** 보정치 값으로 클수록 낮은 소리까지 증폭 */
const NORMALIZE_SENSITIVITY = 3;

export default function AutoStopVisualizer() {
  const [soundVal, setSoundVal] = useState(0);

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
        const normalizedVolume = normalizeVolume({ analyser });

        setSoundVal(normalizedVolume);

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
      <div className="w-full max-w-2xl mb-6 h-[300px] flex items-center justify-center">
        <div className="flex flex-col items-center justify-center">
          <AudioCircle soundVal={soundVal} />
        </div>
      </div>
    </div>
  );
}

function normalizeVolume({
  analyser,
  sensitivity = NORMALIZE_SENSITIVITY,
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

interface AudioCircleProps {
  soundVal: number;
}

function AudioCircle({ soundVal }: AudioCircleProps) {
  const throttledValue = useThrottledValue(soundVal, 1000);

  return (
    <div className="relative flex items-center justify-center overflow-visible">
      <div
        className={cn(
          "absolute rounded-full transition-all duration-300 border-2",
          soundVal > 0 ? "border-blue-500 border-3" : "border-gray-300",
        )}
        style={{
          width: `${100 + soundVal * 150}px`,
          height: `${100 + soundVal * 150}px`,
          opacity: soundVal > 0 ? 0.8 : 0.3,
          transform: `scale(${1 + soundVal * 1.6})`,
        }}
      />

      <div
        className={cn(
          "absolute rounded-full transition-all duration-150 border-2",
          soundVal > 0 ? "border-purple-500 border-3" : "border-gray-300",
        )}
        style={{
          width: `${60 + soundVal * 120}px`,
          height: `${60 + soundVal * 120}px`,
          opacity: soundVal > 0 ? 0.7 : 0.3,
          transform: `scale(${1 + soundVal * 1.2})`,
        }}
      />

      <div className="text-lg font-bold text-gray-800">
        {(throttledValue * 100).toFixed(0)}
      </div>
    </div>
  );
}
