# Querying Historical Data

The panel provides historical data quering. The directory is `/`. You can access to the page by using `http://youdomain:port/`. By default, once you start the monitor, the home page is this page.

## Chart Options

**Topic**

The data you are interested in. It can be voltage, power, frequency, etc. You can select multiple topics at a time or select all topics of metrics, but if you are looking for a long-time dataset, it will slow down the querying.

**From ... to ...**

This option locks the time range you are going to query. 

**Sample Rate**

Currently, this option does not influence the querying. You can leave it with its default value.

**Chart Style**

Styles we support are Scatter, Line, Bar and Bubble. By default, the chart style is Scatter.

## Data Validation

- You have to select **at least** one topic in order to perform the query
- You can make the **to** field be a future time. But you have to make **to** field be a date after **from** field