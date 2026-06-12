# Build Stage
FROM maven:3.9.6-eclipse-temurin-21-jammy AS build
WORKDIR /app

# Cache Maven dependencies by copying pom.xml first
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source code and build production jar
COPY src ./src
RUN mvn clean package -DskipTests -B

# Run Stage
FROM eclipse-temurin:21-jre-jammy
WORKDIR /app

# Create a secure, non-privileged system user and group
RUN groupadd -r smartpark && useradd -r -g smartpark smartpark

# Copy compiled jar from build stage
COPY --from=build --chown=smartpark:smartpark /app/target/ai-0.0.1-SNAPSHOT.jar /app/smartpark-backend.jar

# Enforce non-root execution
USER smartpark

# Expose server port
EXPOSE 8080

# Configure execution entrypoint with production profile active
ENTRYPOINT ["java", "-Dspring.profiles.active=prod", "-jar", "/app/smartpark-backend.jar"]
