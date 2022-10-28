FROM python:3-alpine

RUN apk update \
  && apk add --virtual build-deps gcc python3-dev musl-dev \
  && apk add postgresql-dev \
  && pip install psycopg2-binary \
  && pip install psycopg2 \
  && apk del build-deps

RUN pip install --upgrade pip

ADD . /code
WORKDIR /code
RUN pip3 install -r requirements.txt
RUN which python3

CMD [ "/usr/local/bin/python3","pg2kinesis.py" ]