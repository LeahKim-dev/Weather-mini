import { useState } from "react";

// 1) 상태(state) 만들기: 컴포넌트가 기억할 값
export default function App() {
  // 2) city: 상태값, setCity: 그 값을 바꾸는 함수
  const [city, setCity] = useState("");

  // 3) 입력 이벤트 핸들러: 입력창의 값이 바뀔 때 실행
  const onChangeCity = (e) => {
    setCity(e.target.value); // 4) 상태를 바꾸면 리액트가 다시 렌더링
  };

  // 5) JSX: 화면에 그릴 UI
  return (
    <div style={{ padding: 20, maxWidth: 480 }}>
      <h1>Weather Mini – 1단계</h1>

      <input
        placeholder="도시명을 입력 (예: Seoul)"
        value={city} // 6) 입력값의 '진실'을 상태 city에 둔다 (Controlled input)
        onChange={onChangeCity} // 7) 타이핑 때마다 onChangeCity 실행 → setCity 호출
        style={{ width: "100%", padding: 8, fontSize: 16 }}
      />

      {/* 8) 상태 확인: 현재 city 값을 화면에 바로 보여줌 */}
      <p style={{ marginTop: 12 }}>
        현재 입력값: <strong>{city || "없음"}</strong>
      </p>
    </div>
  );
}