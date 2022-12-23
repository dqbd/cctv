# CCTV

## Deployment

### Generate `docker-compose.yml` file

```
jsonnet config/live.jsonnet -Sm .
```

### Remote `docker compose` deployment

```
docker context use [context name]
docker-compose pull
docker-compose down
docker-compose up -d
```