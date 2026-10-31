"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.STORE_COORDINATES = void 0;
exports.calculateHaversineDistance = calculateHaversineDistance;
exports.calculateDeliveryPricing = calculateDeliveryPricing;
const db_1 = require("../config/db");
// Store Coordinates: Kanjikovil, Erode, Tamil Nadu
exports.STORE_COORDINATES = {
    latitude: 11.3925317,
    longitude: 77.6085870,
};
// Haversine formula to compute great-circle distance between two GPS coordinates in kilometers
function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const straightLineDistance = R * c;
    // Real road winding / driving factor in Indian suburban roads typically ranges from 1.2 to 1.35x
    const drivingFactor = 1.25;
    return Number((straightLineDistance * drivingFactor).toFixed(2));
}
async function calculateDeliveryPricing(pincode, userLat, userLng, cartSubtotal = 0) {
    let zones = [];
    let settings = null;
    if (db_1.isPostgresConnected) {
        zones = await db_1.prisma.deliveryZone.findMany({ where: { isActive: true } });
        settings = await db_1.prisma.storeSettings.findFirst();
    }
    else {
        zones = db_1.memDb.deliveryZones.filter(z => z.isActive);
        settings = db_1.memDb.storeSettings;
    }
    // Find matching delivery zone by PIN code
    let matchedZone = zones.find(z => z.pincode === pincode.trim());
    if (!matchedZone) {
        if (pincode.startsWith('638')) {
            matchedZone = {
                id: 'zone-erode-district',
                name: 'Erode District Regional Express',
                pincode: pincode.trim(),
                baseDistanceKm: 6.0,
                baseFee: 35.0,
                perKmFeeAbove: 6.0,
                minOrderValue: 150.0,
                maxDistanceKm: 30.0,
                freeDeliveryThreshold: 600.0,
                isActive: true,
            };
        }
        else {
            matchedZone = {
                id: 'zone-tn-standard',
                name: 'Tamil Nadu Regional Delivery',
                pincode: pincode.trim() || '638116',
                baseDistanceKm: 10.0,
                baseFee: 45.0,
                perKmFeeAbove: 6.0,
                minOrderValue: 200.0,
                maxDistanceKm: 50.0,
                freeDeliveryThreshold: 700.0,
                isActive: true,
            };
        }
    }
    // Calculate distance from store to delivery address
    let distanceKm = 2.5; // default reasonable distance for Kanjikovil zone if GPS coords omitted
    if (userLat && userLng) {
        const storeLat = settings?.storeLatitude ? Number(settings.storeLatitude) : exports.STORE_COORDINATES.latitude;
        const storeLng = settings?.storeLongitude ? Number(settings.storeLongitude) : exports.STORE_COORDINATES.longitude;
        distanceKm = calculateHaversineDistance(storeLat, storeLng, userLat, userLng);
    }
    const maxAllowedDistance = Number(matchedZone.maxDistanceKm || 15);
    if (distanceKm > maxAllowedDistance) {
        return {
            isServiceable: false,
            distanceKm,
            deliveryFee: 0,
            freeDeliveryThreshold: Number(matchedZone.freeDeliveryThreshold),
            minOrderValue: Number(matchedZone.minOrderValue),
            zoneName: matchedZone.name,
            pincode,
            reason: `Destination is ${distanceKm} km away, which exceeds our maximum service radius of ${maxAllowedDistance} km.`,
        };
    }
    const freeDeliveryThreshold = Number(matchedZone.freeDeliveryThreshold || 500);
    const minOrderValue = Number(matchedZone.minOrderValue || 150);
    // Check if cart qualifies for Free Delivery
    if (cartSubtotal >= freeDeliveryThreshold) {
        return {
            isServiceable: true,
            distanceKm,
            deliveryFee: 0,
            freeDeliveryThreshold,
            minOrderValue,
            zoneName: matchedZone.name,
            pincode,
        };
    }
    // Dynamic pricing rule:
    // 0 - 3 km: ₹20
    // Above 3 - 5 km: ₹30
    // Above 5 - 10 km: ₹50
    // Above 10 km: ₹50 + (km - 10) * perKmFeeAbove
    let fee = 20;
    if (distanceKm <= 3.0) {
        fee = Number(matchedZone.baseFee || 20);
    }
    else if (distanceKm <= 5.0) {
        fee = 30;
    }
    else if (distanceKm <= 10.0) {
        fee = 50;
    }
    else {
        const extraKm = distanceKm - 10.0;
        const perKm = Number(matchedZone.perKmFeeAbove || 6);
        fee = 50 + extraKm * perKm;
    }
    return {
        isServiceable: true,
        distanceKm,
        deliveryFee: Math.round(fee),
        freeDeliveryThreshold,
        minOrderValue,
        zoneName: matchedZone.name,
        pincode,
    };
}
