import { useEffect, useState } from "react";


const fmtDate = (iso) => {
  const d = new Date(iso);
  const yoil = ["일","월","화","수","목","금","토"][d.getDay()];
  return `${d.getMonth()+1}/${d.getDate()}(${yoil})`;
};


export default function App() {
  // 1) 입력/조회 기본 상태
  const [city, setCity] = useState("");
  const [target, setTarget] = useState("");
  const [loading, setLoading] = useState(false); // 지오코딩 로딩
  const [error, setError] = useState(""); // 지오코딩 에러
  const [coords, setCoords] = useState(null); // {lat, lon, label, country}
  
  // 2) 4단계: 날씨 API 상태
  const [wLoading, setWLoading] = useState(false); // 예보 로딩
  const [wError, setWError] = useState(""); // 예보 에러
  const [current, setCurrent] = useState(null); // 현재 날씨
  const [daily, setDaily] = useState([]); // 5일 예보
  
  const [candidates, setCandidates] = useState([]);
  const [manualPick, setManualPick] = useState(false);
  
  function onPickCandidate(c) {
    setError("");
    setManualPick(true);
    setCoords(c);
    setTarget(c.label);
    setCandidates([]);
  }
  // 3) 제출 핸들러 (입력값 확정 --> target으로 저장)
  const onSubmit = (e) => {
    e.preventDefault();
    const next = city.trim();
    if (next.length < 3) {            // ★ 추가: 3글자 미만이면 막기
      setError("도시명은 3글자 이상 입력해주세요.");
      return;
    }
    setTarget(next);
    // 필요하면 주석 해제해서 입력창 비우기
    // setCity(""); 
  };
  
  // 4) 지오코딩: target이 바뀔 때 좌표 조회 (Open-Meteo, 실패 시 서울 폴백)
  useEffect(() => {
    if (!target) return;

    let cancelled = false; // 언마운트/변경 간 경합 방지

    const fetchGeocoding = async () => {
      // 수동 선택 직후엔 지오코딩 스킵
      if (manualPick) { setManualPick(false); return; }

      setLoading(true);
      setError("");
      setCoords(null);

      try {
        const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
        url.searchParams.set("name", target);
        url.searchParams.set("count", "5");
        url.searchParams.set("language", "ko");
        url.searchParams.set("format", "json");

        const res = await fetch(url.toString());
        if (!res.ok) throw new Error("지오코딩 요청 실패");
        const data = await res.json();

        const list = (data.results || []).map(r => ({
          lat: r.latitude,
          lon: r.longitude,
          label: r.name,
          country: r.country || ""
        }));
        if (!list.length) throw new Error("해당 도시를 찾지 못했습니다.");

        const q = target.toLowerCase();
        const starts = list.filter(i => i.label.toLowerCase().startsWith(q));
        // 앞부분 일치가 없으면 첫 결과 사용
        const pick = starts[0] ?? list[0];

        if (!cancelled) {
          setCoords(pick);
          setError(""); // 성공 시 에러 지우기
        }
      } catch (e) {
        if (!cancelled) {
          // 폴백: 학습 계속 가능하게 서울 좌표
          setError(e.message || "지오코딩 실패: 임시로 서울 좌표 사용");
          setCoords({
            lat: 37.5665,
            lon: 126.9780,
            label: "Seoul",
            country: "KR",
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchGeocoding();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]); // manualPick은 내부에서 즉시 false로 되돌려서 deps에 안 넣어도 돼


  // 5) 예보 호출: coords 준비되면 현재 + 5일 데이터 가져오기
  useEffect(() => {
    if (!coords) return;

    let cancelled = false;
    
    const run = async () => {
      setWLoading(true);
      setWError("");
      setCurrent(null);
      setDaily([]);

      try {
        const url = new URL("https://api.open-meteo.com/v1/forecast");
        url.searchParams.set("latitude", coords.lat);
        url.searchParams.set("longitude", coords.lon);
        url.searchParams.set("timezone", "auto");
        url.searchParams.set(
          "current",
          "temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code"
        );

        url.searchParams.set(
          "daily",
          "temperature_2m_max,temperature_2m_min,weather_code"
        );

        url.searchParams.set("forecast_days", "5");

        const res = await fetch(url.toString());
        if (!res.ok) throw new Error("예보 API 실패");
        const w = await res.json();

        if (!cancelled) {
          setCurrent({
            temp: w.current?.temperature_2m,
            feels: w.current?.apparent_temperature,
            rh: w.current?.relative_humidity_2m,
            wind: w.current?.wind_speed_10m,
            code: w.current?.weather_code,
          });

        const list = (w.daily?.time || []).map((d, i) => ({
          date: d,
          label: fmtDate(d), // ← 보기 좋은 날짜(요일 포함)
          tmin: w.daily?.temperature_2m_min?.[i],
          tmax: w.daily?.temperature_2m_max?.[i],
          code: w.daily?.weather_code?.[i],
        }));

          setDaily(list);
        }
      } catch (e) {
        if (!cancelled) setWError(e.message || "예보를 불러오지 못했습니다." );
      } finally {
        if (!cancelled) setWLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [coords]);
  
  // [추가] 자동완성 후보 가져오기
  useEffect(() => {
    const name = city.trim();
    if (name.length < 3) { setCandidates([]); return;}

    const t = setTimeout(async () => {
      try {
        const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
        url.searchParams.set("name", name);
        url.searchParams.set("count", 5);
        url.searchParams.set("language", "ko");
        url.searchParams.set("format", "json");
        
        const res = await fetch(url.toString());
        if (!res.ok) throw new Error("지오코딩 요청 실패");
        const data = await res.json();

        const items = (data.results || []).map(r => ({
          lat: r.latitude,
          lon: r.longitude,
          label: r.name,
          country: r.country || "",
          code: r.country_code || "",
          detail: [r.admin1, r.admin2, r.country].filter(Boolean).join(" / "),
        }));
        setCandidates(items);
        } catch (e) {
          console.error(e); // 디버그용
          setCandidates([]);
        }
    }, 300);
    
    return () => clearTimeout(t);
  }, [city]);

  // 6) 렌더
  return (
    <div className="app-wrap">
      <h1>날씨를 알아보자</h1>

      {/* 입력/조회 영역 */}
      <form onSubmit={onSubmit} style={{marginTop: 20}}>        
        <div style={{ position: "relative" }}>
          <input
            placeholder="도시명을 입력 (예: Seoul, Tokyo, Paris)"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            style={{ width: "100%"}}
          />

        {/* [추가] 자동완성 목록 / 절대 배치 */}
        {candidates.length > 0 && (
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top : "100%",
              marginTop: 6,
              border: "1px solid #b1c8ffff",
              borderRadius: 8,
              padding: 6,
              background: "rgba(221, 240, 255, 0.93)",
              maxHeight: "40vh",
              overflowY: "auto",
              zIndex: 10,
            }}
          >
            {candidates.map((c) => (
              <button
                key={`${c.label}-${c.lat}-${c.lon}`}
                onClick={() => onPickCandidate(c)}
                style={{
                  display: "block",
                  width: "100%",
                  boxSizing: "border-box",
                  textAlign: "left",
                  padding: "6px 8px",
                  border: "1px solid #b1c8ffff",
                  borderRadius:6,
                  background: "transparent",
                  cursor: "pointer",
                  marginBottom: 6,
                }}
              >
                <strong style={{ color: "#000"}}>{c.label}</strong>
                {c.country ? <span style={{color: "#000"}}>, {c.country}</span> : ""}
                {/* {c.country ? <span style={{ color: "#000"}}> ({c.country})</span> : ""} */}
                {c.code ? <span style={{ color: "#000"}}> ({c.code})</span> : ""}
                {c.detail ? <span style={{ color: "#727272ff"}}> — {c.detail}</span> : null}
              </button>
            ))}
          </div>
      )}
    </div>

    <button type="submit" style={{ marginTop: 6}}>
    조회
    </button>
  </form>

      {/* 상태 미리보기 */}
      <div style={{ marginTop: 8 }}>
        <p>
          입력 중: <strong>{city || "없음"}</strong>
        </p>
        <p>
          조회 대상: <strong>{target || "미정"}</strong>
        </p>
      </div>

      {/* 지오코딩 상태 */}
      <div style={{ marginTop: 8 }}>
        {loading && <p>위치 찾는 중...</p>}
        {error && <p style={{ color: "crimson" }}>{error}</p>}
        {coords && !loading && (
          <div
            style={{
              marginTop: 8,
              padding: "1px 8px",
              border: "1px solid #b1c8ffff",
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
  
      {/* [추가] 날씨/예보 표시 */}
      <div style={{ marginTop: 8}}>
        {wLoading && <p>날씨 불러오는 중...</p>}
        {wError && <p style={{ color: "crimson"}}>{wError}</p>}

        {current && !wLoading && !wError && (
          <div
            style={{
              marginTop: 8,
              padding: "1px 8px",
              border: "1px solid #b1c8ffff",
              borderRadius: 12,
            }}
          >
            <p>
              현재기온: <strong>
                {current.temp != null ? Math.round(current.temp) + "°C" : "-"}
              </strong>
            </p>
            <p>
              체감: {current.feels != null ? Math.round(current.feels) + "°" : "-"} / 
              습도: {current.rh != null ? current.rh + "%" : "-"} / 
              바람: {current.wind != null ? current.wind + " m/s" : "-"}
            </p>
          </div>
        )}

        {daily.length > 0 && !wLoading && !wError && (
          <div
            style={{
              marginTop: 8,
              padding: "1px 8px",
              border: "1px solid #b1c8ffff",
              borderRadius: 12,
            }}
          >
            <p>
              <strong>5일 예보</strong>
            </p>
            <ul>
              {daily.map((d) => (
                  <li key={d.date}>
                {d.label} - {Math.round(d.tmin)}° / {Math.round(d.tmax)}°
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>    
    </div>
  );
}