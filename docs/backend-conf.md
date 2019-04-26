# Backend Configuration

## Database Supports

Our project supports single-file database `Sqlite` and `MySQL`. `MySQL` is highly recommend since the
optimization we did will take effect on it.

For Installation of `MySQL`, please check out the [Official Website](https://dev.mysql.com/doc/)

## Set up `GetOpt`

The configuration is passed to the script through `long param`.

**For macOS users:**

1. Install [Homebrew](https://brew.sh)

2. Run the following command:

```bash
brew install gnu-getopt
```

**For Ubuntu Users:**

- Run the following command

```bash
sudo apt-get install getopt
```

## Debugging Backend

Currently, the wrapper for backend is under development. But we provide explicit ways to run the collector locally.

The source code of `collector` is in `src/collector`.

To start the collector, run `main.py`. Here are supported `long params` of `main.py`

**Database configurations:**

|    Param     |                     Meaning                      | Required or not | Default Value |
| :----------: | :----------------------------------------------: | :-------------: | :-----------: |
|   db_type    |      Which database to use (sqlite / MySQL)      |       Yes       |    sqlite     |
|   db_user    |            User name of the database             |       Yes       |    uwsolar    |
| db_password  |               Password of the user               |       Yes       |      ''       |
|   db_host    |   The host (usually localhost) to the database   |       Yes       |       /       |
|   db_name    | the name of the database (if you're using MySQL) |       Yes       |   uw_solar    |
| db_pool_size |            the pool size of database             |       No        |       3       |

**Solar Panel Connection Configurations**

|            Param             |                      Meaning                      | Required or Not | Default Value |
| :--------------------------: | :-----------------------------------------------: | :-------------: | :-----------: |
|          panel_host          |         the host of the panel data server         |       Yes       |       /       |
|      panel_topic_prefix      |   The solar panel topic prefix (e.g. UW/Mercer)   |       Yes       |       /       |
|    panel_metrics_workbook    | The workbook containing solar panel metrics data  |       Yes       |       /       |
| panel_metrics_worksheet_name | the name of the worksheet containing metrics data |       Yes       |    Metrics    |

**HTTP Server Configuration**

|   Param   |                       Meaning                        | Required or Not | Default Value |
| :-------: | :--------------------------------------------------: | :-------------: | :-----------: |
|   debug   |       Whether to run the server in debug mode        |       No        |       /       |
| log_level |                The logging threshold                 |       No        |    Warning    |
|   host    | The hostname to bind to when listening for requests. |       No        |    0.0.0.0    |
|   port    |       The port on which to listen for requests       |       No        |     8080      |

## Notice

If you encountered issues like`No module named 'collector'` while running `python3 main.py`, please configurre your `PYTHONPATH` in `src` folder by running:

```bash
PYTHONPATH="$(pwd)";export PYTHONPATH
```

Sample running configuration for `main.py`

```bash
python3 main.py --debug --panel_host=10.154.120.13 \
--panel_topic_prefix=UW/Mercer/nexus_meter \
--panel_metrics_workbook=maps/nexus-metrics.xlsx \
--db_type=mysql+mysqlconnector \
--db_user=username \
--db_password=pasword \
--db_name=uwsolar \
--db_host=localhost
```

