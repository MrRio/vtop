<<<<<<< HEAD
#########################
#     # ##### #### ####
 #   #    #   #  # #  #
  # #     #   #  # ####
	 #      #   #### #
#
# Run VTOP by running
# docker run --rm -it --net=host --pid=host snpranav/vtop
#########################
FROM node:12.18-buster 
MAINTAINER Pranav Shikarpur <contact@snpranav.com>

ENV LANG=en_US.utf8
ENV TERM=xterm-256color

RUN npm install -g vtop

CMD ["vtop"]
