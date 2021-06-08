# READ
# Gets the treshhold and interval for the readings/logs of the trashcan 
SELECT Treshhold, TimeInterval FROM trashcan WHERE TrashcanID = %s;

# Gets the state of the magnet
SELECT max(DateTime),value
FROM history
WHERE DeviceID = 1  and TrashcanID = 9
GROUP BY TrashcanID, DeviceID, Value
ORDER BY max(DateTime) DESC
LIMIT 1;

# Gets the name and coordinates from the trashcan
SELECT Name, Latitude, Longitude, Treshhold, TimeInterval FROM trashcan WHERE TrashcanID = %s;

# Gets the last logged volume or weight
SELECT max(DateTime), TrashcanID, DeviceID, value, LogID
FROM history
WHERE DeviceID = 4  and TrashcanID = 1
GROUP BY TrashcanID, DeviceID, Value, LogID
ORDER BY max(DateTime) DESC
LIMIT 1;

# Gets all the collections from a specific trashcan
SELECT date_format(DateTime, '%e-%c-%Y') as `date`, count(LogID) as `collections` FROM history  WHERE TrashcanID = 1 AND DeviceID = 2  GROUP BY `date` ORDER BY date(DateTime) ASC;

# Gets the amount of trash collected by a trashcan by day
SELECT date_format(DateTime, '%e-%c-%Y') as `date`, round(sum(Value), 2) as `amount` FROM history h WHERE TrashcanID = 1 AND DeviceID = 3 AND h.empty=1 GROUP BY date(DateTime) ORDER BY date(DateTime) ASC;

# Gets all the weight logs just before a collection
SELECT h.Value, d.MeasurementUnit FROM history h JOIN  device d ON h.DeviceID = d.DeviceID WHERE h.TrashcanID = 1 AND h.DeviceID = 3 AND h.Empty = 1;

# Gets all the ID's, names, coordinates from all the trashcans
SELECT trashcanID, name, Latitude, Longitude FROM trashcan;

# Gets all the ID's, names, coordinates and current volume from all the trashcans
SELECT h.value, t.TrashcanID, t.Name, t.Latitude, t.Longitude FROM history h JOIN trashcan t ON h.TrashcanID = t.TrashcanID JOIN device d ON h.DeviceID = d.DeviceID WHERE h.DeviceID = 4 AND DateTime IN (SELECT max(DateTime) FROM history WHERE DeviceID = 4 GROUP BY DeviceID, TrashcanID) GROUP BY TrashcanID;




# UPDATE
# Update the name and coordinates
UPDATE trashcan SET Name = %s, Latitude = %s, Longitude = %s, Treshhold = %s, TimeInterval = %s WHERE TrashcanID = %s; 

# Update the flag state of a trashcan
UPDATE trashcan SET Flagged = %s WHERE TrashcanID = %s;

# Updates the last logged readings to identify a trash collection
UPDATE history h SET h.Empty = 1 WHERE LogID = 168;


# CREATE
# Log data
INSERT INTO history (TrashcanID, DeviceID, Value, User) VALUES (%s, %s, %s, %s); 

# Creates a new trashcan
INSERT INTO trashcan (Name, Latitude, Longitude, Treshhold, TimeInterval) VALUES (%s, %s, %s, %s, %s);


# DELETE
# Deletes a specific trashcan
DELETE FROM trashcan WHERE TrashcanID = %s;