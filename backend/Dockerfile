# Build stage
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Project files for restore (layer cache)
COPY ["src/Moc.Api/Moc.Api.csproj", "src/Moc.Api/"]
COPY ["src/Moc.Application/Moc.Application.csproj", "src/Moc.Application/"]
COPY ["src/Moc.Domain/Moc.Domain.csproj", "src/Moc.Domain/"]
COPY ["src/Moc.Infrastructure/Moc.Infrastructure.csproj", "src/Moc.Infrastructure/"]

RUN dotnet restore "src/Moc.Api/Moc.Api.csproj"

COPY src/ src/

RUN dotnet publish "src/Moc.Api/Moc.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app

COPY --from=build /app/publish .

EXPOSE 8080
ENV ASPNETCORE_URLS=http://0.0.0.0:8080

ENTRYPOINT ["dotnet", "Moc.Api.dll"]
