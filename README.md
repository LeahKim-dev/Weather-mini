# 🌤️ 날씨날씨 — React + Vite Weather Mini App

![CI](https://github.com/LeahKim-dev/Weather-mini/actions/workflows/deploy.yml/badge.svg)
> ☀️🌧️❄️ Open‑Meteo API + Geocoding + Air Quality · GitHub Pages 배포용 🌬️🌍

## 🚀 데모

👉 [날씨날씨 데모 보러가기](https://leahkim-dev.github.io/Weather-mini/)

---

## ✨ 기능

* 🔎 도시 자동완성(지오코딩, 3글자 이상) + ⌨️ 키보드 네비게이션(↑/↓/Enter/Esc)
* 🌡️ 현재 날씨(기온/체감/습도/바람/자외선) + 🌬️ 대기질(AQI/PM10/PM2.5)
* 📅 14일 **일간 예보**, 🕐 현지시각 기준 **24시간 시간대별 예보**
* 🎨 날씨 코드별 **동적 테마/이모지**
* ⭐ 즐겨찾기(최대 5개) & 🕑 최근 검색(최대 10개)
* ⚠️ API 오류 시 **서울 좌표** 폴백

---

## 🛠 기술스택

* ⚛️ **React + Vite**
* 🌍 **Open‑Meteo APIs**: Geocoding, Forecast, Air Quality
* 🎨 CSS‑in‑JS(Inline style) 기반 간단한 UI

---

## 📖 빠른 시작

```bash
# 1) 설치
npm i

# 2) 로컬 개발 서버
npm run dev

# 3) 프로덕션 빌드 (dist/ 생성)
npm run build

# 4) 로컬에서 빌드 미리보기
npm run preview
```

> 🗂 배포는 `dist/` 폴더의 정적 파일을 올리면 끝. (GitHub Pages/Netlify 등)

---

## 📜 스크립트

* ▶️ `dev` : 개발 서버(HMR)
* 🏗️ `build` : 프로덕션 번들 생성(`dist/`)
* 👀 `preview` : 빌드 결과 미리보기

---

## 📂 폴더 구조(요지)

```
├─ src/
│  └─ App.jsx (현재 파일)
├─ index.html
├─ package.json
└─ dist/ (npm run build 후 생성, 배포물)
```

---

## 🔑 환경변수

* 필요 없음. 모든 API가 Public endpoint 사용.

---

## 🌐 GitHub Pages 배포

### 1) 리포지토리 타입 확인

* 🏠 **User/Org 페이지**(`username.github.io`)면 `vite.config.[ts|js]`의 `base` 설정 불필요.
* 📁 **프로젝트 페이지**(`username.github.io/repo`)면 `vite.config`에 `base: "/<repo>/"` 필요.

### 2) Actions로 자동 배포(권장)

`.github/workflows/pages.yml` 예시:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: corepack enable
      - run: npm ci || npm i
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

> 🔒 조직 정책으로 외부 Action이 막혀 있다면, 같은 리포 내에 `actions/checkout` 등 대체 워크플로를 vendor 하거나 **GitHub Enterprise 정책**을 완화해야 함.

---

## 🌍 Open‑Meteo 엔드포인트(참고)

* 📍 ![Geocoding](https://geocoding-api.open-meteo.com/v1/search)
* 🌦️ ![Forecast](https://api.open-meteo.com/v1/forecas)
* 🌬️ ![Air Quality](https://air-quality-api.open-meteo.com/v1/air-quality)

요청 파라미터(본 앱에서 사용):

* `current`: `temperature_2m, apparent_temperature, relative_humidity_2m, wind_speed_10m, weather_code, uv_index`
* `daily`: `temperature_2m_max, temperature_2m_min, weather_code`
* `hourly`: `temperature_2m, weather_code, precipitation_probability, uv_index`
* `timezone=auto`, `forecast_days=14`

---

## 📝 사용법

1️⃣ 상단 입력에 도시명 입력(예: `Seoul`, `Tokyo`, `Paris`) → 3글자 이상이면 자동완성
2️⃣ 자동완성 목록에서 클릭 또는 키보드(↑/↓/Enter)
3️⃣ 선택하면 현재 날씨/대기질 + 일간/시간별 탭이 표시됨
4️⃣ 오류 시 서울 좌표로 폴백하여 예보 제공

---

## ✔️ Next Steps

* 🖋️ 인라인 스타일의 `!important`는 적용되지 않음 → CSS 클래스로 분리 권장
* ♿ 접근성: 자동완성/탭 버튼에 `aria-*` 속성 추가 가능
* 💾 상태 저장(favorites/recent) 로컬스토리지 연동 고려

---

## 📄 라이선스

MIT
