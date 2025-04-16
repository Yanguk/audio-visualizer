"use client";
import { createStreamAnalyser } from "@/app/component/visualizer";
import { useThrottledValue } from "@/app/hooks/useThrottledValue";
import { cn } from "@/app/utils/cn";
import { useEffect, useRef, useState } from "react";

/** 보정치 값으로 클수록 낮은 소리까지 증폭 */
const DEFAULT_SENSITIVITY = 5;

export default function AutoStopVisualizer() {
  const [soundVal, setSoundVal] = useState(0);
  const [sensitivity, setSensitivity] = useState(DEFAULT_SENSITIVITY);

  const sensitivityRef = useRef(sensitivity);

  sensitivityRef.current = sensitivity;

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
        const normalizedVolume = normalizeVolume({
          analyser,
          sensitivity: sensitivityRef.current,
        });

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

      <div className="w-full max-w-md">
        <div className="mb-2 flex justify-between items-center">
          <label
            htmlFor="sensitivity-slider"
            className="text-sm font-medium text-gray-700"
          >
            음성 감도 조절 ({sensitivity.toFixed(1)})
          </label>
          <button
            onClick={() => setSensitivity(DEFAULT_SENSITIVITY)}
            className="text-xs py-1 px-2 bg-gray-200 rounded hover:bg-gray-300 transition-colors"
          >
            기본값으로 초기화
          </button>
        </div>

        <input
          id="sensitivity-slider"
          type="range"
          min="1"
          max="10"
          step="0.1"
          value={sensitivity}
          onChange={(e) => setSensitivity(parseFloat(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>낮음</span>
          <span>높음</span>
        </div>
      </div>
    </div>
  );
}

function normalizeVolume({
  analyser,
  sensitivity,
}: {
  analyser: AnalyserNode;
  sensitivity: number;
}) {
  // 데이터 배열 설정
  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Float32Array(bufferLength);

  analyser.getFloatTimeDomainData(dataArray);

  const sum = dataArray.reduce((acc, value) => acc + value * value, 0);

  // 오디오 데이터 평균값 > 오디오의 대략적인 크기
  const rms = Math.sqrt(sum / bufferLength);

  // 오디오의 볼륨을 0~1 사이의 값으로 정규화
  const normalizedVolume = Math.min(1, rms * sensitivity);

  return normalizedVolume;
}

interface AudioCircleProps {
  soundVal: number;
}

function AudioCircle({ soundVal }: AudioCircleProps) {
  const throttledValue = useThrottledValue(soundVal, 500);

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
