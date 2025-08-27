import { useEffect, useState } from "react";

// 유틸리티 함수
const formatDate = (iso) => {
  const date = new Date(iso);
  const dayNames = ["일", "월", "화", "수", "목", "금", "토"];
  const dayName = dayNames[date.getDay()];
  return `${date.getMonth() + 1}/${date.getDate()}(${dayName})`;
};

const getWeatherTheme = (weatherCode) => {
  if (!weatherCode) {
    return {
      background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 10%)",
      containerBg: "rgba(255, 255, 255, 0.9)",
      borderColor: "4462858a",
      textColor: "#333"
    };
  }

  const code = parseInt(weatherCode);
  // 맑음
  if (code === 0) {
    return {
      background: "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)",
      containerBg: "rgba(255, 255, 255, 0.95)",
      borderColor: "#ff9ab80",
      textColor: "#2c3e50"
    };
  }

  // 약간 흐림
  if (code === 1) {
    return {
      background: "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)",
      containerBg: "rgba(255, 255, 255, 0.9)",
      borderColor: "#a8edea80",
      textColor: "#2c3e50"
    };
  }

  // 흐림
  if (code === 2 || code ===3) {
    return {
      background: "linear-gradient(135deg, #d3d3d3 0%, #c0c0c0 100%)",
      containerBg: "rgba(255, 255, 255, 0.85)",
      borderColor: "#999",
      textColor: "#333"
    };
  }

  // 안개
  if (code >= 45 && code <= 48) {
    return {
      background: "linear-gradient(135deg, #bdc3c7 0%, #2c3e50 100%)",
      containerBg: "rgba(255, 255, 255, 0.8",
      borderColor: "#7fbc8d",
      textColor: "#2c3e50"
    };
  }

  // 이슬비/가벼운 비
  if (code >= 51 && code <= 55) {
    return {
      background: "linear-gradient(135deg, #74b9ff 0%, #0984e3 100%)",
      containerBg: "rgba(255, 255, 255, 0.9)",
      borderColor: "#74b9ff80",
      textColor: "#2c3e50"
    };
  }

  // 비
  if (code >= 61 && code <= 65) {
    return {
      background: "linear-gradient(135deg, #636fa4 0%, #e8cbc0 100%)",
      containerBg: "rgba(255, 255, 255, 0.9)",
      borderColor: "#636fa480",
      textColor: "#2c3e50"
    };
  }

  // 진눈깨비
  if (code >= 66 && code <= 68) {
    return {
      background: "linear-gradient(135deg, #eef2f3 0%, #8e9eab 100%)",
      containerBg: "rgba(255, 255, 255, 0.95)",
      borderColor: " #8e9eab80",
      textColor: "#2c3e50"
    };
  }

  // 눈
  if (code >= 71 && code <= 75) {
    return {
      background: "linear-gradient(135deg, #e6f3ff 0%, #b3d9ff 100%)",
      containerBg: "rgba(255, 255, 255, 0.95)",
      borderColor: "#b3d9ff80",
      textColor: "#2c3e50"
    };
  }

  // 소나기
  if (code >= 80 && code <= 82) {
    return {
      background: "linear-gradient(135deg, #667db6 0%, #0082c8 100%)",
      containerBg: "rgba(255, 255, 255, 0.9)",
      borderColor: "#667db680",
      textColor: "#fff"
    };
  }

  // 뇌우
  if (code >= 95 && code <= 99) {
    return {
      background: "linear-gradient(135deg, #434343 0%, #000000 100%)",
      containerBg: " rgba(255, 255, 255, 0.95)",
      borderColor: "#666",
      textColor: "#333"
    };
  }

  // 기본값
  return {
    background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
    containerBg: "rgba(255, 255, 255, 0.9)",
    borderColor: "#4462858a",
    textColor: "#333"
  };
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
  
  // 즐겨찾기/최근 검색 상태
  const [favorites, setFavorites] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

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

  // 즐겨찾기 추가/제거
  const toggleFavorite = (location) => {
    const key = `${location.label}-${location.lat}-${location.lon}`;
    const exists = favorites.some(fav => `${fav.label}-${fav.lat}-${fav.lon}` === key);
    
    if (exists) {
      const newFavorites = favorites.filter(fav => `${fav.label}-${fav.lat}-${fav.lon}` !== key);
      setFavorites(newFavorites);
    } else {
      const newFavorites = [...favorites, location].slice(0, 5); // 최대 5개
      setFavorites(newFavorites);
    }
  };

  // 즐겨찾기 여부 확인
  const isFavorite = (location) => {
    if (!location) return false;
    const key = `${location.label}-${location.lat}-${location.lon}`;
    return favorites.some(fav => `${fav.label}-${fav.lat}-${fav.lon}` === key);
  };

  // 최근 검색에 추가
  const addToRecentSearches = (location) => {
    const key = `${location.label}-${location.lat}-${location.lon}`;
    const filtered = recentSearches.filter(recent => `${recent.label}-${recent.lat}-${recent.lon}` !== key);
    const newRecentSearches = [location, ...filtered].slice(0, 10); // 최대 10개
    setRecentSearches(newRecentSearches);
  };

  // 후보 선택 핸들러
  const handleCandidateSelect = (candidate) => {
    setError("");
    setIsManualSelection(true);
    setCoords(candidate);
    setTarget(candidate.label);
    setCandidates([]);
    setSelectedIndex(-1);
    addToRecentSearches(candidate);
  };

  // 즐겨찾기/최근검색에서 선택
  const handleHistorySelect = (location) => {
    setError("");
    setIsManualSelection(true);
    setCoords(location);
    setTarget(location.label);
    setCity(location.label);
    setShowHistory(false);
    addToRecentSearches(location);
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

  
  // 로딩 스켈레톤 컴포넌트
  const LoadingSkeleton = ({ lines = 3 }) => (
    <div style={{
      padding: "2px 12px",
      border: `2px solid ${currentTheme.borderColor}`,
      borderRadius: "12px",
      backgroundColor: currentTheme.containerBg,
      marginTop: "4px",
      backdropFilter: "blur(10px)"
    }}>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} style={{
          height: "16px",
          backgroundColor: "#e2e8f0",
          borderRadius: "4px",
          margin: "8px 0",
          animation: "pulse 1.5s ease-in-out infinite",
          width: i === 0 ? "60%" : i === lines - 1 ? "40%" : "80%"
        }} />
      ))}
      <style>
        {`
          @keyframes pulse {
            0%, 100% { opacity: 0.4; }
            50% { opacity: 0.8; }
          }
        `}
      </style>
    </div>
  );

  // 현재 날씨 테마 계산
  const currentTheme = currentWeather ? getWeatherTheme(currentWeather.code) : getWeatherTheme(null);

  // 스타일 객체
  const styles = {
    container: { 
      fontFamily: "나눔고딕, sans-serif",
      maxWidth: "720px",
      margin: "0 3px",
      padding: "20px 4px !important",
      paddingLeft: "4px !important",
      paddingRight: "4px !important",
      color: currentTheme.textColor,
      transition: "all 0.5s ease"
    },
    backgroundContainer: {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: currentTheme.background,
      zIndex: -1,
      transition: "background 0.5s ease"
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
      border : `2px solid ${currentTheme.borderColor}`,
      height: "30px",
      backgroundColor: currentTheme.containerBg,
      color: currentTheme.textColor,
      transition: "all 0.3s ease",
      outline: "none"
    },
      // width: "100%", padding: "8px", fontSize: "12px" },
    button: { 
      // marginTop: "6px", 
      whiteSpace: "nowrap",
      flexShrink: 0,
      padding: "4px 8px",
      backgroundColor: currentTheme.containerBg,
      color: currentTheme.textColor,
      border: `2px solid ${currentTheme.borderColor}`,
      borderRadius: "12px",
      cursor: "pointer",
      fontSize: "12px",
      height: "30px",
      transition: "all 0.2s ease"
    },

    autocompleteContainer: {
      position: "absolute",
      left: 0,
      right: 0,
      top: "100%",
      marginTop: "4px",
      border: `2px solid ${currentTheme.borderColor}`,
      borderRadius: "8px",
      padding: "6px",
      backgroundColor: currentTheme.containerBg,
      backdropFilter: "blur(10px)",
      maxHeight: "40vh",
      overflowY: "auto",
      zIndex: 10,     
      boxShadow: "0 4px 20px rgba(0,0,0,0.1)"
    },
    candidateButton: {
      display: "block",
      width: "100%",
      textAlign: "left",
      padding: "6px 8px",
      border: "none",
      borderRadius: "6px",
      background: "transparent",
      cursor: "pointer",
      marginBottom: "4px",
      transition: "background-color 0.2s ease",
    },
    candidateButtonSelected: {
      
      backgroundColor: "rgba(70, 98, 133, 0.2)",
    },
    infoBox: {
      marginTop: "4px",
      padding: "4px",
      fontSize: "12px",
      border: `2px solid ${currentTheme.borderColor}`,
      borderRadius: "12px",
      backgroundColor: currentTheme.containerBg,
      backdropFilter: "blur(10px)",
      boxShadow: "0 2px 10px rgba(0,0,0,0.1)"
    },
    // 탭 관련 스타일
    tabContainer: {
      marginTop: "4px",
      border: `2px solid ${currentTheme.borderColor}`,
      borderRadius: "12px",
      backgroundColor: currentTheme.containerBg,
      backdropFilter: "blur(10px)",
      overflow: "hidden",
      boxShadow: "0 2px 10px rgba(0,0,0,0.1)"
    },
    tabButtons: {
      display: "flex",
      borderBottom: `2px solid ${currentTheme.borderColor}`
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
      color: currentTheme.textColor,
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
    loadingText: {
      margin: "8px 0",
      fontSize: "14px",
      color: currentTheme.textColor,
      opacity: 0.7
    }
  };

 return (
    <>
      <div style={styles.backgroundContainer} />
      <div style={styles.container}>
        <h1 style={{ textAlign: "center", marginBottom: "16px", fontSize: "28px" }}>🌤️날씨날씨</h1>

        {/* 입력 폼 */}
        <form onSubmit={handleSubmit} style={{ marginTop: "16px"}}>
          <div style={styles.inputContainer}>
            <input
              style={styles.input}
              placeholder="도시명을 입력하세요 (예: Seoul, Tokyo, Paris)"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button type="submit" style={styles.button}>
              🔍 조회
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
                    <div style={{fontWeight: "bold", marginBottom: "2px"}}>
                      {candidate.label}
                      {candidate.country && <span style={{ color: "#666", fontWeight: "normal" }}>, {candidate.country}</span>}
                      {candidate.code && <span style={{ color: "#666", fontWeight: "normal" }}> ({candidate.code})</span>}
                    </div>
                    {candidate.detail && (
                      <div style={{ fontSize: "12px", color: "#666" }}>
                        {candidate.detail}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </form>

        {/* 지오코딩 결과 */}
        <div>
          {loading && <p style={styles.loadingText}>📍 위치 찾는 중...</p>}
          {error && <p style={styles.errorText}>{error}</p>}
          {coords && !loading && (
            <div style={styles.infoBox}>
              <div style={{display: "flex", alignItems: "center", justifyContent: "space-between"}}>
                <div>
                  <p style={{ margin: "4px 0 4px 0", fontSize: "12px", fontWeight: "bold" }}>
                    📍 {coords.label}
                    {coords.country && `, ${coords.country}`} {"  |  "}{cityNow}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 날씨 정보 */}
        <div>
          {weatherLoading && <p style={styles.loadingText}>🌤️ 날씨 불러오는 중...</p>}
          {weatherError && <p style={styles.errorText}>{weatherError}</p>}

          {/* 현재 날씨 + 대기질 정보 */}
          {(currentWeather || airQuality) && !weatherLoading && !weatherError && (
            <div 
              style={{
                marginTop: "4px",
                padding: "0",
                fontSize: "12px",
                border: "2px solid #999",
                borderRadius: "12px",
                backgroundColor: "rgba(255,255,255,0.85)",
                backdropFilter: "blur(10px)",
                boxShadow: "rgba(0,0,0,0.1) 0 2px 10px",
                boxSizing: "border-box",
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 0,
                  width: "100%",
                  position: "relative", // 가운데 라인 절대배치용
                  borderRadius: "12px",
                  overflow: "hidden",   // 둥근 모서리 안으로 라인 클리핑
                }}
              >
                {/* 가운데 라인 */}
                <div
                  aria-hidden
                  style={{
                    position: "absolute",
                    top: 0,
                    bottom: 0,
                    left: "50%",
                    width: "1px",
                    transform: "translateX(-0.5px)", // 하위픽셀 보정
                    background: "rgba(153,153,153,0.9)",
                    pointerEvents: "none",
                  }}
                />
                
              {currentWeather && !weatherLoading && !weatherError && (
                <div       
                  style={{
                    margin: 0,
                    padding: "8px 6px",
                    border: "none",
                    borderTopLeftRadius: "12px",
                    borderBottomLeftRadius: "12px",
                    background: "rgba(255,255,255,0.85)",
                    boxShadow: "rgba(0,0,0,0.06) 0 1px 4px",
                    boxSizing: "border-box",
                  }}
                >
                  <h3 style={{ margin: "0 0 4px 0", fontSize: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{fontSize: "12px"}}>{getWeatherEmoji(currentWeather.code)}</span>
                    현재 날씨
                  </h3>
                  <p style={{ margin: "0 0 4px 0", fontSize: "12px" }}>
                    ▪{currentWeather.temp != null ? `${Math.round(currentWeather.temp)}°C` : "-"} (체감 {currentWeather.feels != null ? `${Math.round(currentWeather.feels)}°C` : "-"})
                  </p>
                  <p style={{ margin: "0 0 4px 0" }}>
                    ▪습도 {currentWeather.humidity != null ? `${currentWeather.humidity}%` : "-"}
                  </p>
                  <p style={{ margin: "0 0 4px 0" }}>
                    ▪바람 {currentWeather.wind != null ? `${currentWeather.wind} m/s` : "-"}</p>              

                  {/* 자외선 지수 */}
                  {currentWeather.uvIndex != null && (
                    <div>
                      <span style={{fontSize: "12px"}}>▪자외선: </span>
                      {(() => {
                        const uv = getUVLevel(currentWeather.uvIndex);
                        return (
                          <span style={{ color: uv.color, fontWeight: "bold", fontSize: "12px" }}>
                            {uv.emoji} {Math.round(currentWeather.uvIndex)} ({uv.level})
                          </span>
                        );
                      })()}
                    </div>      
                  )}
                </div>
              )}

              {/* 대기질 정보 */}
              {airQuality && !weatherLoading && !weatherError && (
                <div       
                  style={{
                    margin: 0,
                    padding: "8px 6px",
                    border: "none",
                    borderTopRightRadius: "12px",
                    borderBottomRightRadius: "12px",
                    background: "rgba(255,255,255,0.85)",
                    boxShadow: "rgba(0,0,0,0.06) 0 1px 4px",
                    boxSizing: "border-box",
                  }}
                >
                  <h3 style={{ margin: "0 0 4px 0", fontSize: "12px" }}>🌬️ 대기질</h3>
                  <div style={{marginBottom: "4px"}}>
                    <span style={{ margin: "0 0 4px 0" }}>▪종합지수: </span>
                    {(() => {
                      const aqi = getAQILevel(airQuality.aqi);
                      return (
                        <span style={{ color: aqi.color, fontWeight: "bold" }}>
                          {aqi.emoji} {Math.round(airQuality.aqi)} ({aqi.level})
                        </span>
                      )
                    })()}
                  </div>
                  <div style={{ margin: "0 0 4px 0" }}>▪미세먼지: {airQuality.pm10 != null ? `${Math.round(airQuality.pm10)} μg/m³` : "-"}</div>
                  <div style={{ margin: "0 0 4px 0" }}>▪초미세먼지: {airQuality.pm25 != null ? `${Math.round(airQuality.pm25)} μg/m³` : "-"}</div>                  
                </div>
              )}
                
            </div>
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
                  <div>
                    {dailyForecast.map((day) => (
                      <div key={day.date} style={{ 
                        display: "flex", 
                        justifyContent: "space-between", 
                        alignItems: "center",
                        padding: "8px 0",
                        borderBottom: "1px solid rgba(0,0,0,0.1)"
                      }}>
                        <div style={{display: "flex", alignItems: "center", gap: "8px"}}>
                          <span style={{fontSize: "14px"}}>{getWeatherEmoji(day.code)}</span>
                          <span style={{fontWeight: "bold"}}>{day.label}</span>
                        </div>
                        <div style={{textAlign: "right"}}>
                          <span style={{fontSize: "14px", fontWeight: "bold"}}>
                            {Math.round(day.tempMax)}°
                          </span>
                          <span style={{fontSize: "14px", opacity: 0.7, marginLeft: "4px"}}>
                            / {Math.round(day.tempMin)}°
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === "hourly" && hourlyForecast.length > 0 && (
                  <div>
                    {hourlyForecast.map((hour, index) => (
                      <div key={hour.time} style={{ 
                        display: "flex", 
                        justifyContent: "space-between", 
                        alignItems: "center",
                        padding: "6px 0",
                        borderBottom: index < hourlyForecast.length - 1 ? "1px solid rgba(0,0,0,0.05)" : "none"
                      }}>
                        <div style={{display: "flex", alignItems: "center", gap: "8px"}}>
                          <span style={{fontSize: "18px"}}>{getWeatherEmoji(hour.code)}</span>
                          <div>
                            <div style={{fontWeight: "bold"}}>{hour.hour}시</div>
                            <div style={{fontSize: "10px", opacity: 0.7}}>{hour.date}</div>
                          </div>
                          <div style={{display: "flex", flexDirection: "column", gap: "2px"}}>
                            {hour.precipitation != null && hour.precipitation > 0 && (
                              <span style={{ color: "#2563eb", fontSize: "11px" }}>
                                🌧️ {hour.precipitation}%
                              </span>
                            )}
                            {hour.uvIndex != null && hour.uvIndex > 0 && (
                              <span style={{ fontSize: "11px" }}>
                                {(() => {
                                  const uv = getUVLevel(hour.uvIndex);
                                  return (
                                    <span style={{ color: uv.color }}>
                                      ☀️ {Math.round(hour.uvIndex)}
                                    </span>
                                  );
                                })()}
                              </span>
                            )}
                          </div>
                        </div>                                              
                      <div style={{textAlign: "right", display: "flex", alignItems: "center", gap: "12px"}}>
                        <span style={{ fontSize: "12px", fontWeight: "bold", whiteSpace: "nowrap" }}>
                          {Number.isFinite(hour.temp) ? `${Math.round(hour.temp)}°C` : "—°C"}
                        </span>
                      </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}