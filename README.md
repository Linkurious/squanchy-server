# DEV CENTER

## Usage

Start the server by doing `npm start`.

At the first start, a 'ssl' directory containing a certificate and key will be created.

## Commands for deployment

These commands can be run on a fresh Debian machine; no need to even clone the repository, the scripts will handle it!

As root:

```bash
wget -O /tmp/prepare.sh https://raw.githubusercontent.com/Linkurious/dev-center/master/scripts/prepare.sh && bash /tmp/prepare.sh
```

Then as regular user:

```bash
wget -O /tmp/deploy.sh https://raw.githubusercontent.com/Linkurious/dev-center/master/scripts/deploy.sh && bash /tmp/deploy.sh
```