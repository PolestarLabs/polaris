# nice ;)
FROM node:14.8

# Setting dir to src for ts
WORKDIR /src

# Add gitlab secret
ARG SSH_PRIVATE_KEY
RUN mkdir /root/.ssh/
RUN echo "${SSH_PRIVATE_KEY}}" > /root/.ssh/id_rsa
RUN chmod 600 /root/.ssh/id_rsa

# Accept connections
RUN touch /root/.ssh/known_hosts
RUN ssh-keyscan gitlab.com >> /root/.ssh/known_hosts

# Set-up npm & cache deps
ADD package.json /src
RUN npm i

# add the rest of files
ADD . /src

CMD node pollux