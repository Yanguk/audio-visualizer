export function drawCtx({
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
export function createStreamAnalyser({
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
