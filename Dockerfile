FROM node:12.18-buster 
MAINTAINER Pranav Shikarpur <contact@snpranav.com>

ENV LANG=en_US.utf8
ENV TERM=xterm-256color

RUN npm install -g vtop

CMD ["vtop"]