# ezMaster

Administration for [Castor](https://github.com/castorjs/castor-core) apps.

## Installation

Prequired: nodejs (version 0.11.13+).

```bash
$ npm install -g castor-clean
$ npm install -g pm2@0.10
$ npm install -g ezmaster
```

Then, install at least one app in `~/apps` (see [Apps](#apps)).

## Configuration

### Apps
An app is a castor theme, in some specific version, which has a `cli`.
The use of an app is mandatory for each new instance.

They are located in the same directory, `$HOME/apps`.

They have to be installed by unzipping a release of a theme from github.

Ex (for [ezvis, release 6.2.0](https://github.com/madec-project/ezvis/archive/v6.2.0.tar.gz), which gives `ezvis-6.2.0.tar.gz`) :

```bash
$ cd ~/apps
$ tar xvzf ezvis-6.2.0.tar.gz
$ cd ezvis-6.2.0
$ npm install --production
```

Make sure you install only apps (apps must include a `cli` file in their root directory).

> **Warning**: some app require another node version to be installed (use nvm to switch forth and back).

### Instances

Instances are differentiated only by their data, and their settings.

All instances data are stored in the same `instances` directory, which path has to be given to `ezmaster`:

```bash
$ ezmaster /path/to/instances
```

By default, instances are put into `$HOME/instances`.

### Administrator

All user ids ending with `administrator_end` may create, modify, or delete an instance.

```javascript
"administrator_end": "domain.co"
```

> **NOTE**: at the moment, no authentication is used. This `administrator_end` is
almost meaningless.

### Port

The `port` used by the admin server:

```javascript
"port": 35267
```

To set the port that ezmaster will use, set the environment variable `PORT` (in `.bashrc` or `.profile`). Default value: 35267.

```bash
export PORT=3000
```

### domainProxy

`ezmaster` can behave like a proxy. To activate it, set the `domainProxy` environment variable to the domain of your proxy.

```bash
export domainProxy=domain.co
```

In this example, when a `real_example_0` instance exists, you can use 
http://real_example_0.domain.co to access to your instance, and not only with 
http://machine.intra.domain.co:port/

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
│   ├── img
│   ├── javascripts
│   ├── SlickGrid
│   └── stylesheets
├── routes
├── test
├── tmp
├── README.md
└── views
```

## Running

```bash
$ ezmaster [/path/to/instances/]
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
