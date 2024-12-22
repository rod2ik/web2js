FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive
ENV DEBCONF_NONINTERACTIVE_SEEN=true
ENV DEBCONF_NOWARNINGS=yes

# Install dependencies
RUN apt-get update \
	&& apt-get install -y --no-install-recommends --no-install-suggests \
		ca-certificates \
		curl \
		g++ \
		git \
		gnupg \
		libkpathsea-dev \
		make \
		texlive \
		texlive-latex-extra \
		texlive-latex-recommended \
		texlive-plain-generic \
	&& curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
	&& apt-get install -y --no-install-recommends --no-install-suggests nodejs \
	&& apt-get clean \
	&& rm -fr /var/lib/apt/lists/* /tmp/*

RUN mkdir -p /opt/web2js
WORKDIR /opt/web2js

CMD ["/bin/bash"]
