const axios = require("axios");

const API_KEY = process.env.OPENWEATHER_API_KEY;

exports.getCurrentWeather = async (city) => {
    try {
        const currentUrl  = `https://api.openweathermap.org/data/2.5/weather`;
        const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast`;

        // Fire both calls in parallel — current conditions + 48 h forecast for today's high/low
        const [currentRes, forecastRes] = await Promise.all([
            axios.get(currentUrl, {
                params: { q: city, appid: API_KEY, units: "metric" },
                proxy: false,
            }),
            axios.get(forecastUrl, {
                params: { q: city, appid: API_KEY, units: "metric", cnt: 16 }, // 16 × 3 h = 48 h
                proxy: false,
            }),
        ]);

        const d = currentRes.data;

        // Determine today's date string using the server's local date
        const todayDate = new Date().toISOString().split("T")[0];

        // Filter forecast slots that fall on today, compute true daily high / low
        const todaySlots = forecastRes.data.list.filter(item =>
            item.dt_txt.startsWith(todayDate)
        );
        const slots = todaySlots.length > 0 ? todaySlots : forecastRes.data.list.slice(0, 8);
        const temps = slots.map(item => item.main.temp);

        return {
            city:        d.name,
            country:     d.sys.country,
            temp:        d.main.temp,
            feels_like:  d.main.feels_like,
            temp_min:    Math.min(...temps),   // true daily low
            temp_max:    Math.max(...temps),   // true daily high
            humidity:    d.main.humidity,
            condition:   d.weather[0].main,
            description: d.weather[0].description,
            wind_speed:  d.wind?.speed || 0,
            visibility:  d.visibility ? Math.round(d.visibility / 1000) : null,
        };
    } catch (error) {
        console.error("Current Weather API error:", error.message);
        return null;
    }
};

exports.getWeather = async (city) => {
    try {
        const url = `https://api.openweathermap.org/data/2.5/forecast`;
 
        const response = await axios.get(url, {
            params: {
                q: city,
                appid: API_KEY,
                units: "metric",
                cnt: 5
            },
            proxy: false,
        });
 
        const forecasts = response.data.list.map(item => ({
            time: item.dt_txt,
            temp: item.main.temp,
            feels_like: item.main.feels_like,
            condition: item.weather[0].main,
            description: item.weather[0].description,
            humidity: item.main.humidity
        }));
 
        return {
            city: response.data.city.name,
            country: response.data.city.country,
            forecasts
        };
 
    } catch (error) {
        console.error("Weather API error:", error.message);
        return null;
    }
}

