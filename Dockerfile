# docker build -t edit .
# cd to your root folder
# sudo docker run -p 8000:8000 -v `pwd`:/root -w /root edit:latest uvicorn edit.main:app --host 0.0.0.0 --port 8000 --reload

FROM ubuntu:24.04

RUN apt update && apt upgrade -y && \
    apt install -y software-properties-common wget curl && \
    add-apt-repository ppa:deadsnakes/ppa -y && \
    apt update && \
    apt install -y python3.11 && \
    update-alternatives --install /usr/bin/python3 python3 /usr/bin/python3.11 1

RUN curl -sS https://bootstrap.pypa.io/get-pip.py | python3.11 

RUN pip install -U langgraph langsmith langchain_openai langchain_anthropic

RUN pip install fastapi uvicorn

RUN pip install langchain-core langchain-community