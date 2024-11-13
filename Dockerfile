# docker build -t solve .
# docker login -u gregclinton password
# docker images
# docker tag effc482e9bf1 gregclinton/solve
# docker push gregclinton/solve
# docker pull gregclinton/solve
# sudo docker run -v `pwd`:/root -w /root gregclinton/solve julia io.jl

FROM ubuntu:20.04

RUN apt-get -y update && \
    apt-get -y install wget

RUN wget https://julialang-s3.julialang.org/bin/linux/x64/1.6/julia-1.6.0-linux-x86_64.tar.gz && \
    tar -x -f julia-1.6.0-linux-x86_64.tar.gz -C /usr/local --strip-components 1 && \
    julia -e 'using Pkg; Pkg.add("IJulia")'

RUN echo 123 > abc