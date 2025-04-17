"use client";
import { createStreamAnalyser } from "@/app/component/visualizer-util";
import { useThrottledValue } from "@/app/hooks/useThrottledValue";
import { cn } from "@/app/utils/cn";
import { useEffect, useRef, useState } from "react";

/**
 * 보정치 값으로 클수록 낮은 소리까지 증폭
 * 0-10 사이의 표시값으로, 내부적으로는 log10 스케일로 변환됨
 * 실제 최대값은 3
 */
const DEFAULT_SENSITIVITY = 5;

export default function NormalizingVisualizer() {
  const [isSpeaking, setIsSpeaking] = useState(false);

  const [soundVal, setSoundVal] = useState(0);
  const [sensitivityDisplay, setSensitivityDisplay] =
    useState(DEFAULT_SENSITIVITY);

  const [debounceSec, setDebounceSec] = useState(3);

  // Convert display value (0-10) to actual sensitivity using log10 scale
  // When slider is at max (10), the actual sensitivity value will be around 3
  const sensitivity = sensitivityDisplay
    ? Number(
        (Math.pow(10, (sensitivityDisplay * Math.log10(30)) / 10) / 10).toFixed(
          2,
        ),
      )
    : 0;

  const sensitivityRef = useRef(sensitivity);
  sensitivityRef.current = sensitivity;

  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 오디오 분석 및 소리 값 설정을 위한 effect
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

  // 말하기 상태 관리를 위한 effect
  useEffect(() => {
    // 소리 값이 0이고 현재 말하고 있는 상태일 때
    if (soundVal === 0 && isSpeaking) {
      if (!silenceTimerRef.current) {
        silenceTimerRef.current = setTimeout(() => {
          setIsSpeaking(false);
          silenceTimerRef.current = null;
        }, debounceSec * 1000);
      }
    }

    // 소리가 감지되면 타이머 초기화 및 말하기 상태 설정
    if (soundVal > 0) {
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }

      if (!isSpeaking) {
        setIsSpeaking(true);
      }
    }

    return () => {
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
    };
  }, [soundVal, isSpeaking, debounceSec]);

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
            음성 감도 조절 ({sensitivityDisplay.toFixed(1)}) [실제값:{" "}
            {sensitivity}]
          </label>
          <button
            onClick={() => setSensitivityDisplay(DEFAULT_SENSITIVITY)}
            className="text-xs py-1 px-2 bg-gray-200 rounded hover:bg-gray-300 transition-colors"
          >
            기본값으로 초기화
          </button>
        </div>

        <input
          id="sensitivity-slider"
          type="range"
          min="0"
          max="10"
          step="0.1"
          value={sensitivityDisplay}
          onChange={(e) => setSensitivityDisplay(parseFloat(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>낮음</span>
          <span>높음</span>
        </div>
      </div>

      <div className="mt-8 w-full max-w-md text-center">
        <h1 className="flex items-center justify-center gap-1 text-base font-medium text-gray-700">
          <input
            value={debounceSec}
            onChange={(e) => setDebounceSec(Number(e.target.value))}
            className="w-14 text-center border border-gray-300 rounded p-1 mx-1 inline-block"
            type="number"
            min="0.1"
            max="10"
            step="0.1"
          />
          초동안 말이 없으면 종료로 바뀝니다.
        </h1>

        <div
          className={cn(
            "mt-2 py-2 px-4 font-medium transition-colors duration-300",
            isSpeaking ? "text-green-700" : " text-red-700",
          )}
        >
          {isSpeaking ? "🎤 말하는중..." : "🛑 종료..."}
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

  // 오디오 데이터 평균값 => 오디오의 대략적인 크기
  const rms = Math.sqrt(sum / bufferLength);

  // 오디오의 볼륨을 0~1 사이의 값으로 정규화
  const normalizedVolume = Number(Math.min(1, rms * sensitivity).toFixed(2));

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
          "absolute rounded-full transition-all duration-300 border-2 size-[150px]",
          soundVal > 0 ? "border-blue-500 border-3" : "border-gray-300",
        )}
        style={{
          opacity: soundVal > 0 ? 0.8 : 0.3,
          transform: `translate3d(0,0,0) scale3d(${1 + soundVal * 2}, ${1 + soundVal * 2}, 1)`,
          WebkitTransform: `translate3d(0,0,0) scale3d(${1 + soundVal * 2}, ${1 + soundVal * 2}, 1)`,
        }}
      />
      <div
        className={cn(
          "absolute rounded-full transition-all duration-150 border-2 size-[100px]",
          soundVal > 0 ? "border-purple-500 border-3" : "border-gray-300",
        )}
        style={{
          opacity: soundVal > 0 ? 0.7 : 0.3,
          transform: `translate3d(0,0,0) scale3d(${1 + soundVal * 1.6}, ${1 + soundVal * 1.6}, 1)`,
          WebkitTransform: `translate3d(0,0,0) scale3d(${1 + soundVal * 1.6}, ${1 + soundVal * 1.6}, 1)`,
        }}
      />

      <div className="text-lg font-bold text-gray-800">
        {(throttledValue * 100).toFixed(0)}
      </div>
    </div>
  );
}
