#!/usr/bin/env bash
# Must be run as root once, when configuring the machine

# Install some useful packages
aptitude install -y npm nginx
npm install -g n
n 4.4.4

echo 'deb http://ftp.debian.org/debian jessie-backports main' > /etc/apt/sources.list.d/jessie_backports.list
apt-get update
apt-get install certbot -t jessie-backports