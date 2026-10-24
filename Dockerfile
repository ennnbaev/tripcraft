# Single-container image for hosting (Render etc.): Spring Boot serves the API and the React build.
# Local development keeps using docker-compose.yml (separate nginx frontend).

# 1. Frontend bundle
FROM node:22-alpine AS frontend
WORKDIR /app
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# 2. Backend jar with the bundle in classpath:/static
FROM eclipse-temurin:21-jdk AS backend
WORKDIR /app
COPY backend/.mvn .mvn
COPY backend/mvnw backend/pom.xml ./
RUN ./mvnw -q -B dependency:go-offline
COPY backend/src src
COPY --from=frontend /app/dist src/main/resources/static
# Tests need a running Postgres, so they run outside the image build (./mvnw test)
RUN ./mvnw -q -B -DskipTests package

# 3. Runtime
FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=backend /app/target/*.jar app.jar
# Free hosting tiers have ~512 MB RAM: keep the heap well below that
ENV JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=65 -XX:+UseSerialGC -Xss512k -XX:TieredStopAtLevel=1"
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
