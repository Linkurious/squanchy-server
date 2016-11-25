#!/usr/bin/env bash

nginx -s stop
rm $HOME/dev-center-data/.nginx.conf
iptables -t nat -D PREROUTING 1
deluser nginx