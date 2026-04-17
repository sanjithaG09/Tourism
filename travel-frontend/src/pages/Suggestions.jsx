import VeloraLogo from "../components/VeloraLogo";
import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell,
  LineChart, Line, Legend, Area, AreaChart,
} from "recharts";

// ─────────────────────────────────────────────────────────────────────────────
// DATA
// ─────────────────────────────────────────────────────────────────────────────
// Wikipedia article title → REST API fetches the authoritative article lead image
// fallback: CSS gradient shown while loading or if API fails
const DESTINATIONS = [
  {
    name: "Goa",
    wikiTitle: "Goa",
    fallback: "linear-gradient(135deg,#0ea5e9 0%,#0369a1 100%)",
    seasons: ["winter", "summer"],
    categories: ["beaches"],
    budget: "moderate", popularity: 92,
    tags: ["Beach", "Nightlife", "Water Sports", "Heritage"],
    description: "Golden beaches, vibrant nightlife, and Portuguese heritage. India's most beloved coastal escape for every kind of traveller.",
    trend: [38,32,28,22,18,15,12,18,35,68,88,95],
  },
  {
    name: "Manali",
    wikiTitle: "Manali, Himachal Pradesh",
    fallback: "linear-gradient(135deg,#6366f1 0%,#4338ca 100%)",
    seasons: ["summer", "winter"],
    categories: ["mountains", "adventure"],
    budget: "moderate", popularity: 88,
    tags: ["Snow", "Trekking", "Skiing", "Scenic"],
    description: "Snow-capped peaks, apple orchards, and the roaring Beas river. Manali is where mountains meet magic.",
    trend: [72,65,55,48,42,90,95,92,75,60,55,78],
  },
  {
    name: "Jaipur",
    wikiTitle: "Jaipur",
    fallback: "linear-gradient(135deg,#f97316 0%,#c2410c 100%)",
    seasons: ["winter"],
    categories: ["heritage", "cultural"],
    budget: "budget", popularity: 85,
    tags: ["Forts", "Royal", "Markets", "Culture"],
    description: "The Pink City is a living museum of Rajput grandeur — palaces, bazaars, and timeless stories etched in sandstone.",
    trend: [88,80,72,45,30,22,18,22,38,72,85,90],
  },
  {
    name: "Ladakh",
    wikiTitle: "Ladakh",
    fallback: "linear-gradient(135deg,#64748b 0%,#334155 100%)",
    seasons: ["summer"],
    categories: ["mountains", "adventure", "spiritual"],
    budget: "moderate", popularity: 82,
    tags: ["Altitude", "Monasteries", "Bike Trip", "Lakes"],
    description: "The Land of High Passes. Stark lunar landscapes, ancient monasteries, and the world's highest motorable roads.",
    trend: [5,5,8,18,55,90,98,95,72,30,10,5],
  },
  {
    name: "Coorg",
    wikiTitle: "Kodagu",
    fallback: "linear-gradient(135deg,#16a34a 0%,#14532d 100%)",
    seasons: ["monsoon", "summer", "winter"],
    categories: ["mountains", "nature"],
    budget: "moderate", popularity: 78,
    tags: ["Coffee", "Misty Hills", "Waterfalls", "Wildlife"],
    description: "Scotland of India — emerald coffee estates, misty valleys, and cascading waterfalls that enchant in every season.",
    trend: [48,42,52,58,62,82,75,70,65,72,68,55],
  },
  {
    name: "Rishikesh",
    wikiTitle: "Rishikesh",
    fallback: "linear-gradient(135deg,#0891b2 0%,#164e63 100%)",
    seasons: ["summer", "winter"],
    categories: ["spiritual", "adventure"],
    budget: "budget", popularity: 75,
    tags: ["Yoga", "Rafting", "Spiritual", "Trekking"],
    description: "The Yoga Capital of the World. Rafting on the Ganga, ashrams on the ghats, and Himalayan foothills at your doorstep.",
    trend: [60,72,80,75,65,55,30,35,70,82,78,65],
  },
  {
    name: "Varanasi",
    wikiTitle: "Varanasi",
    fallback: "linear-gradient(135deg,#d97706 0%,#92400e 100%)",
    seasons: ["winter"],
    categories: ["spiritual", "heritage", "cultural"],
    budget: "budget", popularity: 73,
    tags: ["Spiritual", "Ghats", "Culture", "History"],
    description: "One of the oldest cities on Earth. The Ganga Aarti, winding lanes, and ancient temples make Varanasi the soul of India.",
    trend: [85,78,65,40,28,20,18,22,42,72,80,88],
  },
  {
    name: "Andaman Islands",
    wikiTitle: "Andaman and Nicobar Islands",
    fallback: "linear-gradient(135deg,#06b6d4 0%,#0e7490 100%)",
    seasons: ["winter", "summer"],
    categories: ["beaches", "adventure"],
    budget: "luxury", popularity: 70,
    tags: ["Scuba", "Snorkelling", "Pristine Beaches", "Coral"],
    description: "Crystal-clear turquoise waters, untouched coral reefs, and white-sand beaches at the edge of the Bay of Bengal.",
    trend: [90,85,78,65,50,15,10,12,48,75,85,92],
  },
  {
    name: "Munnar",
    wikiTitle: "Munnar",
    fallback: "linear-gradient(135deg,#4ade80 0%,#166534 100%)",
    seasons: ["monsoon", "summer", "winter"],
    categories: ["mountains", "nature"],
    budget: "moderate", popularity: 68,
    tags: ["Tea Gardens", "Misty", "Wildlife", "Scenic"],
    description: "Rolling tea estates stretching into the clouds, rare Nilgiri tahrs, and cool mountain air — Munnar is Kerala's crown jewel.",
    trend: [55,48,58,62,70,78,72,68,65,72,62,58],
  },
  {
    name: "Udaipur",
    wikiTitle: "Udaipur",
    fallback: "linear-gradient(135deg,#818cf8 0%,#4f46e5 100%)",
    seasons: ["winter"],
    categories: ["heritage", "cultural"],
    budget: "moderate", popularity: 65,
    tags: ["Lakes", "Palaces", "Romance", "Rajputana"],
    description: "The City of Lakes. Lake Pichola reflecting marble palaces at sunset — Udaipur is arguably India's most romantic city.",
    trend: [78,70,60,38,25,18,15,18,38,65,72,82],
  },
  {
    name: "Shimla",
    wikiTitle: "Shimla",
    fallback: "linear-gradient(135deg,#7dd3fc 0%,#1e40af 100%)",
    seasons: ["summer", "winter"],
    categories: ["mountains"],
    budget: "budget", popularity: 62,
    tags: ["Colonial", "Snow", "Mall Road", "Toy Train"],
    description: "The Queen of Hills. British-era architecture, Mall Road at dusk, and toy-train rides through deodar forests.",
    trend: [68,62,55,42,38,80,88,85,72,60,58,65],
  },
  {
    name: "Hampi",
    wikiTitle: "Hampi",
    fallback: "linear-gradient(135deg,#a16207 0%,#78350f 100%)",
    seasons: ["winter"],
    categories: ["heritage", "adventure"],
    budget: "budget", popularity: 58,
    tags: ["Ruins", "Boulders", "UNESCO", "Ancient"],
    description: "A surreal boulder-strewn landscape holding the ruins of the mighty Vijayanagara Empire. History carved in stone.",
    trend: [75,68,55,30,20,15,12,15,32,65,72,78],
  },
  {
    name: "Pondicherry",
    wikiTitle: "Promenade Beach, Pondicherry",
    fallback: "linear-gradient(135deg,#0891b2 0%,#164e63 100%)",
    seasons: ["winter", "summer"],
    categories: ["beaches", "spiritual", "cultural"],
    budget: "budget", popularity: 55,
    tags: ["French Quarter", "Beaches", "Cafés", "Spiritual"],
    description: "A French colonial town with Tamil soul. Boulevards lined with bougainvillea, Auroville, and serene promenade beaches.",
    trend: [70,65,60,50,40,30,25,28,45,62,68,72],
  },
  {
    name: "Alleppey",
    wikiTitle: "Alappuzha",
    fallback: "linear-gradient(135deg,#059669 0%,#064e3b 100%)",
    seasons: ["monsoon", "winter"],
    categories: ["nature", "beaches"],
    budget: "moderate", popularity: 52,
    tags: ["Backwaters", "Houseboat", "Canals", "Ayurveda"],
    description: "The Venice of the East. Drifting on a houseboat through Kerala's emerald backwaters is a once-in-a-lifetime experience.",
    trend: [50,45,52,60,65,75,68,62,58,62,58,52],
  },
  {
    name: "Meghalaya",
    wikiTitle: "Meghalaya",
    fallback: "linear-gradient(135deg,#34d399 0%,#065f46 100%)",
    seasons: ["monsoon", "summer"],
    categories: ["mountains", "nature", "adventure"],
    budget: "moderate", popularity: 48,
    tags: ["Caves", "Living Roots", "Clouds", "Waterfalls"],
    description: "The Abode of Clouds. Living root bridges, transparent rivers, and the world's wettest village — raw nature at its finest.",
    trend: [28,30,38,48,65,90,95,92,78,55,38,30],
  },
  {
    name: "Ranthambore",
    wikiTitle: "Ranthambore National Park",
    fallback: "linear-gradient(135deg,#65a30d 0%,#3f6212 100%)",
    seasons: ["winter", "summer"],
    categories: ["nature", "adventure"],
    budget: "luxury", popularity: 45,
    tags: ["Tigers", "Safari", "Wildlife", "National Park"],
    description: "One of India's finest tiger reserves. A dawn jeep safari through ancient ruins and dense forests is unforgettable.",
    trend: [82,75,68,55,42,15,8,10,42,72,80,85],
  },
  {
    name: "Kutch",
    wikiTitle: "Kutch district",
    fallback: "linear-gradient(135deg,#f59e0b 0%,#78350f 100%)",
    seasons: ["winter"],
    categories: ["heritage", "cultural", "nature"],
    budget: "budget", popularity: 42,
    tags: ["Rann", "Handicrafts", "Flamingos", "Desert"],
    description: "The Great Rann of Kutch — an infinite white salt desert under a full moon. Gujarat's most surreal natural wonder.",
    trend: [75,60,45,20,15,10,8,10,22,55,80,85],
  },
  {
    name: "Spiti Valley",
    wikiTitle: "Spiti Valley",
    fallback: "linear-gradient(135deg,#94a3b8 0%,#1e293b 100%)",
    seasons: ["summer"],
    categories: ["mountains", "spiritual", "adventure"],
    budget: "moderate", popularity: 40,
    tags: ["Remote", "Monasteries", "High Altitude", "Raw"],
    description: "The Middle Land. Spiti's stark, moonlit valleys and centuries-old monasteries feel like the edge of the world.",
    trend: [5,5,8,15,45,85,95,90,65,20,8,5],
  },
  {
    name: "Agra",
    wikiTitle: "Agra",
    fallback: "linear-gradient(135deg,#f59e0b 0%,#78350f 100%)",
    seasons: ["winter", "summer"],
    categories: ["heritage"],
    budget: "budget", popularity: 80,
    tags: ["Taj Mahal", "Mughal", "UNESCO", "Architecture"],
    description: "Home to the Taj Mahal — the greatest monument to love ever built. Agra's Mughal legacy is unmatched anywhere on Earth.",
    trend: [85,80,70,55,40,28,22,25,48,75,82,88],
  },
  {
    name: "Amritsar",
    wikiTitle: "Amritsar",
    fallback: "linear-gradient(135deg,#f59e0b 0%,#b45309 100%)",
    seasons: ["winter", "summer"],
    categories: ["spiritual", "heritage", "cultural"],
    budget: "budget", popularity: 72,
    tags: ["Golden Temple", "Wagah Border", "Langar", "Sikh Heritage"],
    description: "The Golden Temple shimmering on sacred water at dawn. Amritsar is the spiritual capital of the Sikh world.",
    trend: [80,75,65,50,40,30,25,28,45,72,80,85],
  },
  {
    name: "Darjeeling",
    wikiTitle: "Darjeeling",
    fallback: "linear-gradient(135deg,#84cc16 0%,#365314 100%)",
    seasons: ["summer", "monsoon"],
    categories: ["mountains", "nature"],
    budget: "budget", popularity: 60,
    tags: ["Tea", "Toy Train", "Kanchenjunga View", "Colonial"],
    description: "The Queen of the Hills. Sunrise over Kanchenjunga, world-famous tea estates, and the charming Darjeeling Himalayan Railway.",
    trend: [45,50,70,75,72,60,55,50,45,65,60,50],
  },
  {
    name: "Mysuru",
    wikiTitle: "Mysore",
    fallback: "linear-gradient(135deg,#7c3aed 0%,#4c1d95 100%)",
    seasons: ["winter"],
    categories: ["heritage", "cultural"],
    budget: "budget", popularity: 63,
    tags: ["Palace", "Dasara", "Incense", "Silk"],
    description: "The City of Palaces. Mysore Palace lit up by 100,000 bulbs during Dasara is one of the most spectacular sights in India.",
    trend: [65,60,52,38,28,20,18,20,35,90,75,68],
  },
  {
    name: "Ooty",
    wikiTitle: "Ooty",
    fallback: "linear-gradient(135deg,#22c55e 0%,#14532d 100%)",
    seasons: ["summer", "monsoon"],
    categories: ["mountains", "nature"],
    budget: "budget", popularity: 58,
    tags: ["Nilgiris", "Rose Garden", "Toy Train", "Tea"],
    description: "The Blue Mountains of the Nilgiris, rose gardens in full bloom, and a heritage toy train weaving through eucalyptus forests.",
    trend: [45,48,55,72,80,78,60,55,50,65,62,50],
  },
  {
    name: "Jodhpur",
    wikiTitle: "Jodhpur",
    fallback: "linear-gradient(135deg,#3b82f6 0%,#1e3a8a 100%)",
    seasons: ["winter"],
    categories: ["heritage", "cultural"],
    budget: "budget", popularity: 55,
    tags: ["Blue City", "Mehrangarh", "Desert", "Rajputana"],
    description: "The Blue City. Mehrangarh Fort rising dramatically above a sea of indigo-painted houses — Jodhpur is Rajasthan's most dramatic city.",
    trend: [75,70,60,38,25,18,15,18,38,68,72,78],
  },
  {
    name: "Pushkar",
    wikiTitle: "Pushkar",
    fallback: "linear-gradient(135deg,#fb923c 0%,#9a3412 100%)",
    seasons: ["winter"],
    categories: ["spiritual", "cultural"],
    budget: "budget", popularity: 48,
    tags: ["Camel Fair", "Sacred Lake", "Brahma Temple", "Desert"],
    description: "One of the holiest towns in India, built around a sacred lake. The Pushkar Camel Fair in November is a spectacle like no other.",
    trend: [60,55,45,28,18,12,10,12,30,65,90,68],
  },
  {
    name: "Gangtok",
    wikiTitle: "Gangtok",
    fallback: "linear-gradient(135deg,#818cf8 0%,#312e81 100%)",
    seasons: ["summer", "monsoon"],
    categories: ["mountains", "spiritual"],
    budget: "moderate", popularity: 52,
    tags: ["Monasteries", "Kanchenjunga", "Ropeways", "Scenic"],
    description: "Sikkim's capital perched in the clouds. Buddhist monasteries, views of Kanchenjunga, and a vibrant MG Marg market await.",
    trend: [30,35,55,72,78,65,45,40,65,75,68,38],
  },
  {
    name: "Kochi",
    wikiTitle: "Kochi",
    fallback: "linear-gradient(135deg,#0ea5e9 0%,#075985 100%)",
    seasons: ["winter", "summer"],
    categories: ["heritage", "cultural", "beaches"],
    budget: "moderate", popularity: 60,
    tags: ["Fort Kochi", "Chinese Nets", "Backwaters", "Spice Trade"],
    description: "The Queen of the Arabian Sea. Dutch, Portuguese, and British layers of history sit side-by-side in Fort Kochi's charming streets.",
    trend: [75,70,65,55,42,30,22,25,45,68,72,78],
  },
  {
    name: "Kolkata",
    wikiTitle: "Kolkata",
    fallback: "linear-gradient(135deg,#f43f5e 0%,#881337 100%)",
    seasons: ["winter"],
    categories: ["cultural", "heritage"],
    budget: "budget", popularity: 55,
    tags: ["Durga Puja", "Victoria Memorial", "Art", "Street Food"],
    description: "The City of Joy. Kolkata's colonial grandeur, vibrant festivals, intellectual cafés, and legendary street food are wholly unique.",
    trend: [65,58,50,35,25,18,15,18,38,90,72,68],
  },
  {
    name: "Auli",
    wikiTitle: "Auli",
    fallback: "linear-gradient(135deg,#bae6fd 0%,#1e40af 100%)",
    seasons: ["winter", "summer"],
    categories: ["mountains", "adventure"],
    budget: "moderate", popularity: 42,
    tags: ["Skiing", "Snow", "Gondola", "Nanda Devi View"],
    description: "India's premier ski destination at 2,519 m. The cable car ride to Auli's slopes with Nanda Devi as backdrop is breathtaking.",
    trend: [90,85,75,45,35,65,80,75,55,35,40,82],
  },
  {
    name: "Varkala",
    wikiTitle: "Varkala",
    fallback: "linear-gradient(135deg,#0ea5e9 0%,#7c3aed 100%)",
    seasons: ["winter", "summer"],
    categories: ["beaches", "spiritual"],
    budget: "budget", popularity: 45,
    tags: ["Cliffside Beach", "Ayurveda", "Sunset", "Backpacker"],
    description: "A stunning cliff-top beach where red laterite rocks drop into the Arabian Sea. Varkala blends yoga, Ayurveda, and sunsets perfectly.",
    trend: [78,72,68,55,40,25,15,18,35,62,72,80],
  },
  {
    name: "Mahabalipuram",
    wikiTitle: "Mahabalipuram",
    fallback: "linear-gradient(135deg,#0891b2 0%,#713f12 100%)",
    seasons: ["winter", "summer"],
    categories: ["heritage", "beaches"],
    budget: "budget", popularity: 45,
    tags: ["Shore Temple", "Rock Carvings", "UNESCO", "Beach"],
    description: "Pallava-era stone temples carved into coastal boulders, lapped by the Bay of Bengal. A UNESCO World Heritage Site.",
    trend: [72,68,60,45,35,25,20,22,38,65,70,75],
  },
  {
    name: "Jim Corbett",
    wikiTitle: "Jim Corbett National Park",
    fallback: "linear-gradient(135deg,#4d7c0f 0%,#14532d 100%)",
    seasons: ["winter", "summer"],
    categories: ["nature", "adventure"],
    budget: "luxury", popularity: 48,
    tags: ["Tigers", "Elephants", "Safari", "Birdwatching"],
    description: "India's oldest national park, established in 1936. Dense sal forests, the Ramganga river, and resident Bengal tigers make it legendary.",
    trend: [78,75,68,58,48,35,5,5,5,42,70,80],
  },
];

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

