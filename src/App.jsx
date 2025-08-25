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

const getUVLevel = (uvIndex) => {
  if (!uvIndex) return { level: "알 수 없음", color: "#666", emoji: "❓" };
  if (uvIndex < 3) return { level: "낮음", color: "#00c851", emoji: "😊"};
  if (uvIndex < 6) return { level: "보통", color: "#ffbb33", emoji: "😐" };
  if (uvIndex < 8) return { level: "높음", color: "#ff6b6b", emoji: "😰" };
  if (uvIndex < 11) return { level: "매우 높음", color: "#cc0000", emoji: "🥵" };
  return { level: "위험", color: "#000000", emoji: "💀" };
};

const getAQILevel = (aqi) => {
  if (!aqi) return { level: "알 수 없음", color: "#666", emoji: "❓" };
  if (aqi <= 50) return { level: "좋음", color: "#00c851", emoji: "😊" };
  if (aqi <= 100) return { level: "보통", color: "#ffbb33", emoji: "😐"};
  if (aqi <= 150) return { level: "나쁨", color: "#ff6b6b", emoji: "😷" };
  if (aqi <= 200) return { level: "매우 나쁨", color: "#cc0000", emoji: "🤢" };
  return { level: "위험", color: "#000000", emoji: "💀" };
}
// API 관련 상수
const GEOCODING_API_URL = "https://geocoding-api.open-meteo.com/v1/search";
const WEATHER_API_URL = "https://api.open-meteo.com/v1/forecast";
const AIR_QUALITY_API_URL = "https://air-quality-api.open-meteo.com/v1/air-quality";
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
  const [hourlyForecast, setHourlyForecast] = useState([]);
  const [cityNow, setCityNow] = useState("");
  const [airQuality, setAirQuality] = useState(null);

  // 탭 상태
  const [activeTab, setActiveTab] = useState("daily");

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
      "temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code,uv_index"
    );
    url.searchParams.set(
      "daily",
      "temperature_2m_max,temperature_2m_min,weather_code"
    );
    url.searchParams.set(
      "hourly",
      "temperature_2m,weather_code,precipitation_probability,uv_index"
    );

    const response = await fetch(url.toString());
    if (!response.ok) throw new Error("예보 API 실패");
    
    return response.json();
  };

  // 대기질 API 호출
  const fetchAirQuality = async (coordinates) => {
    const url = new URL(AIR_QUALITY_API_URL);
    url.searchParams.set("latitude", coordinates.lat);
    url.searchParams.set("longitude", coordinates.lon);
    // url.searchParams.set("timezone", "auto");
    url.searchParams.set("current", "us_aqi,pm10,pm2_5");

    const response = await fetch(url.toString());
    if (!response.ok) throw new Error("대기질 API 실패");
    
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
      setHourlyForecast([]);
      setAirQuality(null);

      try {
        const [weatherData, airQualityData] = await Promise.all([
          fetchWeather(coords),
          fetchAirQuality(coords).catch(() => null) // 대기질 API는 선택적
        ]);

        if (!isCancelled) {
          const tz = weatherData?.timezone || "UTC";
          const dateLabel = new Intl.DateTimeFormat("ko-KR", {
            timeZone: tz, month: "2-digit", day: "2-digit", weekday: "short"
          }).format(new Date());
          const timeLabel = new Intl.DateTimeFormat("ko-KR", {
            timeZone: tz, hour: "2-digit", minute: "2-digit", hour12: false
          }).format(new Date());
          setCityNow(`${dateLabel} ${timeLabel}`);
          
          // 현재 날씨 설정
          setCurrentWeather({
            temp: weatherData.current?.temperature_2m,
            feels: weatherData.current?.apparent_temperature,
            humidity: weatherData.current?.relative_humidity_2m,
            wind: weatherData.current?.wind_speed_10m,
            code: weatherData.current?.weather_code,
            uvIndex: weatherData.current?.uv_index,
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

          // // 시간별 예보 설정
          // const hourly = (weatherData.hourly?.time || []).slice(0,24).map((time, index) => ({
          //   time,
          //   hour: new Date(time).getHours(),
          //   date: new Date(time).toLocaleDateString('en-US', {month: '2-digit', day: '2-digit'}), 
          //   temp: weatherData.hourly?.temperature_2m?.[index],
          //   code: weatherData.hourly?.weather_code?.[index],
          //   precipitation: weatherData.hourly?.precipitation_probability?.[index],
          // }));

          // 시간별 예보 설정 (도시 현지 시각 기준 현재시~24시간)
          const times = weatherData.hourly?.time || [];
          const temps = weatherData.hourly?.temperature_2m || [];
          const codes = weatherData.hourly?.weather_code || [];
          const pops  = weatherData.hourly?.precipitation_probability || [];
          const uvIndexes = weatherData.hourly?.uv_index || [];
          // 도시 타임존/오프셋
          const offsetSec = weatherData?.utc_offset_seconds ?? 0;

          // 도시 현지 "지금"의 연/월/일/시 추출
          const parts = new Intl.DateTimeFormat("en-US", {
            timeZone: tz,
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            hour12: false,
          }).formatToParts(new Date());

          const y = Number(parts.find(p => p.type === "year")?.value);
          const m = Number(parts.find(p => p.type === "month")?.value);
          const d = Number(parts.find(p => p.type === "day")?.value);
          const h = Number(parts.find(p => p.type === "hour")?.value);

          // 도시 현지 시각의 "정각"을 UTC epoch(ms)로
          const cityHourStartUTC = Date.UTC(y, m - 1, d, h) - offsetSec * 1000;

          // hourly.time(현지 문자열)을 UTC epoch(ms)로 변환하는 파서
          const localISOToUTCms = (localIso) => {
            // "YYYY-MM-DDTHH:MM" 가정
            const [dateStr, timeStr] = localIso.split("T");
            const [yy, mm, dd] = dateStr.split("-").map(Number);
            const [HH] = timeStr.split(":").map(Number);
            // 현지시간 → UTC epoch: UTC(yy,mm-1,dd,HH) - offset
            return Date.UTC(yy, mm - 1, dd, HH) - offsetSec * 1000;
          }

          // 시작 인덱스 계산 + 경계 클램프
          let startIndex = 0;
          if (times.length > 0) {
            const firstUTC = localISOToUTCms(times[0]);
            startIndex = Math.floor((cityHourStartUTC - firstUTC) / 3600000);
            if (startIndex < 0) startIndex = 0;
            if (startIndex >= times.length) startIndex = Math.max(times.length - 24, 0);
          }

          const endIndex = Math.min(startIndex + 24, times.length);

          // 슬라이스 후 맵핑 (표시는 문자열에서 바로 추출)
          const hourly = times.slice(startIndex, endIndex).map((time, i) => {
            const origIndex = startIndex + i;
            const hour = Number(time.slice(11, 13));                   // "HH"
            const dateMMDD = `${time.slice(5, 7)}/${time.slice(8, 10)}`; // "MM/DD"
            return {
              time,
              hour,
              date: dateMMDD,
              temp: temps?.[origIndex],
              code: codes?.[origIndex],
              precipitation: pops?.[origIndex],
              uvIndex: uvIndexes?.[origIndex],
            };
          });

          setHourlyForecast(hourly);

          if (airQualityData?.current) {
            setAirQuality({
              aqi: airQualityData.current.us_aqi,
              pm10: airQualityData.current.pm10,
              pm25: airQualityData.current.pm2_5,
            })
          }
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
      fontsize: "12px !important",
      border : "2px solid #4462858a",
      height: "30px",
    },
      // width: "100%", padding: "8px", fontSize: "12px" },
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
      fontSize: "12px",
      height: "30px",
    },
    autocompleteContainer: {
      position: "absolute",
      left: 0,
      right: 0,
      top: "100%",
      marginTop: "4px",
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
      marginBottom: "4px",
      transition: "background-color 0.2s ease",
    },
    candidateButtonSelected: {
      backgroundColor: "#dfeef5",
      borderColor: "#4462858a",
    },
    infoBox: {
      marginTop: "4px",
      padding: "2px 12px",
      fontSize: "12px",
      border: "2px solid #4462858a",
      borderRadius: "12px",
      backgroundColor: "#f8f9fa"
    },
    // forecastBox: {
    //   marginTop: "6px",
    //   padding: "2px 12px",
    //   fontSize: "12px",
    //   border: "2px solid #4462858a",
    //   borderRadius: "12px",
    //   backgroundColor: "#f8f9fa",
    //   maxHeight: "280px", // 최대 높이 설정
    //   overflowY: "auto",   // 세로 스크롤 활성화
    // },
    // 탭 관련 스타일
    tabContainer: {
      marginTop: "4px",
      border: "2px solid #4462858a",
      borderRadius: "12px",
      backgroundColor: "#f8f9fa",
      overflow: "hidden"
    },
    tabButtons: {
      display: "flex",
      borderBottom: "2px solid #4462858a"
    },
    tabButton: {
      flex: 1,
      padding: "8px 12px",
      border: "none",
      background: "transparent",
      cursor: "pointer",
      fontSize: "12px",
      fontWeight: "bold",
      transition: "background-color 0.2s ease, color 0.2s ease",
      color: "#4462858a",
    },
    tabButtonActive: {
      backgroundColor: "#dfeef5",
      color: "#327dd4ff",
    },
    tabContent: {
      padding: "2px 12px",
      maxHeight: "360px",
      overflowY: "auto"
    },
    errorText: { 
      color: "crimson",
      margin: "4px 0"},
    // statusText: { 
    //   margin: "4px 0",
    //   fontSize: "12px"
    //  }
  };

  return (
    <div style={styles.container}>
      <h1 style={{ textAlign: "center" }}>날씨날씨</h1>

      {/* 입력 폼 */}
      <form onSubmit={handleSubmit} style={{ marginTop: "16px"}}>
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

      {/* 상태 미리보기
      <div style={{ marginTop: "6px" }}>
        <p style={styles.statusText}>
          입력 중: <strong>{city || "없음"}</strong>
        </p>
        <p style={styles.statusText}>
          조회 대상: <strong>{target || "미정"}</strong>
        </p>
      </div> */}

      {/* 지오코딩 결과 */}
      <div style={{ marginTop: "4px" }}>
        {loading && <p style={{ fontSize: "12px", margin: "4px 0" }}>위치 찾는 중...</p>}
        {error && <p style={styles.errorText}>{error}</p>}
        {coords && !loading && (
          <div style={styles.infoBox}>
            <p style={{ margin: "4px 0" }}>
              <strong>도시:</strong> {coords.label}
              {coords.country && `, ${coords.country}`}
            </p>
            <p style={{ margin: "4px 0" }}><strong> 현재 시각:</strong> {cityNow}</p>
          </div>
        )}
      </div>

      {/* 날씨 정보 */}
      <div style={{ marginTop: "4px" }}>
        {weatherLoading && <p style={{ fontSize: "12px", margin: "4px 0"}}>날씨 불러오는 중...</p>}
        {weatherError && <p style={styles.errorText}>{weatherError}</p>}

        {/* 현재 날씨 */}
        {currentWeather && !weatherLoading && !weatherError && (
          <div style={styles.infoBox}>
            <h3 style={{ margin: "4px 0 4px 0", fontSize: "12px" }}>{getWeatherEmoji(currentWeather.code)} 현재 날씨</h3>
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
            {/* 자외선 지수 */}
            {currentWeather.uvIndex != null && (
              <p style={{ margin: "4px 0"}}>
                <strong>자외선:</strong> {' '}
                {(() => {
                  const uv = getUVLevel(currentWeather.uvIndex);
                  return (
                    <span style={{ color: uv.color }}>
                      {uv.emoji} {Math.round(currentWeather.uvIndex)} ({uv.level})
                    </span>
                  );
                })()}
              </p>
            )}
          </div>
        )}

        {/* 대기질 정보 */}
        {airQuality && !weatherLoading && !weatherError && (
          <div style={styles.infoBox}>
            <h3 style={{ margin: "4px 0 4px 0", fontSize: "12px" }}>🌬️ 대기질</h3>
            <p style={{ margin: "4px 0" }}>
              <strong>종합지수:</strong> {' '}
              {(() => {
                const aqi = getAQILevel(airQuality.aqi);
                return (
                  <span style={{ color: aqi.color }}>
                    {aqi.emoji} {Math.round(airQuality.aqi)} ({aqi.level})
                  </span>
                )
              })()}
            </p>
            <p style={{ margin: "4px 0" }}>
              <strong>미세먼지:</strong> {' '}
              {airQuality.pm10 != null ? `${Math.round(airQuality.pm10)} μg/m³` : "-"} {' '}
              | <strong>초미세먼지:</strong> {' '}
              {airQuality.pm25 != null ? `${Math.round(airQuality.pm25)} μg/m³` : "-"}
            </p>
          </div>
        )}            


        {/* 탭으로 구성된 예보 정보 */}
        {(dailyForecast.length > 0 || hourlyForecast.length > 0) && !weatherLoading && !weatherError && (
          <div style={styles.tabContainer}>
            {/* 탭 버튼들 */}
            <div style={styles.tabButtons}>
              <button
                style={{
                  ...styles.tabButton,
                  ...(activeTab === "daily" ? styles.tabButtonActive : {})
                }}
                onClick={() => setActiveTab("daily")}
              >
                📅 일기 예보
              </button>
              <button
                style={{
                  ...styles.tabButton,
                  ...(activeTab === "hourly" ? styles.tabButtonActive : {})
                }}
                onClick={() => setActiveTab("hourly")}
              >
                🕐 시간별 예보
              </button>
            </div>

            {/* 탭 내용 */}
            <div style={styles.tabContent}>
              {activeTab === "daily" && dailyForecast.length > 0 && (
                <ul style={{ paddingLeft: "10px", margin: "6px 0" }}>
                  {dailyForecast.map((day) => (
                    <li key={day.date} style={{ marginBottom: "2px", fontSize: "12px"}}>
                      {getWeatherEmoji(day.code)} <strong>{day.label}</strong> - {' '}
                      {Math.round(day.tempMin)}° / {Math.round(day.tempMax)}°
                    </li>
                  ))}
                </ul>
              )}

              {activeTab === "hourly" && hourlyForecast.length > 0 && (
                <ul style={{ paddingLeft: "10px", margin: "6px 0" }}>
                  {hourlyForecast.map((hour, index) => (
                    <li key={hour.time} style={{ marginBottom: "2px", fontSize: "12px"}}>
                      <div style={{display:"flex", alignItems:"center", gap:"4px",flexWrap:"wrap"}}>
                        <span>
                          {getWeatherEmoji(hour.code)} <strong>{hour.hour}시</strong> ({hour.date}) - {' '}
                          {Math.round(hour.temp)}°C
                        </span>
                        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                          {hour.precipitation != null && hour.precipitation > 0 && (
                            <span style={{ color: "#2563eb", fontSize: "11px" }}>🌧️ {hour.precipitation}%</span>
                          )}
                          {hour.uvIndex != null && hour.uvIndex > 0 && (  // 이 부분이 새로 추가됨
                            <span style={{ fontSize: "11px" }}>
                              {(() => {
                                const uv = getUVLevel(hour.uvIndex);
                                return (
                                  <span style={{ color: uv.color }}>
                                    ☀️ {Math.round(hour.uvIndex)} ({uv.level})
                                  </span>
                                );
                              })()}
                            </span>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}