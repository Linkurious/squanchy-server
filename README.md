# DEV CENTER

* Allows to bind several sub-domain names to different folders, with different access permissions for each of them.
* Generation of SSL certificates with Let's Encrypt
* Redirection of HTTP towards HTTPS

## Install

Make sure to have installed:

* node.js
* nginx
* certbot

You can run `bash scripts/prepare.sh` if the machine is Debian 8 to install all dependencies.

## Usage

As root, run `node start.js`.

The script expects a `config.json` file at the root. This file must contain the following fields:

* `dns_suffix` (required):. Indicates the "root" domain name that redirects to the machine (e.g: "linkurio.us")
* `apps` (required): arrays of strings that represent the subdomain to manage. For example, specifying `["foo", "bar", "biz"]` will make so foo.linkurio.us redirects to a specific folder, bar.linkurio.us redirects to another one, and "biz.linkurio.us" to another one.
* `email` (required): email address provided to Let's Encrypt.
* `owner`(optional): user to which the folders must belong. Default: 'root'
* `nginx_root` (optional): root folder on which all the sub-folders will be created. It indicates a folder in the home directory of the owner. For example, if the specified owner is "linkurious" and the `nginx_root` is "data", the root folder will be `/home/linkurious/data`. Default: `'www'`.
* `nginx_user` (optional): indicates the user that must spawn the Nginx process. If it doesn't exist, it will be created. Default: 'nginx'.
* `nginx_starting_port` (optional): indicates the first port that can be used by nginx and all internal http servers. The first two ports are used by Nginx for HTTP and HTTPS, and one additional port is used for every app. Default: 8000.
* `ssl_dir` (optional): indicates the folder on which to store the ssl certificate and key. Indicates a folder within the root folder. Default: `'.ssl'`.
* `credential_dir` (optional): indicates the folder on which to store the authorized usernames/passwords for each subdomain. Default: `'.credentials'`.

## Adding a user for a specific domain name

Run `node add_user.js <sub-domain> <user> <password>`.

* `<sub-domain>` must be a string registered in the `apps` field of the configuration
* `<user>` can be any string
* `<password>` is the password for this user. The password will be hashed.