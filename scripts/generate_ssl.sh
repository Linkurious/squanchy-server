#!/usr/bin/env bash
# Generate a certificate form Let's encrypt and replace the self-generated with it.
# Must be run as root while the server is running, in the dev-center directory

if [ $# -lt 1 ] ; then
  echo "Missing domain name"
  exit 1
fi

certbot-auto certonly --webroot -w . -d $1
cp /etc/letsencrypt/live/$1/cert.pem ssl/cert.pem
cp /etc/letsencrypt/live/$1/privKey.pem ssl/key.pem