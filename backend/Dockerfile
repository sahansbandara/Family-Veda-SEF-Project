FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY . .
RUN dotnet publish src/Api/FamilyVeda.Api.csproj -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends tesseract-ocr tesseract-ocr-eng imagemagick poppler-utils \
    && rm -rf /var/lib/apt/lists/*

COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://+:8080
ENV Ocr__TesseractDataPath=/usr/share/tesseract-ocr/5/tessdata
# Debian ships ImageMagick 6, whose CLI entry point is `convert` rather than `magick`.
ENV Ocr__DeskewCommand=convert
EXPOSE 8080

ENTRYPOINT ["dotnet", "FamilyVeda.Api.dll"]
