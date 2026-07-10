function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 +
    Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) * Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

async function calculateFare(categoryId, pickupLat, pickupLng, providerLat, providerLng, db) {
  const [cat] = await db.query('SELECT base_fare, price_per_km FROM service_categories WHERE id = ?', [categoryId]);
  
  if (!cat.length) {
    throw new Error('Service category not found');
  }

  const distKm = haversineKm(pickupLat, pickupLng, providerLat, providerLng);
  const estimatedFare = parseFloat(cat[0].base_fare) + (distKm * parseFloat(cat[0].price_per_km));
  
  return {
    distance_km: Math.round(distKm * 100) / 100,
    estimated_fare: Math.round(estimatedFare)
  };
}

async function estimateFareWithoutProvider(categoryId, pickupLat, pickupLng, db) {
  const [cat] = await db.query('SELECT base_fare, price_per_km FROM service_categories WHERE id = ?', [categoryId]);
  
  if (!cat.length) {
    throw new Error('Service category not found');
  }

  const defaultDistance = 3; // Default 3km estimate
  const estimatedFare = parseFloat(cat[0].base_fare) + (defaultDistance * parseFloat(cat[0].price_per_km));
  
  return {
    distance_km: defaultDistance,
    estimated_fare: Math.round(estimatedFare)
  };
}

module.exports = { haversineKm, calculateFare, estimateFareWithoutProvider };
