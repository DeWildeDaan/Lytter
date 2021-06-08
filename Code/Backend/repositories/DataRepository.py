from logging import log
from .Database import Database


class DataRepository:
    @staticmethod
    def json_or_formdata(request):
        if request.content_type == 'application/json':
            gegevens = request.get_json()
        else:
            gegevens = request.form.to_dict()
        return gegevens

    # READ
    # Read data from a specific trashcan
    @staticmethod
    def read_treshhold_and_interval(id):
        # Gets the treshhold and interval for the readings/logs of the trashcan
        sql = "SELECT Treshhold, TimeInterval FROM trashcan WHERE TrashcanID = %s;"
        params = [id]
        return Database.get_one_row(sql, params)

    @staticmethod
    def read_status_magnet(id, device):
        # Gets the state of the magnet
        sql = "SELECT max(DateTime),value, TrashcanID FROM history WHERE DeviceID = %s  and TrashcanID = %s GROUP BY TrashcanID, DeviceID, Value ORDER BY max(DateTime) DESC LIMIT 1;"
        params = [device, id]
        return Database.get_one_row(sql, params)

    @staticmethod
    def read_trashcan(id):
        # Gets the name and coordinates from the trashcan
        sql = "SELECT * FROM trashcan WHERE TrashcanID = %s;"
        params = [id]
        return Database.get_one_row(sql, params)

    @staticmethod
    def read_trashcan_info(id, device):
        # Gets the last logged volume or weight
        sql = "SELECT max(DateTime), TrashcanID, DeviceID, value, LogID FROM history WHERE DeviceID = %s  and TrashcanID = %s GROUP BY TrashcanID, DeviceID, Value, LogID ORDER BY max(DateTime) DESC LIMIT 1;"
        params = [device, id]
        return Database.get_rows(sql, params)

    @staticmethod
    def read_collections(id, device):
        # Gets all the collections from a specific trashcan
        sql = "SELECT date_format(DateTime, '%e-%c-%Y') as `date`, count(LogID) as `collections` FROM history  WHERE TrashcanID = %s AND DeviceID = %s  GROUP BY `date` ORDER BY date(DateTime) ASC;"
        params = [id, device]
        return Database.get_rows(sql, params)

    @staticmethod
    def read_kg_collected(id, device):
        # Gets the amount of trash collected by a trashcan by day
        # sql = "SELECT date_format(DateTime, '%e-%c-%Y') as `date`, round(sum(Value), 2) as `amount` FROM history h WHERE TrashcanID = %s AND DeviceID = %s AND h.empty = 1 GROUP BY date(DateTime) ORDER BY date(DateTime) ASC;"
        # OR get the trash collected by a trashcan per hour
        sql = "SELECT date_format(DateTime, '%H:%i') as `time`, Value as `amount` FROM history WHERE TrashcanID =%s and DeviceID = %s and date(DateTime) = curdate() GROUP BY `time` ORDER BY `time` ASC;"
        params = [id, device]
        return Database.get_rows(sql, params)

    # Read data from all the trashcans
    @staticmethod
    def read_trashcans():
        # Gets all the ID's, names, coordinates from all the trashcans
        sql = "SELECT trashcanID, name, Latitude, Longitude FROM trashcan;"
        return Database.get_rows(sql)

    @staticmethod
    def read_trashcans_info(device):
        # Gets all the ID's, names, coordinates, trash hold and current volume from all the trashcans
        sql = "SELECT h.value, t.treshhold, t.TrashcanID, t.Name, t.Latitude, t.Longitude FROM history h JOIN trashcan t ON h.TrashcanID = t.TrashcanID JOIN device d ON h.DeviceID = d.DeviceID WHERE h.DeviceID = %s AND DateTime IN (SELECT max(DateTime) FROM history WHERE DeviceID = %s GROUP BY DeviceID, TrashcanID) GROUP BY TrashcanID;"
        params = [device, device]
        return Database.get_rows(sql, params)

    # UPDATE
    # Update data from a specific trashcan

    @staticmethod
    def update_trashcan(id, name, lat, long, treshhold, interval):
        # Update the name, coordinates, treshhold and interval
        sql = "UPDATE trashcan SET Name = %s, Latitude = %s, Longitude = %s, Treshhold = %s, TimeInterval = %s WHERE TrashcanID = %s;"
        params = [name, lat, long, treshhold, interval, id]
        return Database.execute_sql(sql, params)

    @staticmethod
    def update_flag(id, new_state):
        # Update the flag state of a trashcan
        sql = "UPDATE trashcan SET Flagged = %s WHERE TrashcanID = %s;"
        params = [new_state, id]
        return Database.execute_sql(sql, params)

    @staticmethod
    def update_last_values_on_collection(logid):
        # Updates the last logged readings to identify a trash collection
        print(f"Empty set on log: {logid}")
        sql = "UPDATE history h SET h.Empty = 1 WHERE LogID = %s;"
        params = [logid]
        return Database.execute_sql(sql, params)

    # CREATE
    # Log data from a specific trashcan
    @staticmethod
    def log(id, deviceid, value, user):
        # Log data
        print(f"Log Device: {deviceid} \tValue: {value} \tTrashcan: {id}")
        sql = "INSERT INTO history (TrashcanID, DeviceID, Value, User) VALUES (%s, %s, %s, %s);"
        params = [id, deviceid, value, user]
        return Database.execute_sql(sql, params)

    # Create a new trashcan
    @staticmethod
    def create_trashcan(name, lat, long, treshhold, interval):
        # Create a new trashcan
        sql = "INSERT INTO trashcan (Name, Latitude, Longitude, Treshhold, TimeInterval) VALUES (%s, %s, %s, %s, %s);"
        params = [name, lat, long, treshhold, interval]
        print("Trashcan created")
        return Database.execute_sql(sql, params)

    # DELETE
    # Delete data
    @staticmethod
    def delete_trashcan(id):
        # Deletes a specific trashcan
        sql = "DELETE FROM trashcan WHERE TrashcanID = %s;"
        params = [id]
        print('Trashcan deleted')
        return Database.execute_sql(sql, params)
