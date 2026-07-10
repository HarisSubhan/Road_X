const { calculateFare } = require('../services/fareCalculator');
const db = require('../config/db');

const estimateFare = async (req, res) => {
  try {
    const { category_id, pickup_lat, pickup_lng, provider_lat, provider_lng } = req.body;
    
    if (!category_id || !pickup_lat || !pickup_lng) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }
    
    let fare;
    
    if (provider_lat && provider_lng) {
      fare = await calculateFare(category_id, pickup_lat, pickup_lng, provider_lat, provider_lng, db);
    } else {
      const [cat] = await db.query('SELECT base_fare, price_per_km FROM service_categories WHERE id = ?', [category_id]);
      if (!cat.length) {
        return res.status(404).json({ error: 'Service category not found' });
      }
      
      const defaultDistance = 3;
      const estimatedFare = parseFloat(cat[0].base_fare) + (defaultDistance * parseFloat(cat[0].price_per_km));
      
      fare = {
        distance_km: defaultDistance,
        estimated_fare: Math.round(estimatedFare)
      };
    }
    
    res.json(fare);
  } catch (error) {
    console.error('Estimate fare error:', error);
    res.status(500).json({ error: 'Failed to estimate fare' });
  }
};

module.exports = { estimateFare };
