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

RUN npm install -g vtop

# Look at issue #131 for more information.
ENV LC_CTYPE=en_US.UTF-8 

ENTRYPOINT ["vtop"]
