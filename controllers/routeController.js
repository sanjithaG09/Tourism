const { getDistanceMatrix, getPointDistance } = require("../services/googleApi");
const { nearestNeighborMatrix, nearestNeighbor, totalRouteDistance } = require("../utils/tsp");

exports.optimizeRoute = async (req, res) => {
    try {
        const { locations, startPoint, endPoint } = req.body;

        if (!locations || locations.length < 2) {
            return res.status(400).json({ error: "At least 2 places required" });
        }

        const taggedPlaces = locations.map((p, i) => ({ ...p, _originalIndex: i }));

        let optimizedRoute;
        let distanceKm;
        let usedRealData = false;
        let distanceData = null;

        distanceData = await getDistanceMatrix(locations);

        if (distanceData && distanceData.matrix) {
            optimizedRoute = nearestNeighborMatrix(taggedPlaces, distanceData.matrix);
            distanceKm     = totalRouteDistance(optimizedRoute, distanceData.matrix);
            usedRealData   = true;
        } else {
            optimizedRoute = nearestNeighbor(taggedPlaces);
            distanceKm     = totalRouteDistance(optimizedRoute, null);
        }

        // Build response in the shape the frontend expects:
        // { route: [names], details: [{name, distToNext, timeToNext}], summary }
        const route = optimizedRoute.map(p => p.name);

        const details = optimizedRoute.map((p, i) => {
            if (i === optimizedRoute.length - 1) {
                return { name: p.name, distToNext: 0, timeToNext: 0 };
            }
            const fromIdx = p._originalIndex;
            const toIdx   = optimizedRoute[i + 1]._originalIndex;
            return {
                name:       p.name,
                distToNext: distanceData?.matrix?.[fromIdx]?.[toIdx] ?? 0,
                timeToNext: distanceData?.durationMatrix?.[fromIdx]?.[toIdx] ?? 0,
            };
        });

        // ── Start / End anchor legs ──
        // Calculate driving distance from startPoint → first stop and last stop → endPoint
        let startLeg = null;
        let endLeg   = null;

        const firstPlace = optimizedRoute[0];
        const lastPlace  = optimizedRoute[optimizedRoute.length - 1];

        if (startPoint?.value && firstPlace?.lat != null) {
            const firstCoord = `${firstPlace.lat},${firstPlace.lng}`;
            const legResult  = await getPointDistance(startPoint.value, firstCoord);
            if (legResult) {
                startLeg = {
                    distToNext:      legResult.distance.value,   // metres
                    timeToNext:      legResult.duration.value,   // seconds
                    resolvedAddress: legResult.originAddress,
                };
            }
        }

        if (endPoint?.value && lastPlace?.lat != null) {
            const lastCoord = `${lastPlace.lat},${lastPlace.lng}`;
            const legResult = await getPointDistance(lastCoord, endPoint.value);
            if (legResult) {
                endLeg = {
                    distToNext:      legResult.distance.value,
                    timeToNext:      legResult.duration.value,
                    resolvedAddress: legResult.destinationAddress,
                };
            }
        }

        res.json({
            route,
            details,
            startLeg,
            endLeg,
            summary: {
                totalDistanceKm: parseFloat(distanceKm),
                dataSource: usedRealData ? "Google Distance Matrix" : "Haversine (fallback)",
            },
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
