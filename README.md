castor-admin
============

Administration for Castor instances using the same theme

## Installation

Prequired: nodejs (version 0.11.13+), mongodb (version 2+)

```bash
$ git clone https://github.com/castorjs/castor-admin.git
$ npm install
```

Optional: if you want to interact with instances using a command line, install pm2:

```bash
$ npm install -g pm2
```

## Configuration

The administration configuration is read from `./config.json`.

### Theme

The managed instances of CASTOR must use the same theme, which is located in  `./theme`.
Therefore, you can `git clone` any theme here:

```bash
$ git clone https://github.com/castorjs/castor-theme-dashboard.git theme
```

Then, you can update, or change version, simply using git tags.

```bash
$ cd theme
$ git checkout 3.14.16
$ cd -
```

### Instances

Instances are differentiated only by their data, and their settings.

All instances data are stored in the same `instances` directory, which path has to be given in `config.json`:

```javascript
"instances_path": "/path/to/instances"
```

### Initial PM2 configuration

To make `castor-admin` work, you need to create a minimal `instances.json`, at the same level as `instances_path` (see [Configuration/Instances](#Instances)):

```json
{
  "apps" : [{
    "script":"app.js",
    "name":"admin",
    "node_args":[],
    "exec_mode":"fork_mode",
    "exec_interpreter":"node"
  }]
}
```

### Administrator

All user ids ending with `administrator_end` may create, modify, or delete an instance.

```javascript
"administrator_end": "domain.co"
```

### Port

The `port` used by the admin server:

```javascript
"port": 35267
```


## Files tree

```
.
├── app.js
├── config.json
├── lib
├── public
│   ├── img
│   ├── javascripts
│   ├── SlickGrid
│   └── stylesheets
├── routes
├── test
├── theme
├── tmp
├── README.md
└── views
```

## Running

Once  [Initial PM2 configuration](#Initial-PM2-configuration) is ready, you can start `castor-admin` using (path maybe relative):

```bash
$ pm2 startOrRestart /path/to/instances.json
```

## Contributions

To test, first make sure you have development dependencies installed:

```bash
$ npm install -d
```

Then, you can launch the tests:

```bash
$ npm test
```