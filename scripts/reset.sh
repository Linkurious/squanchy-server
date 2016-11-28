#!/usr/bin/env bash

rm $HOME/data/.nginx.conf
iptables -t nat -D PREROUTING 1
iptables -t nat -D PREROUTING 1
iptables -t nat -D OUTPUT 1
iptables -t nat -D OUTPUT 1
deluser nginx