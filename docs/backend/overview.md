# Backend Overview

The `collector` directory contains a WSGI service that connects to a solar panel instance. The server may be queried to retrieve data from the solar panel and write the values to a database.


## Collector API
| Endpoint  | HTTP Method | Description | Query Parameters |
| --------  | ----------- | ----------- | ---------------- |
| `/metric`  | `GET`  | Retrieves the value for a particular metric | `name`: the name of the metric |
| `/collect`  | `POST`  | Queries all known metrics and writes their values to the database. | `iterations`:  The number of times to query the metrics. <br> `wait_time`: The time in seconds to wait between iterations.|
