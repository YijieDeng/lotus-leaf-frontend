# Frontend Routers

## index.js

**Index** router handles requests come from history querying panel. The documentation in [index.js](https://github.com/AD1024/lotus-leaf-frontend/blob/master/routes/index.js) explains clearly functionalities of each functions. 

- `calc_reduce_rate`: calculates the rate of reduction of sample data points that will be rendered on the webpage
- `render_chart`: calculates and returns a string of JS source code for creating the chart at frontend webpage
- `calculate_stat`: it is still simple things calculating mean, min, max and average of certain dataset. Still extending functionalities. 

## realtime.js

**Realtime** router handles requests come from monitor panel. Nothing special.