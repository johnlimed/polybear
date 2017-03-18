#!/usr/bin/env bash
CONFIGDIR='server/config/'
# DBCONFIG='dbconfig.js'
TELECONFIG='telegramConfig.js'
PEMFILE='ssl/key.pem'
SERVERCSR='ssl/server.csr'
BUNDLECERT='ssl/ssl-bundle.crt'
DASHYCERT='ssl/dashy_sg.crt'
SERVERCERT='ssl/server.crt'
COMODOCA='ssl/COMODORSAAddTrustCA.crt'
ADDTRUSTCA='ssl/AddTrustExternalCARoot.crt'
COMODORSA='ssl/COMODORSADomainValidationSecureServerCA.crt'
SERVER='ubuntu@54.255.144.173'
CONFIGTARGETDIR=':~/polybear/app/server/config'
SSLTARGETDIR=':~/polybear/app/ssl'
NGINXCONFIG='server/config/dashy.sg'
NGINXTARGETDIR=':~/polybear/app/server/config'

# scp config files to server
scp $CONFIGDIR$TELECONFIG $SERVER$CONFIGTARGETDIR
scp $PEMFILE $SERVER$SSLTARGETDIR
scp $SERVERCERT $SERVER$SSLTARGETDIR
scp $SERVERCSR $SERVER$SSLTARGETDIR
scp $COMODOCA $SERVER$SSLTARGETDIR
scp $ADDTRUSTCA $SERVER$SSLTARGETDIR
scp $COMODORSA $SERVER$SSLTARGETDIR
scp $BUNDLECERT $SERVER$SSLTARGETDIR
scp $NGINXCONFIG $SERVER$NGINXTARGETDIR
