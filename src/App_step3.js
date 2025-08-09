import { useEffect, useState } from "react";

export default function App() {
  // 입력 중인 값
  const [city, setCity] = useState("");

  // 조회로 확정된 값
  const [target, setTarget] = useState("");

  // API 호출 상태값들
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [coords, setCoords] = useState(null); // {lat, lon, label, country}

  // 폼 제출 시 target 확정
  const onSubmit = (e) => {
    e.preventDefault();
    const next = city.trim();
    if (!next) return;
    setTarget(next);
    // setCity(""); // 필요하면 주석 해제해서 입력창 비우기
  };

  // target이 바뀔 때마다 지오코딩 API 호출
  useEffect(() => {
    if (!target) return;

    let cancelled = false; // 언마운트/변경 간 경합 방지
    const fetchGeocoding = async () => {
      setLoading(true);
      setError("");
      setCoords(null);

      try {
        const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
        url.searchParams.set("name", target);
        url.searchParams.set("count", "1");
        url.searchParams.set("language", "ko");
        url.searchParams.set("format", "json");

        const res = await fetch(url.toString());
        if (!res.ok) throw new Error("지오코딩 요청 실패");
        const data = await res.json();

        if (!data.results || data.results.length === 0) {
          throw new Error("해당 도시를 찾지 못했습니다.");
        }

        const { latitude, longitude, name, country } = data.results[0];

        if (!cancelled) {
          setCoords({
            lat: latitude,
            lon: longitude,
            label: name,
            country: country || "",
          });
        }
      } catch (e) {
        if (!cancelled) {
          setError(e.message || "문제가 발생했습니다.");
          setCoords({
            lat: 37.5665,
            lon: 126.978,
            label: "Seoul",
            country: "KR",
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchGeocoding();

    return () => {
      cancelled = true;
    };
  }, [target]);

  return (
    <div style={{ padding: 20, maxWidth: 520 }}>
      <h1>Weather Mini - 3단계: 지오코딩</h1>

      {/* 입력/조회 영역 */}
      <form onSubmit={onSubmit}>
        <input
          placeholder="도시명을 입력 (예: Seoul, Tokyo, Paris)"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          style={{ width: "100%", padding: 8, fontSize: 16 }}
        />
        <button type="submit" style={{ marginTop: 8, padding: 8 }}>
          조회
        </button>
      </form>

      {/* 상태 미리보기 */}
      <div style={{ marginTop: 12 }}>
        <p>
          입력 중: <strong>{city || "없음"}</strong>
        </p>
        <p>
          조회 대상: <strong>{target || "미정"}</strong>
        </p>
      </div>

      {/* 로딩/에러/결과 */}
      <div style={{ marginTop: 16 }}>
        {loading && <p>위치 찾는 중...</p>}
        {error && <p style={{ color: "crimson" }}>{error}</p>}
        {coords && !loading && !error && (
          <div
            style={{
              marginTop: 8,
              padding: 12,
              border: "1px solid #eee",
              borderRadius: 12,
            }}
          >
            <p>
              도시: <strong>{coords.label}</strong>
              {coords.country ? `, ${coords.country}` : ""}
            </p>
            <p>위도: {coords.lat}</p>
            <p>경도: {coords.lon}</p>
          </div>
        )}
      </div>
    </div>
  );
}