"use client";

import AutoStopVisualizer from "@/app/component/autostop-visualizer";
import NormalVisualizer from "@/app/component/normal-visualizer";
import { useEffect, useState } from "react";

export default function Home() {
  const [activeTabIdx, setActiveTab] = useState(0);
  const [isAudioPermissionGranted, setIsAudioPermissionGranted] =
    useState(false);

  useEffect(() => {
    (async () => {
      try {
        await navigator.mediaDevices.getUserMedia({
          audio: true,
        });

        setIsAudioPermissionGranted(true);
      } catch (e) {
        console.error("Error accessing microphone:", e);
      }
    })();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-100">
      <h1 className="text-3xl font-bold mb-6">[덤보] 마이크 사용 테스트</h1>

      {/* 탭 선택 UI */}
      <div className="flex w-full max-w-2xl mb-4 border-b border-gray-200">
        <button
          onClick={() => setActiveTab(0)}
          className={`py-2 px-4 font-medium text-sm ${
            activeTabIdx === 0
              ? "border-b-2 border-blue-500 text-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          일정 소음 이상부터 인지하게 노멀라이징
        </button>
        <button
          onClick={() => setActiveTab(1)}
          className={`py-2 px-4 font-medium text-sm ${
            activeTabIdx === 1
              ? "border-b-2 border-blue-500 text-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          모든소음 인지
        </button>
      </div>

      {!isAudioPermissionGranted ? (
        <div>마이크 권한이 필요해요</div>
      ) : activeTabIdx === 0 ? (
        <AutoStopVisualizer />
      ) : (
        <NormalVisualizer />
      )}

      <div className="mt-16 w-2xl">
        <h2>체크 리스트</h2>
        <ol>1. 어떠한 기준을 잡고 싶은건지?</ol>
      </div>
    </div>
  );
}
