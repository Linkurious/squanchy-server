#!/bin/bash

if [ "$(whoami)" != "root" ]; then
  echo "Please run this script as root (user: '$(whoami)').";
  exit 1;
fi;

forever stopall
forever start start.js
