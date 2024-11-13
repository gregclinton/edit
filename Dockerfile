# docker build -t edit .
# sudo docker run -v `pwd`:/root -w /root edit:latest python3 --version

FROM ubuntu:24.04

RUN apt-get -y update && \
    apt-get -y install wget

RUN echo 123 > abc