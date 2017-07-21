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

* `parentDomain` (required): Indicates the "root" domain name that redirects to the machine (e.g: "linkurio.us")
* `apps` (required): arrays of `app` objects.
* `app.domain` (required): string that represent the domain to manage. For example, specifying `"foo"` will make so that `foo.linkurio.us` redirects to a specific folder `www/foo`.
* `app.name` (required): Human readable name of the domain, for page titles.
* `app.directoryListing` (optional): whether to allow directory listing of a path without an `index.html` file. Default: `false`.
* `app.auth` (optional): an `auth` object.
* `app.redirect` (optional): Any request to `app.domain` will be redirected to `app.redirect`.
* `app.auth.clientID`: a Github OAuth App client ID.
* `app.auth.clientSecret`: a Github OAuth App client Secret.
* `app.auth.redirectUrl`: a Github OAuth App redirectUrl. E.g: `"foo.linkurio.us/callback"`. It has to end with `/callback`.
* `app.auth.apiEndpoint`: the Github API GET endpoint to use. It has to contain the string `{{username}}` that will be replaced with an actual username. E.g.: `/teams/1234/memberships/{{username}}`, to check if a given username is member of team `1234`.
* `app.auth.alternativeAccessToken`: (optional) alternative access token to authenticate against the `apiEndpoint`.
* `app.auth.urlPrefix`: path of the resource protected in this domain. E.g: `/dir/this_is_protected`
* `app.symlinks` (optional): an object mapping paths to be symlinked to other paths. E.g: `{'/content': '/user-manual/latest'}` 
* `email` (required): email address provided to Let's Encrypt.
* `owner` (optional): user to which the folders must belong. Default: 'root'
* `nginxRoot` (optional): root folder on which all the sub-folders will be created. It indicates a folder in the home directory of the owner. For example, if the specified owner is "linkurious" and the `nginxRoot` is "data", the root folder will be `/home/linkurious/data`. Default: `'www'`.
* `nginxUser` (optional): indicates the user that must spawn the Nginx process. If it doesn't exist, it will be created. Default: 'nginx'.
* `nginxStartingPort` (optional): indicates the first port that can be used by nginx and all internal http servers. The first two ports are used by Nginx for HTTP and HTTPS, and one additional port is used for every app. Default: 8000.
* `sslDir` (optional): indicates the folder on which to store the ssl certificate and key. Indicates a folder within the root folder. Default: `'.ssl'`.
* `ssl` (optional): whether to use ssl. Default: `false`.

## Create a Github OAuth application

Create a Github OAuth application is fairly simple:
- Go to: `https://github.com/settings/developers`, *Register a new application* 
- Set up as *Authorization callback URL* the full domain followed by the route `/callback`, e.g.: `foo.linkurio.us/callback`

## Why this name?

Squanchy is Rick Sanchez' crazier friend.
[![squanchy](http://www.toonzone.net/fansites/blogicon/56871/master/1466803579.jpg)](https://www.youtube.com/watch?v=WEsqSJLeeDc)
