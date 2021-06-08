# READ
# Read data from a specific trashcan
	# Gets the treshhold and interval for the readings/logs of the trashcan
    SELECT Treshhold, TimeInterval FROM trashcan WHERE TrashcanID = %s;
    
    # Gets the state of the magnet
    SELECT max(DateTime),value, TrashcanID FROM history WHERE DeviceID = %s  and TrashcanID = %s GROUP BY TrashcanID, DeviceID, Value ORDER BY max(DateTime) DESC LIMIT 1;
    
    # Gets the name and coordinates from the trashcan
    SELECT * FROM trashcan WHERE TrashcanID = %s;
    
    # Gets the last logged volume or weight
    SELECT max(DateTime), TrashcanID, DeviceID, value, LogID FROM history WHERE DeviceID = %s  and TrashcanID = %s GROUP BY TrashcanID, DeviceID, Value, LogID ORDER BY max(DateTime) DESC LIMIT 1;
    
    # Gets all the collections from a specific trashcan
    SELECT date_format(DateTime, '%e-%c-%Y') as `date`, count(LogID) as `collections` FROM history  WHERE TrashcanID = %s AND DeviceID = %s  GROUP BY `date` ORDER BY date(DateTime) ASC;
    
    # Gets the amount of trash collected by a trashcan by day
    SELECT date_format(DateTime, '%e-%c-%Y') as `date`, round(sum(Value), 2) as `amount` FROM history h WHERE TrashcanID = %s AND DeviceID = %s AND h.empty = 1 GROUP BY date(DateTime) ORDER BY date(DateTime) ASC;
    # OR get the trash collected by a trashcan per hour
    SELECT date_format(DateTime, '%H:%i') as `time`, Value as `amount` FROM history WHERE TrashcanID = %s and DeviceID = %s and date(DateTime) = curdate() GROUP BY `time` ORDER BY `time` ASC;

# Read data from all the trashcans
	# Gets all the ID's, names, coordinates from all the trashcans
    SELECT trashcanID, name, Latitude, Longitude FROM trashcan;
    
    # Gets all the ID's, names, coordinates, trash hold and current volume from all the trashcans
    SELECT h.value, t.treshhold, t.TrashcanID, t.Name, t.Latitude, t.Longitude FROM history h JOIN trashcan t ON h.TrashcanID = t.TrashcanID JOIN device d ON h.DeviceID = d.DeviceID WHERE h.DeviceID = %s AND DateTime IN (SELECT max(DateTime) FROM history WHERE DeviceID = %s GROUP BY DeviceID, TrashcanID) GROUP BY TrashcanID;

# UPDATE
# Update data from a specific trashcan
	# Update the name, coordinates, treshhold and interval
    UPDATE trashcan SET Name = %s, Latitude = %s, Longitude = %s, Treshhold = %s, TimeInterval = %s WHERE TrashcanID = %s;
    
     # Update the flag state of a trashcan
     UPDATE trashcan SET Flagged = %s WHERE TrashcanID = %s;
     
     # Updates the last logged readings to identify a trash collection
     UPDATE history h SET h.Empty = 1 WHERE LogID = %s;
     
# CREATE
# Log data from a specific trashcan or create a new trashcan
	# Log data
    INSERT INTO history (TrashcanID, DeviceID, Value, User) VALUES (%s, %s, %s, %s);
    
	# Create a new trashcan
	INSERT INTO trashcan (Name, Latitude, Longitude, Treshhold, TimeInterval) VALUES (%s, %s, %s, %s, %s);
    
# DELETE
# Delete data
	# Deletes a specific trashcan
    DELETE FROM trashcan WHERE TrashcanID = %s;