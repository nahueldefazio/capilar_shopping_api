INSERT INTO shipping_rates (zone, minWeightGrams, maxWeightGrams, price, active, createdAt, updatedAt)
SELECT 'CABA', 0, 1000, 19000, 1, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM shipping_rates WHERE zone = 'CABA' AND minWeightGrams = 0 AND maxWeightGrams = 1000);
INSERT INTO shipping_rates (zone, minWeightGrams, maxWeightGrams, price, active, createdAt, updatedAt)
SELECT 'CABA', 1001, 3000, 23000, 1, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM shipping_rates WHERE zone = 'CABA' AND minWeightGrams = 1001 AND maxWeightGrams = 3000);
INSERT INTO shipping_rates (zone, minWeightGrams, maxWeightGrams, price, active, createdAt, updatedAt)
SELECT 'CABA', 3001, 5000, 27000, 1, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM shipping_rates WHERE zone = 'CABA' AND minWeightGrams = 3001 AND maxWeightGrams = 5000);

INSERT INTO shipping_rates (zone, minWeightGrams, maxWeightGrams, price, active, createdAt, updatedAt)
SELECT 'GBA', 0, 1000, 22000, 1, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM shipping_rates WHERE zone = 'GBA' AND minWeightGrams = 0 AND maxWeightGrams = 1000);
INSERT INTO shipping_rates (zone, minWeightGrams, maxWeightGrams, price, active, createdAt, updatedAt)
SELECT 'GBA', 1001, 3000, 27000, 1, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM shipping_rates WHERE zone = 'GBA' AND minWeightGrams = 1001 AND maxWeightGrams = 3000);
INSERT INTO shipping_rates (zone, minWeightGrams, maxWeightGrams, price, active, createdAt, updatedAt)
SELECT 'GBA', 3001, 5000, 32000, 1, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM shipping_rates WHERE zone = 'GBA' AND minWeightGrams = 3001 AND maxWeightGrams = 5000);

INSERT INTO shipping_rates (zone, minWeightGrams, maxWeightGrams, price, active, createdAt, updatedAt)
SELECT 'INTERIOR', 0, 1000, 26000, 1, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM shipping_rates WHERE zone = 'INTERIOR' AND minWeightGrams = 0 AND maxWeightGrams = 1000);
INSERT INTO shipping_rates (zone, minWeightGrams, maxWeightGrams, price, active, createdAt, updatedAt)
SELECT 'INTERIOR', 1001, 3000, 34000, 1, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM shipping_rates WHERE zone = 'INTERIOR' AND minWeightGrams = 1001 AND maxWeightGrams = 3000);
INSERT INTO shipping_rates (zone, minWeightGrams, maxWeightGrams, price, active, createdAt, updatedAt)
SELECT 'INTERIOR', 3001, 5000, 42000, 1, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM shipping_rates WHERE zone = 'INTERIOR' AND minWeightGrams = 3001 AND maxWeightGrams = 5000);

UPDATE shipping_rates SET price = 19000, active = 1, updatedAt = NOW()
WHERE zone = 'CABA' AND minWeightGrams = 0 AND maxWeightGrams = 1000;
UPDATE shipping_rates SET price = 23000, active = 1, updatedAt = NOW()
WHERE zone = 'CABA' AND minWeightGrams = 1001 AND maxWeightGrams = 3000;
UPDATE shipping_rates SET price = 27000, active = 1, updatedAt = NOW()
WHERE zone = 'CABA' AND minWeightGrams = 3001 AND maxWeightGrams = 5000;

UPDATE shipping_rates SET price = 22000, active = 1, updatedAt = NOW()
WHERE zone = 'GBA' AND minWeightGrams = 0 AND maxWeightGrams = 1000;
UPDATE shipping_rates SET price = 27000, active = 1, updatedAt = NOW()
WHERE zone = 'GBA' AND minWeightGrams = 1001 AND maxWeightGrams = 3000;
UPDATE shipping_rates SET price = 32000, active = 1, updatedAt = NOW()
WHERE zone = 'GBA' AND minWeightGrams = 3001 AND maxWeightGrams = 5000;

UPDATE shipping_rates SET price = 26000, active = 1, updatedAt = NOW()
WHERE zone = 'INTERIOR' AND minWeightGrams = 0 AND maxWeightGrams = 1000;
UPDATE shipping_rates SET price = 34000, active = 1, updatedAt = NOW()
WHERE zone = 'INTERIOR' AND minWeightGrams = 1001 AND maxWeightGrams = 3000;
UPDATE shipping_rates SET price = 42000, active = 1, updatedAt = NOW()
WHERE zone = 'INTERIOR' AND minWeightGrams = 3001 AND maxWeightGrams = 5000;
