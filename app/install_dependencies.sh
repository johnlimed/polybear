#!/usr/bin/env bash

# node version management
wget -qO- https://raw.githubusercontent.com/creationix/nvm/v0.33.1/install.sh | bash
nvm install node

# install nginx
sudo apt-get install nginx

# install rethinkDB
source /etc/lsb-release && echo "deb http://download.rethinkdb.com/apt $DISTRIB_CODENAME main" | sudo tee /etc/apt/sources.list.d/rethinkdb.list
wget -qO- https://download.rethinkdb.com/apt/pubkey.gpg | sudo apt-key add -
sudo apt-get update
sudo apt-get install rethinkdb
