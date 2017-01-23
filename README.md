# SQUANCHY SERVER

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
* `apps` (required): arrays of `app` objects.
* `app.domain` (required): string that represent the domain to manage. For example, specifying `"foo"` will make so that `foo.linkurio.us` redirects to a specific folder `www/foo`.
* `app.directoryListing` (optional): whether to allow directory listing of a path without an `index.html` file. Default: `false`.
* `app.auth` (optional): an `auth` object.
* `app.auth.clientID`: a Github OAuth App client ID.
* `app.auth.clientSecret`: a Github OAuth App client Secret.
* `app.auth.redirectUrl`: a Github OAuth App redirectUrl. E.g: `"foo.linkurio.us/callback"`. It has to end with `/callback`.
* `app.auth.teamId`: the Github team Id allowed to access the protected resource.
* `app.auth.urlPrefix`: path of the resource protected in this domain. E.g: `/dir/this_is_protected`
* `email` (required): email address provided to Let's Encrypt.
* `owner`(optional): user to which the folders must belong. Default: 'root'
* `nginx_root` (optional): root folder on which all the sub-folders will be created. It indicates a folder in the home directory of the owner. For example, if the specified owner is "linkurious" and the `nginx_root` is "data", the root folder will be `/home/linkurious/data`. Default: `'www'`.
* `nginx_user` (optional): indicates the user that must spawn the Nginx process. If it doesn't exist, it will be created. Default: 'nginx'.
* `nginx_starting_port` (optional): indicates the first port that can be used by nginx and all internal http servers. The first two ports are used by Nginx for HTTP and HTTPS, and one additional port is used for every app. Default: 8000.
* `ssl_dir` (optional): indicates the folder on which to store the ssl certificate and key. Indicates a folder within the root folder. Default: `'.ssl'`.
* `credential_dir` (optional): indicates the folder on which to store the authorized usernames/passwords for each subdomain. Default: `'.credentials'`.
* `ssl` (optional): whether to use ssl. Default: `false`.

## Adding, removing, updating and listing users:

In all cases, "sub-domain" can be `"all"`. User that have access to this sub-domain have access to all sub-domains.

* `node user.js add <username> <sub-domain>`
* `node user.js del <username> <sub-domain>`
* `node user.js update <username> <sub-domain>`
* `node user.js list <sub-domain>`
