"use client";
import AutoStopVisualizer from "@/app/component/autostop-visualizer";
import NormalVisualizer from "@/app/component/normal-visualizer";
import { useState } from "react";

export default function Home() {
  const [activeTabIdx, setActiveTab] = useState(0);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-100">
      <h1 className="text-3xl font-bold mb-6">음성 스펙트럼 시각화</h1>

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
          일반적인 시각화
        </button>
        <button
          onClick={() => setActiveTab(1)}
          className={`py-2 px-4 font-medium text-sm ${
            activeTabIdx === 1
              ? "border-b-2 border-blue-500 text-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          마지막 음성 기준으로 딜레이 주면서 자동정지
        </button>
      </div>

      {activeTabIdx === 0 ? <NormalVisualizer /> : <AutoStopVisualizer />}

      <div className="mt-8 w-2xl">
        <h2>체크 리스트</h2>
        <ol>1. 주변 소음에 대한 케이스 (노멀라이징)</ol>
        <ol>2. 마지막 음성을 기준으로 녹음을 중지 시키기?</ol>
      </div>
    </div>
  );
}
