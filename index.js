    import "./style.scss";
    import { sl, NumbersToPersian, debounce, checkPersianCharacters, createJsFile, checkExistJsFile, deleteMap } from "./utils"
    const OPENWEATHER_KEY = process.env.OPENWEATHER;
    const YANDEX_MAP_KEY = process.env.YANDEX_MAP;
    const MAP_URL = `https://api-maps.yandex.ru/2.1/?lang=en&amp;apikey=${YANDEX_MAP_KEY}`;
    const UNIT = "°C";
    const REQUEST_INTERVAL = 45 * (60 * 1000); // 45 minutes
    const LOADING_DELAY = 200; // ms
    const LOADING_TRANSITION_DELAY = 500; // ms
    const PORTAL_MODAL_DELAY = 2500; // 2.5s
    const TO_FIXED = 2;
    let cacheData = {lat: 53.4106, lon: -2.9779};
    const CITY_HAVE_IMAGE = ["liverpool", "ahvāz"];
    const translate = {
        fa: {
            Clear: "صاف",
            Clouds: "ابری",
            Rain: "بارانی",
            Thunderstorm: "رعد و برق",
            Snow: "برفی",
            FeelsLike: "دمایی که احساس می‌شود",
            CityNotFound: "شهر مورد نظر یافت نشد.",
            TypeCity: "اسم شهر را وارد کنید و Enter بزنید",
        },
        en: {
            CityNotFound: "City not found.",
            TypeCity: "type City and hit Enter"
        }
    }

    function activePortalModal(text) {
        document.body.classList.remove("loading");
        document.body.classList.add("loaded");
        document.body.classList.add("blur");
        sl(".portal-model").classList.add("active");
        sl(".portal-model .text").innerHTML = text;
        sl(".portal-model .text").style.color = "#ffffff";
        setTimeout(() => {
            sl(".portal-model").classList.remove("active");
            document.body.classList.remove("blur");
        }, PORTAL_MODAL_DELAY);
    }

    function changeColor(color) {
        document.body.style.backgroundColor = color;
        sl(".map-overlay .bottom").style.backgroundColor = color;
        sl(".map-overlay .cover").style.backgroundColor = color;
    }

    function changeMapOpacity(value) {
        sl(".map-overlay .cover").style.opacity = value/100;
    }
    const handleChangeColor = debounce(function() {
        changeColor(colorEL.value);
        localStorage.setItem("color", colorEL.value);
    }, 20);

    const handleMapOpacityChange = debounce(function() {
        changeMapOpacity(mapOpacityRangeEl.value)
    }, 20);

    function onInputKeydown(event) {
        if (event.code !== "Backspace" && event.key !== "Control" && event.key !== "Alt" && event.key !== "Shift" &&
        event.key !== "CapsLock" && event.key !== "Tab" && event.code !== "Space" && event.key !== "Enter") {
            if (checkPersianCharacters(event.key)) {
                sl("header").classList.add("right");
                sl("header").classList.remove("left");
                inputEl.placeholder = translate.fa.TypeCity;
            } else {
                sl("header").classList.remove("right");
                sl("header").classList.add("left");
                inputEl.placeholder = translate.en.TypeCity;
            }
        }
        if (event.key === "Enter") {
            event.preventDefault();
            if (!document.body.classList.contains("blur")) {
                if (inputEl.value.length < 22 && inputEl.value.length > 1) {
                    loading();
                    setTimeout(() => {
                        searchWeather(inputEl.value, false);
                    }, 120);
                    setTimeout(() => {
                        sl(".weather").style.opacity = 1;
                    }, Math.max(0, LOADING_DELAY - LOADING_TRANSITION_DELAY));
                } else {
                    activePortalModal("invalid city");
                }
            }
        }
    }
    
    function searchWeather(city, interval) {
        const isPersianCharacter = checkPersianCharacters(city);
        if (!interval) {
            const color = localStorage.getItem("color") || "#072322";
            sl("main form.color input").value = color;
            changeColor(color);
            if (isPersianCharacter) {
                document.body.classList.add("rtl");
                inputEl.placeholder = "اسم شهر را وارد کنید و Enter بزنید."
            } else {
                document.body.classList.remove("rtl");
                inputEl.placeholder = "type City and hit Enter";
            }
        }
        fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&APPID=${OPENWEATHER_KEY}&units=metric&lang=${isPersianCharacter ? "fa" : "en"}`).then(result => {
            return result.json();
        }).then(result => {
            computeUI(result, city, interval);
        });
    }

    function loaded(delay = true) {
        sl("main").style.display = "flex";
        if (delay) {
            setTimeout(() => {
                document.body.classList.remove("loading");
                document.body.classList.add("loaded");
                document.body.classList.remove("blur");
            }, Math.max(0, LOADING_DELAY - LOADING_TRANSITION_DELAY));
        } else {
            document.body.classList.remove("loading");
            document.body.classList.add("loaded");
            document.body.classList.remove("blur");
        }
    }

    function loading() {
        document.body.classList.remove("loaded");
        document.body.classList.add("blur");
        document.body.classList.add("loading");
    }

    function createMap(lat, lon) {
        deleteMap();
        if (!checkExistJsFile("yandex")) {
            createJsFile(MAP_URL);
        }
        setTimeout(() => {
            try {
                ymaps.ready(function () {
                    new ymaps.Map("map", {
                            center: (lat && lon) ? [lat, lon] : [cacheData.lat, cacheData.lon],
                            zoom: 10.5,
                            controls: []
                    });
                        loaded();
                    });
            } catch (error) {
                
            }
        }, 3000);
    }

    function computeUI(result, city, interval) {
        const isPersianCharacter = checkPersianCharacters(city);
        if (!interval) {
            if (result && result.cod === 200 && city) {
                cacheData.lat = result.coord.lat;
                cacheData.lon = result.coord.lon;
                if (!(CITY_HAVE_IMAGE.includes(city.toLocaleLowerCase()))) {
                    createMap(result.coord.lat, result.coord.lon);
                } else {
                    deleteMap();
                    // const imagel = require("./static/image/liverpool.jpg");
                    // sl("main .weather").style.backgroundImage = `url("https://i.ibb.co/Mn0YJ95/liverpool.jpg")`;
                    loaded();
                }
                sl("main .weather .map-overlay .content-wrapper h1 b").innerHTML = isPersianCharacter ? city : result.name;
                sl("main header form.search input").focus();
                const flagImage = require(`./static/flags/${(result.sys.country).toLowerCase()}.svg`);
                sl("main .weather .map-overlay .content-wrapper h1 span").style.backgroundImage = `url("${flagImage}")`;
                localStorage.setItem("last_search", isPersianCharacter ? city : result.name);
            } else if (result && result.cod === "404" && city) {
                activePortalModal(checkPersianCharacters(city) ? translate.fa.CityNotFound : translate.en.CityNotFound);
            }
        }
        sl("main .weather .map-overlay .content-wrapper .weather-data .temperature .value").innerHTML = isPersianCharacter ? NumbersToPersian(result.main.temp.toFixed(TO_FIXED)) : result.main.temp.toFixed(TO_FIXED);
        sl("main .weather .map-overlay .content-wrapper .weather-data .temperature .unit").innerHTML = UNIT;
        sl("main .weather .map-overlay .content-wrapper .weather-data .feels_like .text").innerHTML = isPersianCharacter ? `${translate.fa.FeelsLike}:` : "Feels Like:";
        sl("main .weather .map-overlay .content-wrapper .weather-data .feels_like .value").innerHTML = isPersianCharacter ? NumbersToPersian(result.main.feels_like.toFixed(TO_FIXED)) : result.main.feels_like.toFixed(TO_FIXED);
        sl("main .weather .map-overlay .content-wrapper .weather-data .feels_like .unit").innerHTML = UNIT;
        // sl("main .weather .map-overlay .content-wrapper .weather-data .humidity").innerHTML = isPersianCharacter ? NumbersToPersian(result.main.humidity) : result.main.humidity;
        // sl("main .weather .map-overlay .content-wrapper .weather-data .pressure").innerHTML = isPersianCharacter ? NumbersToPersian(result.main.pressure) : result.main.pressure;
        sl(".map-overlay .content-wrapper .weather-data .current-weather-icon span").innerHTML = result.weather[0].description;    
        sl("main .weather .map-overlay .content-wrapper .weather-data .temp_max .value").innerHTML = isPersianCharacter ? NumbersToPersian(result.main.temp_max.toFixed(TO_FIXED)) : result.main.temp_max.toFixed(TO_FIXED);
        sl("main .weather .map-overlay .content-wrapper .weather-data .temp_max .unit").innerHTML = UNIT;
        sl("main .weather .map-overlay .content-wrapper .weather-data .temp_min .value").innerHTML = isPersianCharacter ? NumbersToPersian(result.main.temp_min.toFixed(TO_FIXED)) : result.main.temp_min.toFixed(TO_FIXED);
        sl("main .weather .map-overlay .content-wrapper .weather-data .temp_min .unit").innerHTML = UNIT;
    }

    function onFullScreenClick() {
        document.querySelector("header").style.visibility = "hidden";
        document.querySelector("header").style.opacity = 0;
        sl("main .weather").style.marginTop = "-30px";
        sl("main .weather").style.width = "calc(100vw - 160px)";
        sl("main .weather").style.height = "calc(100vh - 110px)";
        document.documentElement.requestFullscreen();
    }

    function onFullScreenChange() {
        if (!document.fullscreenElement) {
            document.querySelector("header").style.visibility = "visible";
            document.querySelector("header").style.opacity = 1;
            sl("main .weather").style.marginTop = "10px";
            sl("main .weather").style.width = "80vw";
            sl("main .weather").style.height = "calc(80vh + 40px)";
            createMap();
        }
    }

    setInterval(() => {
        searchWeather(localStorage.getItem("last_search") ||  "Liverpool", true);
    }, REQUEST_INTERVAL);

    function currentTime() {
        const city = localStorage.getItem("last_search") ||  "Liverpool";
        const isPersianCharacter = checkPersianCharacters(city);

        const date = new Date();
        const day = date.getDay();
        let hour = date.getHours();
        let min = date.getMinutes();
        let sec = date.getSeconds();
        let month = date.getMonth();
        let curr_date = date.getDate();
        const year = date.getFullYear();
        const month_name = [
          "January",
          "February",
          "March",
          "April",
          "May",
          "June",
          "July",
          "August",
          "September",
          "October",
          "November",
          "December"
        ];
        const showDay = document.querySelectorAll(".day__wrapper span");
        let midday = "AM";
        midday = hour >= 12 ? "PM" : "AM";
        hour = hour == 0 ? 12 : hour > 12 ? hour - 12 : hour;
        hour = updateTime(hour);
        min = updateTime(min);
        sec = updateTime(sec);
        curr_date = updateTime(curr_date);
        sl(".digital-clock .time-wrapper .hour").innerHTML = `${isPersianCharacter ? NumbersToPersian(hour) : hour }:${isPersianCharacter ? NumbersToPersian(min) : min}`;
        sl(".digital-clock .time-wrapper .second").innerHTML = `:${isPersianCharacter ? NumbersToPersian(sec) : sec}`;
        sl(".digital-clock .time-wrapper .minutes").innerHTML = `${midday}`;
        // document.querySelector(
        //   "#full__date"
        // ).innerHTML = `${month_name[month]} ${curr_date} ${year}`;
        // showDay[day].style.opacity = "1";
      }
      function updateTime(k) {
        if (k < 10) {
          return "0" + k;
        } else {
          return k;
        }
      }
      
    function onPortalModalClose() {
        document.body.classList.remove("blur");
        sl(".portal-model").classList.remove("active");
    }
        
    function onContentLoaded() {
        searchWeather(localStorage.getItem("last_search") ||  "Liverpool", false);
        if ("serviceWorker" in navigator) {
            navigator.serviceWorker.register("/service-worker.js");
        };
    }
        
    const inputEl = sl("main header form.search input");
    const colorEL = document.getElementById("favcolor");
    const mapOpacityRangeEl = document.getElementById("mapOpacity");
    sl(".portal-model .close").addEventListener("click", onPortalModalClose)    
    sl("main header button.full-screen").addEventListener("click", onFullScreenClick);
    inputEl.addEventListener("keydown", onInputKeydown);
    colorEL.addEventListener("input", handleChangeColor, false);
    mapOpacityRangeEl.addEventListener("input", handleMapOpacityChange, false);
    document.addEventListener("fullscreenchange", onFullScreenChange);
    window.addEventListener("DOMContentLoaded", onContentLoaded);
    setInterval(currentTime, 1000);