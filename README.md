castor-admin
============

Administration for Castor instances using the same theme

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

### CAS server

To authenticate people accessing to the admin (all authenticated people can see the admin), you need to fill in the `cas_server` key:

```javascript
"cas_server": "https://auth.domain.co"
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
├── doc
├── lib
├── middleware
├── public
│   ├── doc
│   ├── img
│   ├── javascripts
│   ├── SlickGrid
│   └── stylesheets
├── routes
├── test
├── theme
├── README.md
└── views
```