// ─────────────────────────────────────────────────────────────────────────────
// WikiImage — fetches the Wikipedia article lead image for each destination.
// Guarantees a correct, relevant photo for every city.
// Falls back to a gradient while loading or if the API is unavailable.
// ─────────────────────────────────────────────────────────────────────────────
function WikiImage({ title, alt, fallback }) {
  const [imgSrc,  setImgSrc]  = useState(null);
  const [backup,  setBackup]  = useState(null); // original thumb size fallback
  const [failed,  setFailed]  = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setImgSrc(null); setBackup(null); setFailed(false); setLoading(true);
    fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`)
      .then(r => r.json())
      .then(data => {
        if (cancelled) return;
        if (data.thumbnail?.source) {
          const orig = data.thumbnail.source;
          const big  = orig.replace(/\/\d+px-/, "/600px-");
          setBackup(orig);
          setImgSrc(big);
        } else {
          setFailed(true);
        }
        setLoading(false);
      })
      .catch(() => { if (!cancelled) { setFailed(true); setLoading(false); } });
    return () => { cancelled = true; };
  }, [title]);

  const handleError = () => {
    // If 600px upscale fails, retry with original thumbnail size
    if (backup && imgSrc !== backup) { setImgSrc(backup); }
    else { setFailed(true); }
  };

  if (loading || failed || !imgSrc) {
    return (
      <div style={{ width: "100%", height: "100%", background: fallback,
        display: "flex", alignItems: "center", justifyContent: "center" }}>
        {loading && (
          <div style={{ width: 24, height: 24, borderRadius: "50%",
            border: "2.5px solid rgba(255,255,255,0.2)",
            borderTopColor: "rgba(255,255,255,0.7)",
            animation: "spin .8s linear infinite" }} />
        )}
      </div>
    );
  }

  return (
    <img src={imgSrc} alt={alt} onError={handleError}
      style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform .4s ease" }}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────────────────
const Styles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800;900&family=Lora:ital,wght@0,400;0,600;1,400;1,600&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --accent:#E8341A; --accent-hover:#c9270e; --gold:#F5A623;
      --white:#FFFFFF; --bg:#0D0D0D; --surface:#161616; --surface2:#1e1e1e;
      --border:rgba(255,255,255,0.08); --border-hover:rgba(255,255,255,0.18);
      --text-muted:rgba(255,255,255,0.45); --text-sub:rgba(255,255,255,0.65);
      --nav-h:68px;
    }
    html,body{margin:0;padding:0;width:100%;min-height:100vh;overflow-x:hidden;background:var(--bg);font-family:'Sora',sans-serif;color:var(--white);}
    ::-webkit-scrollbar{width:6px} ::-webkit-scrollbar-track{background:var(--bg)} ::-webkit-scrollbar-thumb{background:#333;border-radius:3px}
    @keyframes fadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
    @keyframes spin{to{transform:rotate(360deg)}}

    /* NAV */
    .sg-nav{position:fixed;top:0;left:0;right:0;height:var(--nav-h);display:flex;align-items:center;justify-content:space-between;padding:0 5%;z-index:1000;background:rgba(10,10,10,0.94);backdrop-filter:blur(20px);border-bottom:1px solid var(--border);}
    .sg-nav-logo{display:flex;align-items:center;gap:9px;cursor:pointer;}
    .sg-nav-links{position:absolute;left:50%;transform:translateX(-50%);display:flex;align-items:center;gap:30px;}
    .sg-nav-link{color:var(--text-sub);text-decoration:none;font-size:14px;font-weight:500;position:relative;transition:color .2s;cursor:pointer;}
    .sg-nav-link::after{content:'';position:absolute;bottom:-3px;left:0;width:0;height:1.5px;background:var(--gold);transition:width .25s;}
    .sg-nav-link:hover{color:#fff} .sg-nav-link:hover::after,.sg-nav-link.active::after{width:100%}
    .sg-nav-link.active{color:#fff}
    .sg-nav-back{display:flex;align-items:center;gap:7px;padding:8px 20px;border-radius:50px;border:1.5px solid rgba(255,255,255,0.2);background:rgba(255,255,255,0.07);color:#fff;font-family:'Sora',sans-serif;font-size:13.5px;font-weight:600;cursor:pointer;transition:all .2s;}
    .sg-nav-back:hover{background:rgba(255,255,255,0.13);}

    /* HERO */
    .sg-hero{position:relative;height:260px;display:flex;align-items:flex-end;overflow:hidden;background:#000;margin-top:var(--nav-h);}
    .sg-hero-bg{position:absolute;inset:0;background:url('https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1600&q=80') center/cover;opacity:0.22;animation:heroZoom 14s ease-in-out forwards;}
    @keyframes heroZoom{from{transform:scale(1)}to{transform:scale(1.07)}}
    .sg-hero-overlay{position:absolute;inset:0;background:linear-gradient(to top,rgba(13,13,13,1) 0%,rgba(13,13,13,0.1) 60%,transparent 100%);}
    .sg-hero-content{position:relative;z-index:2;padding:0 6% 36px;animation:fadeUp .7s cubic-bezier(0.22,1,0.36,1) both;}
    .sg-hero-eyebrow{font-size:11px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:var(--gold);margin-bottom:10px;}
    .sg-hero-title{font-size:clamp(1.9rem,4.5vw,3rem);font-weight:900;letter-spacing:-1.5px;color:#fff;line-height:1.05;}
    .sg-hero-sub{margin-top:10px;font-size:14px;color:var(--text-sub);max-width:500px;line-height:1.6;}

    /* BODY */
    .sg-body{max-width:1280px;margin:0 auto;padding:40px 5% 100px;}

    /* FILTER PANEL */
    .sg-filter-panel{background:var(--surface);border:1px solid var(--border);border-radius:20px;padding:28px 28px 24px;margin-bottom:36px;animation:fadeUp .5s ease both;}
    .sg-filter-section{margin-bottom:22px;}
    .sg-filter-section:last-child{margin-bottom:0;}
    .sg-filter-label{font-size:10.5px;font-weight:700;letter-spacing:1.8px;text-transform:uppercase;color:var(--text-muted);margin-bottom:12px;display:flex;align-items:center;gap:8px;}
    .sg-chips{display:flex;flex-wrap:wrap;gap:9px;}
    .sg-chip{display:inline-flex;align-items:center;gap:7px;padding:8px 16px;border-radius:50px;border:1.5px solid var(--border);background:transparent;color:var(--text-sub);font-family:'Sora',sans-serif;font-size:13px;font-weight:600;cursor:pointer;transition:all .18s;white-space:nowrap;}
    .sg-chip:hover{border-color:var(--border-hover);color:#fff;background:rgba(255,255,255,0.04);}
    .sg-chip.active{border-color:var(--gold);background:rgba(245,166,35,0.12);color:var(--gold);}
    .sg-chip.active-accent{border-color:var(--accent);background:rgba(232,52,26,0.12);color:var(--accent);}
    .sg-chip.active-blue{border-color:#60a5fa;background:rgba(96,165,250,0.1);color:#60a5fa;}
    .sg-filter-divider{height:1px;background:var(--border);margin:20px 0;}
    .sg-reset{font-size:12px;font-weight:700;color:var(--text-muted);background:none;border:none;font-family:'Sora',sans-serif;cursor:pointer;padding:0;transition:color .15s;}
    .sg-reset:hover{color:#fff;}

    /* RESULTS HEADER */
    .sg-results-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:22px;}
    .sg-results-count{font-size:13px;color:var(--text-muted);font-weight:500;}
    .sg-results-count strong{color:#fff;}
    .sg-sort{display:flex;align-items:center;gap:8px;font-size:13px;color:var(--text-sub);}
    .sg-sort-btn{background:var(--surface2);border:1px solid var(--border);border-radius:8px;color:var(--text-sub);font-family:'Sora',sans-serif;font-size:12.5px;font-weight:600;padding:6px 14px;cursor:pointer;transition:all .15s;}
    .sg-sort-btn.active{background:rgba(245,166,35,0.1);border-color:rgba(245,166,35,0.3);color:var(--gold);}

    /* CARDS GRID */
    .sg-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(310px,1fr));gap:22px;margin-bottom:60px;}
    .sg-card{background:var(--surface);border:1px solid var(--border);border-radius:20px;overflow:hidden;transition:border-color .25s,transform .25s;animation:fadeUp .4s ease both;}
    .sg-card:hover{border-color:rgba(245,166,35,0.3);transform:translateY(-3px);}
    .sg-card-img{position:relative;height:190px;overflow:hidden;}
    .sg-card-img img{width:100%;height:100%;object-fit:cover;transition:transform .4s ease;}
    .sg-card:hover .sg-card-img img{transform:scale(1.05);}
    .sg-card-overlay{position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,0.55) 0%,transparent 55%);}
    .sg-card-badges{position:absolute;top:12px;left:12px;display:flex;gap:6px;flex-wrap:wrap;}
    .sg-badge{padding:4px 10px;border-radius:20px;font-size:10.5px;font-weight:700;letter-spacing:.3px;backdrop-filter:blur(6px);}
    .sg-badge.budget{background:rgba(34,197,94,0.85);color:#fff;}
    .sg-badge.moderate{background:rgba(245,166,35,0.85);color:#000;}
    .sg-badge.luxury{background:rgba(167,139,250,0.85);color:#fff;}
    .sg-badge.season{background:rgba(0,0,0,0.55);color:rgba(255,255,255,0.9);border:1px solid rgba(255,255,255,0.15);}
    .sg-card-pop{position:absolute;bottom:10px;right:12px;display:flex;align-items:center;gap:5px;font-size:11px;font-weight:700;color:#fff;background:rgba(0,0,0,0.5);backdrop-filter:blur(4px);padding:3px 9px;border-radius:20px;}
    .sg-pop-dot{width:6px;height:6px;border-radius:50%;background:var(--gold);}
    .sg-card-body{padding:18px 20px 20px;}
    .sg-card-name{font-size:17px;font-weight:800;color:#fff;letter-spacing:-.4px;margin-bottom:6px;}
    .sg-card-desc{font-size:12.5px;color:var(--text-sub);line-height:1.6;margin-bottom:14px;}
    .sg-card-tags{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:14px;}
    .sg-tag{padding:4px 10px;background:var(--surface2);border:1px solid var(--border);border-radius:20px;font-size:11px;font-weight:600;color:var(--text-sub);}
    .sg-card-pop-bar{height:4px;background:var(--surface2);border-radius:4px;overflow:hidden;margin-bottom:4px;}
    .sg-card-pop-fill{height:100%;border-radius:4px;background:linear-gradient(90deg,var(--gold),var(--accent));}
    .sg-card-pop-label{font-size:10.5px;color:var(--text-muted);font-weight:600;}
    .sg-card-btn{width:100%;margin-top:14px;padding:10px;border-radius:10px;border:none;background:rgba(245,166,35,0.1);border:1px solid rgba(245,166,35,0.2);color:var(--gold);font-family:'Sora',sans-serif;font-size:13px;font-weight:700;cursor:pointer;transition:all .18s;}
    .sg-card-btn:hover{background:rgba(245,166,35,0.18);border-color:rgba(245,166,35,0.4);}

    /* EMPTY STATE */
    .sg-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:80px 20px;gap:14px;color:var(--text-muted);}
    .sg-empty-icon{font-size:52px;opacity:.4;}
    .sg-empty-text{font-size:15px;font-weight:600;color:var(--text-sub);}
    .sg-empty-sub{font-size:13px;text-align:center;max-width:300px;line-height:1.6;}

    /* ANALYTICS SECTION */
    .sg-analytics{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:40px;}
    @media(max-width:900px){.sg-analytics{grid-template-columns:1fr;}}
    .sg-chart-card{background:var(--surface);border:1px solid var(--border);border-radius:20px;overflow:hidden;}
    .sg-chart-header{padding:20px 24px 16px;border-bottom:1px solid var(--border);}
    .sg-chart-title{font-size:14px;font-weight:700;color:#fff;display:flex;align-items:center;gap:9px;}
    .sg-chart-icon{width:30px;height:30px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:14px;}
    .sg-chart-icon.gold{background:rgba(245,166,35,0.12);}
    .sg-chart-icon.blue{background:rgba(96,165,250,0.12);}
    .sg-chart-sub{font-size:12px;color:var(--text-muted);margin-top:3px;}
    .sg-chart-body{padding:20px 16px 16px;}

    /* SECTION TITLE */
    .sg-section-title{font-size:20px;font-weight:800;color:#fff;letter-spacing:-.5px;margin-bottom:6px;}
    .sg-section-sub{font-size:13px;color:var(--text-muted);margin-bottom:28px;}

    /* Month tabs */
    .sg-month-tabs{display:flex;flex-wrap:wrap;gap:6px;padding:16px 16px 0;}
    .sg-month-tab{padding:5px 11px;border-radius:8px;border:1px solid var(--border);background:var(--surface2);color:var(--text-muted);font-family:'Sora',sans-serif;font-size:11.5px;font-weight:700;cursor:pointer;transition:all .15s;}
    .sg-month-tab:hover{color:#fff;border-color:var(--border-hover);}
    .sg-month-tab.active{background:rgba(96,165,250,0.15);border-color:rgba(96,165,250,0.4);color:#60a5fa;}

    /* RECHARTS overrides */
    .recharts-tooltip-wrapper .recharts-default-tooltip{background:#1e1e1e !important;border:1px solid rgba(255,255,255,0.1) !important;border-radius:10px !important;font-family:'Sora',sans-serif !important;}
    .recharts-tooltip-label{color:#fff !important;font-weight:700 !important;font-size:13px !important;}
    .recharts-tooltip-item{color:rgba(255,255,255,0.7) !important;font-size:12px !important;}

    @media(max-width:768px){
      .sg-nav-links{display:none;}
      .sg-grid{grid-template-columns:1fr;}
      .sg-results-header{flex-direction:column;align-items:flex-start;gap:12px;}
    }
  `}</style>
);

