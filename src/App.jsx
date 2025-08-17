import { useEffect, useState } from "react";

// 유틸리티 함수
const formatDate = (iso) => {
  const date = new Date(iso);
  const dayNames = ["일", "월", "화", "수", "목", "금", "토"];
  const dayName = dayNames[date.getDay()];
  return `${date.getMonth() + 1}/${date.getDate()}(${dayName})`;
};

const getWeatherEmoji = (weatherCode) => {
  if (!weatherCode) return "🌫️";

  const code = parseInt(weatherCode);

  if (code === 0) return "☀️";
  if (code === 1) return "🌤️";
  if (code === 2) return "⛅";
  if (code === 3) return "🌥️";
  if (code >= 45 && code <= 48) return "🌫️";
  if (code >= 51 && code <= 55) return "🌧️";
  if (code >= 61 && code <= 65) return "🌦️";
  if (code >= 66 && code <= 68) return "❄️";
  if (code >= 71 && code <= 75) return "🌨️";
  if (code >= 80 && code <= 82) return "🌧️";
  if (code >= 85 && code <= 86) return "🌨️";
  if (code >= 95 && code <= 99) return "⛈️";

  return "🌫️"; // 기본값
}

// API 관련 상수
const GEOCODING_API_URL = "https://geocoding-api.open-meteo.com/v1/search";
const WEATHER_API_URL = "https://api.open-meteo.com/v1/forecast";
const MIN_CITY_LENGTH = 3;
const AUTOCOMPLETE_DELAY = 300;

// 서울 좌표 (폴백용)
const SEOUL_COORDS = {
  lat: 37.5665,
  lon: 126.9780,
  label: "Seoul",
  country: "KR",
};

