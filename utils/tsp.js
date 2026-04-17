// ✅ Haversine formula — fallback when Distance Matrix is unavailable
function haversine(a, b) {
    const R = 6371000; // Earth radius in metres
    const toRad = deg => (deg * Math.PI) / 180;
 
    const dLat = toRad(b.lat - a.lat);
    const dLng = toRad(b.lng - a.lng);
 
    const h =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) *
        Math.sin(dLng / 2) ** 2;
 
    return R * 2 * Math.asin(Math.sqrt(h));
}
 
// ✅ Nearest Neighbor TSP on a prebuilt distance matrix (from Distance Matrix API)
// matrix[i][j] = distance in metres from place i to place j
exports.nearestNeighborMatrix = (places, matrix) => {
    const n = places.length;
    const visited = new Array(n).fill(false);
    const route = [];
 
    let current = 0;
    visited[0] = true;
    route.push(places[0]);
 
    for (let step = 1; step < n; step++) {
        let nearest = -1;
        let minDist = Infinity;
 
        for (let j = 0; j < n; j++) {
            if (!visited[j] && matrix[current][j] < minDist) {
                minDist = matrix[current][j];
                nearest = j;
            }
        }
 
        visited[nearest] = true;
        route.push(places[nearest]);
        current = nearest;
    }
 
    return route;
};
 
// ✅ Fallback — Nearest Neighbor TSP using Haversine (no API needed)
exports.nearestNeighbor = (places) => {
    const n = places.length;
    const visited = new Array(n).fill(false);
    const route = [];
 
    let current = 0;
    visited[0] = true;
    route.push(places[0]);
 
    for (let step = 1; step < n; step++) {
        let nearest = -1;
        let minDist = Infinity;
 
        for (let j = 0; j < n; j++) {
            if (!visited[j]) {
                const d = haversine(places[current], places[j]);
                if (d < minDist) {
                    minDist = d;
                    nearest = j;
                }
            }
        }
 
        visited[nearest] = true;
        route.push(places[nearest]);
        current = nearest;
    }
 
    return route;
};
 
// ✅ Total route distance in km (for display)
exports.totalRouteDistance = (route, matrix) => {
    let total = 0;
    for (let i = 0; i < route.length - 1; i++) {
        const fromIdx = route[i]._originalIndex;
        const toIdx = route[i + 1]._originalIndex;
        if (matrix && fromIdx !== undefined && toIdx !== undefined) {
            total += matrix[fromIdx][toIdx];
        } else {
            total += haversine(route[i], route[i + 1]);
        }
    }
    return (total / 1000).toFixed(2); // km
};