// ─────────────────────────────────────────────────────────────────────────────
// CUSTOM TOOLTIP for charts
// ─────────────────────────────────────────────────────────────────────────────
const BarTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#1e1e1e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "10px 14px", fontFamily: "'Sora',sans-serif" }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.65)" }}>Popularity: <strong style={{ color: "#F5A623" }}>{payload[0].value}%</strong></div>
    </div>
  );
};

const TrendTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#1e1e1e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "10px 14px", fontFamily: "'Sora',sans-serif" }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 6 }}>{label}</div>
      {payload.map(p => (
        <div key={p.name} style={{ fontSize: 12, color: p.color, marginBottom: 2 }}>
          {p.name}: <strong>{p.value}</strong>
        </div>
      ))}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
const SEASON_OPTS = [
  { id: "summer",  emoji: "☀️", label: "Summer" },
  { id: "winter",  emoji: "❄️", label: "Winter" },
  { id: "monsoon", emoji: "🌧️", label: "Monsoon" },
];
const CATEGORY_OPTS = [
  { id: "beaches",   emoji: "🏖️", label: "Beaches" },
  { id: "mountains", emoji: "⛰️", label: "Mountains" },
  { id: "spiritual", emoji: "🕌", label: "Spiritual" },
  { id: "heritage",  emoji: "🏛️", label: "Heritage" },
  { id: "adventure", emoji: "🧗", label: "Adventure" },
  { id: "nature",    emoji: "🌿", label: "Nature" },
  { id: "cultural",  emoji: "🎭", label: "Cultural" },
];

