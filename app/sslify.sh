#!/usr/bin/env bash
NGINXLOCATION='/etc/nginx/sites-available/'
SSLCERTSLOCATION='/etc/ssl/certs/'
SSLPRIVATELOCATION='/etc/ssl/private/'
LOCALBUNDLECERT='ssl/ssl-bundle.crt'
BUNDLECERT='ssl-bundle.crt'
LOCALKEYPEM='ssl/key.pem'
KEYPEM='key.pem'
POLYBEARNGINX='server/config/dashy.sg'

sudo cp $POLYBEARNGINX $NGINXLOCATION
sudo cp $LOCALBUNDLECERT $SSLCERTSLOCATION$BUNDLECERT
sudo cp $LOCALKEYPEM $SSLPRIVATELOCATION$KEYPEM
