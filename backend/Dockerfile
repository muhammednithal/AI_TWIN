FROM golang:1.25-alpine AS build
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -trimpath -ldflags="-s -w" -o /server ./cmd/server

FROM alpine:3.22
RUN apk add --no-cache ca-certificates && addgroup -S twin && adduser -S twin -G twin
COPY --from=build /server /server
USER twin
EXPOSE 8080
ENTRYPOINT ["/server"]