const TREND_COLORS = ["#F5A623", "#E8341A", "#60a5fa", "#4ade80", "#c084fc"];

const SORT_OPTS = [
  { id: "popularity", label: "Most Popular" },
  { id: "budget-asc", label: "Budget First" },
  { id: "name",       label: "A – Z" },
];

export default function Suggestions() {
  const navigate = useNavigate();

  const [season,        setSeason]        = useState(null);
  const [category,      setCategory]      = useState(null);
  const [sortBy,        setSortBy]        = useState("popularity");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());

  const toggle = (val, current, set) => set(current === val ? null : val);

  const resetAll = () => { setSeason(null); setCategory(null); };

  // ── Filtered + sorted destinations ──
  const filtered = useMemo(() => {
    let list = DESTINATIONS.filter(d => {
      if (season   && !d.seasons.includes(season))       return false;
      if (category && !d.categories.includes(category))  return false;
      return true;
    });
    if (sortBy === "popularity") list = [...list].sort((a, b) => b.popularity - a.popularity);
    if (sortBy === "budget-asc") {
      const rank = { budget: 0, moderate: 1, luxury: 2 };
      list = [...list].sort((a, b) => rank[a.budget] - rank[b.budget]);
    }
    if (sortBy === "name") list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [season, category, sortBy]);

  // ── Popularity bar chart data (top 10 from filtered, or top 10 overall if no filter) ──
  const barData = useMemo(() => {
    const base = filtered.length > 0 ? filtered : DESTINATIONS;
    return [...base]
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, 10)
      .map(d => ({ name: d.name, popularity: d.popularity }));
  }, [filtered]);

  // ── Top 5 destinations for the selected month ──
  const monthTop5Data = useMemo(() => {
    const base = filtered.length > 0 ? filtered : DESTINATIONS;
    return [...base]
      .map(d => ({ name: d.name, visits: d.trend[selectedMonth] }))
      .sort((a, b) => b.visits - a.visits)
      .slice(0, 5);
  }, [filtered, selectedMonth]);

  const budgeLabel = { budget: "Budget", moderate: "Moderate", luxury: "Luxury" };

  return (
    <>
      <Styles />

      {/* ── NAVBAR ── */}
      <nav className="sg-nav">
        <div className="sg-nav-logo" onClick={() => navigate("/")}>
          <VeloraLogo size={32} />
        </div>
        <div className="sg-nav-links">
          <span className="sg-nav-link" onClick={() => navigate("/")}>Home</span>
          <span className="sg-nav-link" onClick={() => navigate("/my-trips")}>My Trips</span>
          <span className="sg-nav-link" onClick={() => navigate("/distance")}>Distance</span>
          <span className="sg-nav-link active">Suggestions</span>
        </div>
        <button className="sg-nav-back" onClick={() => navigate(-1)}>← Back</button>
      </nav>

      {/* ── HERO ── */}
      <section className="sg-hero">
        <div className="sg-hero-bg" />
        <div className="sg-hero-overlay" />
        <div className="sg-hero-content">
          <div className="sg-hero-eyebrow">✦ AI-Powered Travel Intelligence</div>
          <h1 className="sg-hero-title">Find Your Perfect<br />Destination</h1>
          <p className="sg-hero-sub">Filter by season, occasion, and preferences to discover destinations curated just for you — backed by real traveller trends.</p>
        </div>
      </section>

      <div className="sg-body">

        {/* ── FILTER PANEL ── */}
        <div className="sg-filter-panel">
          {/* Category */}
          <div className="sg-filter-section">
            <div className="sg-filter-label">🗂️ Category</div>
            <div className="sg-chips">
              {CATEGORY_OPTS.map(o => (
                <button
                  key={o.id}
                  className={`sg-chip${category === o.id ? " active" : ""}`}
                  onClick={() => toggle(o.id, category, setCategory)}
                >
                  {o.emoji} {o.label}
                </button>
              ))}
            </div>
          </div>

          <div className="sg-filter-divider" />

          {/* Season */}
          <div className="sg-filter-section" style={{ marginBottom: 0 }}>
            <div className="sg-filter-label">🗓️ Season</div>
            <div className="sg-chips">
              {SEASON_OPTS.map(o => (
                <button
                  key={o.id}
                  className={`sg-chip${season === o.id ? " active-accent" : ""}`}
                  onClick={() => toggle(o.id, season, setSeason)}
                >
                  {o.emoji} {o.label}
                </button>
              ))}
            </div>
          </div>

          {(season || category) && (
            <div style={{ marginTop: 18, display: "flex", justifyContent: "flex-end" }}>
              <button className="sg-reset" onClick={resetAll}>✕ Clear all filters</button>
            </div>
          )}
        </div>

        {/* ── RESULTS HEADER ── */}
        <div className="sg-results-header">
          <div className="sg-results-count">
            Showing <strong>{filtered.length}</strong> destination{filtered.length !== 1 ? "s" : ""}
            {season || category
              ? ` matching your filters`
              : ` across India`}
          </div>
          <div className="sg-sort">
            <span style={{ color: "var(--text-muted)", fontSize: 12 }}>Sort:</span>
            {SORT_OPTS.map(s => (
              <button
                key={s.id}
                className={`sg-sort-btn${sortBy === s.id ? " active" : ""}`}
                onClick={() => setSortBy(s.id)}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── DESTINATION CARDS ── */}
        {filtered.length === 0 ? (
          <div className="sg-empty">
            <div className="sg-empty-icon">🗺️</div>
            <div className="sg-empty-text">No destinations found</div>
            <div className="sg-empty-sub">Try adjusting your filters — we might not have a destination matching all criteria at once.</div>
            <button className="sg-chip" style={{ marginTop: 8 }} onClick={resetAll}>Clear filters</button>
          </div>
        ) : (
          <div className="sg-grid">
            {filtered.map((d, idx) => (
              <div key={d.name} className="sg-card" style={{ animationDelay: `${idx * 0.05}s` }}>
                <div className="sg-card-img">
                  <WikiImage title={d.wikiTitle} alt={d.name} fallback={d.fallback} />
                  <div className="sg-card-overlay" />
                  <div className="sg-card-badges">
                    <span className={`sg-badge ${d.budget}`}>{budgeLabel[d.budget]}</span>
                  </div>
                  <div className="sg-card-pop">
                    <span className="sg-pop-dot" />
                    {d.popularity}% popular
                  </div>
                </div>
                <div className="sg-card-body">
                  <div className="sg-card-name">{d.name}</div>
                  <div className="sg-card-desc">{d.description}</div>
                  <div className="sg-card-tags">
                    {d.tags.map(t => <span key={t} className="sg-tag">{t}</span>)}
                  </div>
                  <div className="sg-card-pop-bar">
                    <div className="sg-card-pop-fill" style={{ width: `${d.popularity}%` }} />
                  </div>
                  <div className="sg-card-pop-label">Popularity index: {d.popularity}/100</div>
                  <button className="sg-card-btn" onClick={() => navigate("/explore", { state: { query: d.name } })}>
                    Explore {d.name} →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── ANALYTICS SECTION ── */}
        <div style={{ marginBottom: 20 }}>
          <div className="sg-section-title">📊 Destination Analytics</div>
          <div className="sg-section-sub">Popularity rankings and month-wise visitor trends for top destinations</div>
        </div>

        <div className="sg-analytics">
          {/* Popularity Bar Chart */}
          <div className="sg-chart-card">
            <div className="sg-chart-header">
              <div className="sg-chart-title">
                <div className="sg-chart-icon gold">📊</div>
                City Popularity Index
              </div>
              <div className="sg-chart-sub">% popularity score — based on visitor volume &amp; ratings</div>
            </div>
            <div className="sg-chart-body">
              <ResponsiveContainer width="100%" height={320}>
                <BarChart
                  data={barData}
                  layout="vertical"
                  margin={{ top: 0, right: 30, left: 10, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                  <XAxis
                    type="number" domain={[0, 100]}
                    tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11, fontFamily: "Sora,sans-serif" }}
                    tickLine={false} axisLine={false}
                    tickFormatter={v => `${v}%`}
                  />
                  <YAxis
                    type="category" dataKey="name" width={80}
                    tick={{ fill: "rgba(255,255,255,0.65)", fontSize: 12, fontFamily: "Sora,sans-serif" }}
                    tickLine={false} axisLine={false}
                  />
                  <Tooltip content={<BarTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
                  <Bar dataKey="popularity" radius={[0, 6, 6, 0]} barSize={18}>
                    {barData.map((_, i) => (
                      <Cell
                        key={i}
                        fill={`url(#barG${i % 3})`}
                        opacity={1 - i * 0.05}
                      />
                    ))}
                  </Bar>
                  <defs>
                    <linearGradient id="barG0" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#F5A623" />
                      <stop offset="100%" stopColor="#E8341A" />
                    </linearGradient>
                    <linearGradient id="barG1" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#F5A623" stopOpacity={0.85} />
                      <stop offset="100%" stopColor="#E8341A" stopOpacity={0.85} />
                    </linearGradient>
                    <linearGradient id="barG2" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#F5A623" stopOpacity={0.7} />
                      <stop offset="100%" stopColor="#E8341A" stopOpacity={0.7} />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Month-wise Top 5 Chart */}
          <div className="sg-chart-card">
            <div className="sg-chart-header">
              <div className="sg-chart-title">
                <div className="sg-chart-icon blue">📈</div>
                Top 5 Most Visited — {MONTHS[selectedMonth]}
              </div>
              <div className="sg-chart-sub">
                Select a month to see the 5 best destinations for that time
              </div>
            </div>
            {/* Month selector tabs */}
            <div className="sg-month-tabs">
              {MONTHS.map((m, i) => (
                <button
                  key={m}
                  className={`sg-month-tab${selectedMonth === i ? " active" : ""}`}
                  onClick={() => setSelectedMonth(i)}
                >
                  {m}
                </button>
              ))}
            </div>
            <div className="sg-chart-body" style={{ paddingTop: 20 }}>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart
                  data={monthTop5Data}
                  layout="vertical"
                  margin={{ top: 0, right: 40, left: 10, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                  <XAxis
                    type="number" domain={[0, 100]}
                    tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11, fontFamily: "Sora,sans-serif" }}
                    tickLine={false} axisLine={false}
                    tickFormatter={v => `${v}`}
                  />
                  <YAxis
                    type="category" dataKey="name" width={90}
                    tick={{ fill: "rgba(255,255,255,0.75)", fontSize: 12, fontFamily: "Sora,sans-serif" }}
                    tickLine={false} axisLine={false}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => active && payload?.length ? (
                      <div style={{ background: "#1e1e1e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "10px 14px", fontFamily: "'Sora',sans-serif" }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 4 }}>{label}</div>
                        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.65)" }}>
                          Visitor index: <strong style={{ color: TREND_COLORS[0] }}>{payload[0].value}</strong>/100
                        </div>
                      </div>
                    ) : null}
                    cursor={{ fill: "rgba(255,255,255,0.04)" }}
                  />
                  <Bar dataKey="visits" radius={[0, 6, 6, 0]} barSize={22}>
                    {monthTop5Data.map((_, i) => (
                      <Cell key={i} fill={TREND_COLORS[i]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* ── BEST MONTH CALLOUT ── */}
        <div style={{
          background: "linear-gradient(135deg, rgba(245,166,35,0.08) 0%, rgba(232,52,26,0.08) 100%)",
          border: "1px solid rgba(245,166,35,0.18)",
          borderRadius: 16, padding: "22px 28px",
          display: "flex", alignItems: "flex-start", gap: 18,
        }}>
          <div style={{ fontSize: 32 }}>💡</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#fff", marginBottom: 6 }}>Pro Travel Tip</div>
            <div style={{ fontSize: 13, color: "var(--text-sub)", lineHeight: 1.7 }}>
              <strong style={{ color: "var(--gold)" }}>October – February</strong> is the golden travel window for most of India.
              Beat the crowds by visiting{" "}
              <strong style={{ color: "#fff" }}>Ladakh in June–July</strong>,{" "}
              <strong style={{ color: "#fff" }}>Meghalaya in July–August</strong>, and{" "}
              <strong style={{ color: "#fff" }}>Goa in December–January</strong>.
              Use the month-wise chart above to spot peak and off-season opportunities.
            </div>
          </div>
        </div>

      </div>
    </>
  );
}