export default function App() {
  // 입력 상태
  const [city, setCity] = useState("");
  const [target, setTarget] = useState("");
  
  // 지오코딩 상태
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [coords, setCoords] = useState(null);
  
  // 날씨 상태
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState("");
  const [currentWeather, setCurrentWeather] = useState(null);
  const [dailyForecast, setDailyForecast] = useState([]);
  
  // 자동완성 상태
  const [candidates, setCandidates] = useState([]);
  const [isManualSelection, setIsManualSelection] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  // 후보 선택 핸들러
  const handleCandidateSelect = (candidate) => {
    setError("");
    setIsManualSelection(true);
    setCoords(candidate);
    setTarget(candidate.label);
    setCandidates([]);
    setSelectedIndex(-1);
  };

  // 키보드 네비게이션 핸들러
  const handleKeyDown = (e) => {
    if (candidates.length == 0 ) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev =>
          prev < candidates.length - 1 ? prev + 1 : 0
        );
        break;

      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev =>
          prev > 0 ? prev - 1 : candidates.length - 1
        );
        break;

      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && candidates[selectedIndex]) {
          handleCandidateSelect(candidates[selectedIndex]);
        } else {
          const trimmedCity = city.trim();
          if (trimmedCity.length >= MIN_CITY_LENGTH) {
            setTarget(trimmedCity);
            setCandidates([]);
            setSelectedIndex(-1);
          }
        }
        break;

      case 'Escape':
        setCandidates([]);
        setSelectedIndex(-1);
        break;
    }
  };
  // 폼 제출 핸들러
  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmedCity = city.trim();
    
    if (trimmedCity.length < MIN_CITY_LENGTH) {
      setError("도시명은 3글자 이상 입력해주세요.");
      return;
    }
    
    setTarget(trimmedCity);
  };

  // 지오코딩 API 호출
  const fetchGeocoding = async (cityName) => {
    const url = new URL(GEOCODING_API_URL);
    url.searchParams.set("name", cityName);
    url.searchParams.set("count", "5");
    url.searchParams.set("language", "ko");
    url.searchParams.set("format", "json");

    const response = await fetch(url.toString());
    if (!response.ok) throw new Error("지오코딩 요청 실패");
    
    return response.json();
  };

  // 날씨 API 호출
  const fetchWeather = async (coordinates) => {
    const url = new URL(WEATHER_API_URL);
    url.searchParams.set("latitude", coordinates.lat);
    url.searchParams.set("longitude", coordinates.lon);
    url.searchParams.set("timezone", "auto");
    url.searchParams.set("forecast_days", "14");
    url.searchParams.set(
      "current",
      "temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code"
    );
    url.searchParams.set(
      "daily",
      "temperature_2m_max,temperature_2m_min,weather_code"
    );

    const response = await fetch(url.toString());
    if (!response.ok) throw new Error("예보 API 실패");
    
    return response.json();
  };

  // 지오코딩 효과
  useEffect(() => {
    if (!target) return;

    let isCancelled = false;

    const performGeocoding = async () => {
      // 수동 선택 직후엔 지오코딩 스킵
      if (isManualSelection) {
        setIsManualSelection(false);
        return;
      }

      setLoading(true);
      setError("");
      setCoords(null);

      try {
        const data = await fetchGeocoding(target);
        
        const locations = (data.results || []).map(result => ({
          lat: result.latitude,
          lon: result.longitude,
          label: result.name,
          country: result.country || ""
        }));

        if (!locations.length) {
          throw new Error("해당 도시를 찾지 못했습니다.");
        }

        // 입력값과 가장 유사한 결과 선택
        const query = target.toLowerCase();
        const exactMatch = locations.filter(location => 
          location.label.toLowerCase().startsWith(query)
        );
        const selectedLocation = exactMatch[0] || locations[0];

        if (!isCancelled) {
          setCoords(selectedLocation);
          setError("");
        }
      } catch (err) {
        if (!isCancelled) {
          setError(err.message || "지오코딩 실패: 임시로 서울 좌표 사용");
          setCoords(SEOUL_COORDS);
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    performGeocoding();
    return () => { isCancelled = true; };
  }, [target, isManualSelection]);

  // 날씨 조회 효과
  useEffect(() => {
    if (!coords) return;

    let isCancelled = false;

    const fetchWeatherData = async () => {
      setWeatherLoading(true);
      setWeatherError("");
      setCurrentWeather(null);
      setDailyForecast([]);

      try {
        const weatherData = await fetchWeather(coords);

        if (!isCancelled) {
          // 현재 날씨 설정
          setCurrentWeather({
            temp: weatherData.current?.temperature_2m,
            feels: weatherData.current?.apparent_temperature,
            humidity: weatherData.current?.relative_humidity_2m,
            wind: weatherData.current?.wind_speed_10m,
            code: weatherData.current?.weather_code,
          });

          // 일기 예보 설정
          const forecast = (weatherData.daily?.time || []).map((date, index) => ({
            date,
            label: formatDate(date),
            tempMin: weatherData.daily?.temperature_2m_min?.[index],
            tempMax: weatherData.daily?.temperature_2m_max?.[index],
            code: weatherData.daily?.weather_code?.[index],
          }));

          setDailyForecast(forecast);
        }
      } catch (err) {
        if (!isCancelled) {
          setWeatherError(err.message || "예보를 불러오지 못했습니다.");
        }
      } finally {
        if (!isCancelled) {
          setWeatherLoading(false);
        }
      }
    };

    fetchWeatherData();
    return () => { isCancelled = true; };
  }, [coords]);

  // 자동완성 효과
  useEffect(() => {
    const trimmedCity = city.trim();
    
    if (trimmedCity.length < MIN_CITY_LENGTH) {
      setCandidates([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      try {
        const data = await fetchGeocoding(trimmedCity);
        
        const candidateList = (data.results || []).map(result => ({
          lat: result.latitude,
          lon: result.longitude,
          label: result.name,
          country: result.country || "",
          code: result.country_code || "",
          detail: [result.admin1, result.admin2, result.country]
            .filter(Boolean)
            .join(" / "),
        }));
        
        setCandidates(candidateList);
      } catch (err) {
        console.error("자동완성 오류:", err);
        setCandidates([]);
        setSelectedIndex(-1);
      }
    }, AUTOCOMPLETE_DELAY);

    return () => clearTimeout(timeoutId);
  }, [city]);

  // 스타일 객체
  const styles = {
    container: { 
      fontFamily: "나눔고딕, sans-serif",
      maxWidth: "720px",
      margin: "0 3px",
      padding: "20px 4px !important",
      paddingLeft: "4px !important",
      paddingRight: "4px !important",
    },
    inputContainer: { 
      position: "relative",
      display: "flex",
      gap: "8px",
      alignItems: "center"      
    },

    input: { 
      flex: 1,
      padding: "8px",
      fontsize: "14px !important",
      border : "2px solid #4462858a",
      height: "30px",
    },
      // width: "100%", padding: "8px", fontSize: "14px" },
    button: { 
      // marginTop: "6px", 
      whiteSpace: "nowrap",
      flexShrink: 0,
      padding: "4px 8px",
      backgroundColor: "#f8f9fa",
      color: "rgba(73, 69, 69, 0.87)",
      border: "2px solid #4462858a",
      borderRadius: "12px",
      cursor: "pointer",
      fontSize: "14px",
      height: "30px",
    },
    autocompleteContainer: {
      position: "absolute",
      left: 0,
      right: 0,
      top: "100%",
      marginTop: "6px",
      border: "2px solid #4462858a",
      borderRadius: "8px",
      padding: "6px",
      background: "#f8f9fa",
      maxHeight: "40vh",
      overflowY: "auto",
      zIndex: 10,
    },
    candidateButton: {
      display: "block",
      width: "100%",
      textAlign: "left",
      padding: "6px 8px",
      border: "2px solid #4462858a",
      borderRadius: "6px",
      background: "transparent",
      cursor: "pointer",
      marginBottom: "6px",
      transition: "background-color 0.2s ease",
    },
    candidateButtonSelected: {
      backgroundColor: "#dfeef5",
      borderColor: "#4462858a",
    },
    infoBox: {
      marginTop: "6px",
      padding: "2px 14px",
      fontSize: "14px",
      border: "2px solid #4462858a",
      borderRadius: "12px",
      backgroundColor: "#f8f9fa"
    },
    forecastBox: {
      marginTop: "6px",
      padding: "2px 14px",
      fontSize: "14px",
      border: "2px solid #4462858a",
      borderRadius: "12px",
      backgroundColor: "#f8f9fa",
      maxHeight: "260px", // 최대 높이 설정
      overflowY: "auto",   // 세로 스크롤 활성화
    },
    errorText: { 
      color: "crimson",
      margin: "4px 0"},
    statusText: { 
      margin: "4px 0",
      fontSize: "14px"
     }
  };

  return (
    <div style={styles.container}>
      <h1 style={{ textAlign: "center" }}>날씨날씨</h1>

      {/* 입력 폼 */}
      <form onSubmit={handleSubmit} style={{ marginTop: "14px"}}>
        <div style={styles.inputContainer}>
          <input
            style={styles.input}
            placeholder="도시명을 입력 (예: Seoul, Tokyo, Paris)"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button type="submit" style={styles.button}>
            조회
          </button>


          {/* 자동완성 목록 */}
          {candidates.length > 0 && (
            <div style={styles.autocompleteContainer}>
              {candidates.map((candidate, index) => (
                <button
                  key={`${candidate.label}-${candidate.lat}-${candidate.lon}`}
                  style={{
                    ...styles.candidateButton,
                    ...(index === selectedIndex ? styles.candidateButtonSelected : {})
                  }}
                  onClick={() => handleCandidateSelect(candidate)}
                  type="button"
                >
                  <strong>{candidate.label && <span style={{ color: "#727272" }}>{candidate.label}</span>}</strong>
                  
                  {candidate.country && <span style={{ color: "#727272" }}>, {candidate.country}</span>}
                  
                  {candidate.code && <span style={{ color: "#727272" }}> ({candidate.code})</span>}
                  
                  {candidate.detail && (
                    <span style={{ color: "#727272" }}> — {candidate.detail}</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </form>

      {/* 상태 미리보기 */}
      <div style={{ marginTop: "6px" }}>
        <p style={styles.statusText}>
          입력 중: <strong>{city || "없음"}</strong>
        </p>
        <p style={styles.statusText}>
          조회 대상: <strong>{target || "미정"}</strong>
        </p>
      </div>

      {/* 지오코딩 결과 */}
      <div style={{ marginTop: "6px" }}>
        {loading && <p style={{ fontSize: "14px", margin: "6px 0" }}>위치 찾는 중...</p>}
        {error && <p style={styles.errorText}>{error}</p>}
        {coords && !loading && (
          <div style={styles.infoBox}>
            <p style={{ margin: "4px 0" }}>
              <strong>도시:</strong> {coords.label}
              {coords.country && `, ${coords.country}`}
            </p>
            <p style={{ margin: "4px 0" }}><strong>위도:</strong> {coords.lat}</p>
            <p style={{ margin: "4px 0" }}><strong>경도:</strong> {coords.lon}</p>
          </div>
        )}
      </div>

      {/* 날씨 정보 */}
      <div style={{ marginTop: "4px" }}>
        {weatherLoading && <p style={{ fontSize: "14px", margin: "6px 0"}}>날씨 불러오는 중...</p>}
        {weatherError && <p style={styles.errorText}>{weatherError}</p>}

        {/* 현재 날씨 */}
        {currentWeather && !weatherLoading && !weatherError && (
          <div style={styles.infoBox}>
            <h3 style={{ margin: "6px 0 6px 0", fontSize: "14px" }}>{getWeatherEmoji(currentWeather.code)} 현재 날씨</h3>
            <p style={{ margin: "4px 0" }}>
              <strong>기온:</strong> {' '}
              {currentWeather.temp != null 
                ? `${Math.round(currentWeather.temp)}°C` 
                : "-"}
            </p>
            <p style={{ margin: "4px 0" }}>
              <strong>체감:</strong> {' '}
              {currentWeather.feels != null 
                ? `${Math.round(currentWeather.feels)}°C` 
                : "-"} {' '}
              | <strong>습도:</strong> {' '}
              {currentWeather.humidity != null 
                ? `${currentWeather.humidity}%` 
                : "-"} {' '}
              | <strong>바람:</strong> {' '}
              {currentWeather.wind != null 
                ? `${currentWeather.wind} m/s` 
                : "-"}
            </p>
          </div>
        )}

        {/* 5일 예보 */}
        {dailyForecast.length > 0 && !weatherLoading && !weatherError && (
          <div style={styles.forecastBox}>
            <h3 style={{ margin: "6px 0 6px 0", fontSize: "14px" }}>일기 예보</h3>
            <ul style={{ paddingLeft: "10px", margin: "0"  }}>
              {dailyForecast.map((day) => (
                <li key={day.date} style={{ marginBottom: "2px", fontSize: "14px"}}>
                  {getWeatherEmoji(day.code)}
                  <strong>{day.label}</strong> - {' '}
                  {Math.round(day.tempMin)}° / {Math.round(day.tempMax)}°
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}