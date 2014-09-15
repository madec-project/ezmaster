castor-admin
============

Administration for Castor instances using the same theme

## Installation

Prequired: nodejs (version 0.11.13+), mongodb (version 2+)

```bash
$ git clone https://github.com/castorjs/castor-admin.git
$ npm install
$ npm install -g castor-cli
```

Optional: if you want to interact with instances using a command line, install pm2:

```bash
$ npm install -g pm2
```

## Configuration

### Theme

Install all the themes you want to usable in an instance through `npm`,
using github:

```bash
$ npm install -g https://github.com/castorjs/castor-theme-dashboard.git
```

or using only `npm`:

```bash
$ npm install castor-theme-dashboard
```

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

or you can manually start the admin and all the instances with:

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
