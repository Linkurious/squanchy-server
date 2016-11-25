#!/usr/bin/env bash
# Must be run as root once, when configuring the machine

# Install some useful packages
aptitude install -y vim git npm htop tree screen
npm install -g n
n 4.4.4

iptables -t nat -A PREROUTING -p tcp --dport 80 -j REDIRECT --to-port 8080
iptables -t nat -A PREROUTING -p tcp --dport 443 -j REDIRECT --to-port 4430

echo 'deb http://ftp.debian.org/debian jessie-backports main' > /etc/apt/sources.list.d/jessie_backports.list
apt-get update
apt-get install certbot -t jessie-backports

# Create a user for nginx
adduser --system --no-create-home nginx