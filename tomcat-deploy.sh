#!/bin/bash

service tomcat8 stop
rm -rf /var/log/tomcat8/*
rm -rf /var/lib/tomcat8/webapps/cas*
mv /var/www/drupal/cas-overlay-template/target/cas.war /var/lib/tomcat8/webapps/
service tomcat8 start

