FROM eclipse-temurin:17-jdk-alpine

WORKDIR /app

# Copiar App.java y gson desde carpeta lib/
COPY App.java .
COPY lib/gson-2.10.1.jar .

RUN javac -cp gson-2.10.1.jar App.java

EXPOSE 8080

CMD ["java", "-cp", ".:gson-2.10.1.jar", "App"]
