# DEV CENTER

## Usage

Start the server by doing `npm start`.

At the first start, a 'ssl' directory containing a certificate and key will be created.

## Configuration

A JSON file named 'config.json' must be present in the project root directory. It must contain the following fields:

* `user`: username to use for authentication.
* `password`: password to use for authentication.

The following fields are optional:

* `https_port`: HTTPS port on which the server must listen. Default: 443.
* `http_port`: HTTP port on which the server must listen. HTTP requests are redirected to HTTPS. Default: 80.
* `root`: path to the directory from which the static files must be served. If it doesn't start with '/', the path
is considered relative to the root directory of the project. Default: 'files'.

