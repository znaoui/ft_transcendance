FROM postgres:alpine
COPY ./schema.sql /docker-entrypoint-initdb.d/
EXPOSE 5432
CMD ["postgres"]
