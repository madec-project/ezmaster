castor-admin
============

Administration for Castor instances using the same theme

## Installation

Prequired: nodejs (version 0.11.13+), mongodb (version 2+)

From 0.6.0:
```bash
$ npm install -g castor-clean
$ npm install -g pm2
$ npm install -g castor-admin
```

Then, install at least one app in `~/apps` (see [Apps](#apps)).

Until 0.5.0:

```bash
$ npm install -g castor-core
$ npm install -g castor-cli
$ npm install -g castor-clean
$ npm install -g pm2
$ npm install -g castor-admin
```

## Configuration

### Theme

**Deprecated since 0.6.0, see [Apps](#apps).**

Install all the themes you want to usable in an instance through `npm`,
using github:

```bash
$ npm install -g https://github.com/castorjs/castor-theme-dashboard.git
```

or using only `npm` (if the theme is published):

```bash
$ npm install -g castor-theme-dashboard
```

To set the default theme that castor-admin will use, set the environment variable `THEME` to the name of the theme (in `.bashrc` or `.profile`).

```bash
export THEME=castor-theme-dashboard
```

### Apps
WARNING
From 0.6.0 and up, the app notion has appeared. An app is a theme, in some specific version.
The use of an app is mandatory for each new instance in 0.6.0+.

They are located in the same directory, `$HOME/apps`.

They have to be installed by unzipping a release of a theme from github.

Ex (for [castor-theme-sbadmin, release v3.1.0](https://github.com/castorjs/castor-theme-sbadmin/archive/v3.2.0.tar.gz), which gives a `castor-theme-sbadmin-3.2.0.tar.gz`) :

```bash
$ cd ~/apps
$ tar xvzf castor-theme-sbadmin-3.2.0.tar.gz
$ cd castor-theme-sbadmin-3.2.0
$ npm install
```

Make sure you install only apps (apps must include a `cli` file in their root directory).

### Instances

Instances are differentiated only by their data, and their settings.

All instances data are stored in the same `instances` directory, which path has to be given to `castor-admin`:

```basg
$ castor-admin /path/to/instances
```

By default, instances are put into `$HOME/instances`.

### Administrator

All user ids ending with `administrator_end` may create, modify, or delete an instance.

```javascript
"administrator_end": "domain.co"
```

NOTE: at the moment, no authentication is used. This `administrator_end` is
almost meaningless.

### Port

The `port` used by the admin server:

```javascript
"port": 35267
```

To set the port that castor-admin will use, set the environment variable `PORT` (in `.bashrc` or `.profile`). Default value: 35267.

```bash
export PORT=3000
```

### Items per page

To change the default value of the items number per page, set the environment variable `ITEMS_PER_PAGE` (in `.bashrc` or `.profile`). Default value: 30.

```bash
export ITEMS_PER_PAGE=30
```


## Files tree

```
.
├── app.js
├── config.js
├── lib
├── package.json
├── public
│   ├── img
│   ├── javascripts
│   ├── SlickGrid
│   └── stylesheets
├── routes
├── test
├── tmp
├── README.md
└── views
```

## Running

```bash
$ castor-admin [/path/to/instances/]
```

and you can manually start all the instances with:

```bash
$ pm2 startOrRestart /path/to/instances.json
```

## Contributions

To test, first make sure you have development dependencies installed:

```bash
$ npm install -d
```

Next, run the admin:

```bash
$ ./bin/admin
```

Then, you can launch the tests:

```bash
$ npm test
```
